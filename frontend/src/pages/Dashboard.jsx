import { useState, useEffect } from "react";
import { getCurrentGameweek, getPlayers, getFixtures, getLatestDreamTeam } from "../api/fpl";
import PlayerCard from "../components/PlayerCard";
import DifficultyBadge from "../components/DifficultyBadge";

function Spinner() {
  return <div className="flex justify-center flex-1 py-16">
    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>;
}

function useAsync(fn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    fn().then(setData).finally(() => setLoading(false));
  }, deps);
  return { data, loading };
}

export default function Dashboard() {
  const { data: gw, loading: lgw } = useAsync(getCurrentGameweek);
  const { data: players, loading: lp } = useAsync(() => getPlayers("", "", 6));
  const { data: fixtures, loading: lf } = useAsync(() => getFixtures());
  const { data: dreamTeam, loading: ldt } = useAsync(() => getLatestDreamTeam());

  const renderPlayersByPos = (pos) => {
    if (!dreamTeam || !dreamTeam.team) return null;
    const posPlayers = dreamTeam.team.filter(p => p.position === pos);
    return (
      <div className="flex justify-center gap-4 md:gap-8 w-full relative z-10 mb-4">
        {posPlayers.map(p => (
          <div key={p.id} className="flex flex-col items-center">
            <div className="w-12 h-12 bg-white/10 border border-white/20 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg backdrop-blur-sm mb-1">
              {p.points}
            </div>
            <div className="bg-[#1E40AF] px-2 py-0.5 rounded text-[10px] font-bold text-white whitespace-nowrap overflow-hidden text-ellipsis max-w-[80px]">
              {p.name}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <main className="flex-1 flex flex-col lg:flex-row max-w-[1440px] mx-auto w-full p-4 md:p-8 gap-8">
        <div className="flex-1 flex flex-col gap-8">

          {/* Game Week Overview */}
          <section className="flex flex-col gap-6">
            {lgw ? <Spinner /> : gw && (
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h1 className="text-4xl font-black tracking-tighter uppercase text-slate-900 dark:text-white">{gw.name}</h1>
                  <p className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2 mt-1">
                    <span className="material-symbols-outlined text-sm">event</span>
                    Deadline: {new Date(gw.deadline_time).toLocaleString("fr-FR")}
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="flex flex-col bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 p-4 rounded-xl min-w-[140px]">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Average Score</span>
                    <span className="text-3xl font-black text-slate-900 dark:text-white">{gw.average_entry_score ?? "—"}</span>
                  </div>
                  <div className="flex flex-col p-4 rounded-xl min-w-[140px] shadow-lg shadow-blue-500/20 bg-primary">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-100">Top Score</span>
                    <span className="text-3xl font-black text-white">{gw.highest_score ?? "—"}</span>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Team of the Week Pitch (Static Template Layout) */}
          <section className="bg-primary rounded-2xl overflow-hidden shadow-2xl relative">
            <div className="min-h-[600px] w-full p-6 flex flex-col items-center relative bg-center bg-cover" style={{ backgroundImage: "linear-gradient(to bottom, rgba(15, 23, 41, 0.8), rgba(15, 23, 41, 0.95)), url('https://lh3.googleusercontent.com/aida-public/AB6AXuBQM4a0CD_tqd1qchsRcwIBFT_z-vFdFXUhVDLXlURrLsNqtpil1SDufZ7J3u22rtRn8GHYTlCWkVFEVEABDLzUMqAex-QDbxQeJ9L5qzGg9Drepc6GkpXDEGV5DXWjPPKBFRqzafcObnOf9bik_jEaYVPJadzXkyv9VLUAhq_49MRiRpSvwnTlQ8w1zsdzPPv-r5qGe8oJTdeOUc5i0o2bvNjoVVFHHuk7jPQ-GhtG_K_y_5TuUTGKYzf8KXJ_E9rNN2xW3E9zYCM')" }}>
              <div className="absolute inset-0 bg-gradient-to-t from-primary/90 to-transparent"></div>
              <h2 className="relative z-10 text-xl font-bold text-white mb-4 self-start flex items-center gap-2">
                <span className="material-symbols-outlined">star</span>
                Team of the Week {dreamTeam?.gameweek ? `(GW ${dreamTeam.gameweek})` : ''}
              </h2>
              {ldt ? <Spinner /> : dreamTeam && dreamTeam.team.length > 0 ? (
                <div className="w-full h-full relative z-10 flex flex-col items-center justify-center p-8 text-white/50 border-2 border-dashed border-white/20 rounded-xl flex-1 mt-4">
                  <div className="w-full flex-1 flex flex-col justify-between py-4">
                    {renderPlayersByPos("GKP")}
                    {renderPlayersByPos("DEF")}
                    {renderPlayersByPos("MID")}
                    {renderPlayersByPos("FWD")}
                  </div>
                </div>
              ) : (
                <div className="w-full h-full relative z-10 flex flex-col items-center justify-center p-8 text-white/50 border-2 border-dashed border-white/20 rounded-xl flex-1 mt-4">
                  <span className="material-symbols-outlined text-4xl mb-2">sports_soccer</span>
                  <p className="text-sm font-semibold">Pitch View</p>
                  <p className="text-xs">No Dream Team available yet.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="w-full lg:w-80 flex flex-col gap-6">

          {/* Next Fixtures */}
          <div className="bg-white dark:bg-primary border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-lg dark:text-white">Upcoming Fixtures</h3>
              <button className="text-xs font-bold text-blue-500 uppercase tracking-wide">View All</button>
            </div>
            <div className="p-2">
              {lf ? <Spinner /> : (fixtures || []).slice(0, 5).map(f => (
                <div key={f.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3 w-16">
                    <span className="text-sm font-bold dark:text-white">{f.home_team}</span>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded text-xs font-black tracking-widest text-slate-500 w-16 text-center">
                    {f.gameweek ? `GW${f.gameweek}` : "—"}
                  </div>
                  <div className="flex items-center gap-3 flex-row-reverse w-16">
                    <span className="text-sm font-bold dark:text-white">{f.away_team}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Form Players */}
          <div className="bg-white dark:bg-primary border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-lg mb-4 dark:text-white">Top Form Players</h3>
            <div className="flex flex-col gap-4">
              {lp ? <Spinner /> : (players || []).map((p, i) => (
                <div key={p.id} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs dark:text-white text-slate-700">#{i + 1}</div>
                  <div className="flex-1">
                    <p className="text-sm font-bold dark:text-white">{p.web_name}</p>
                    <p className="text-xs text-slate-500">{p.team} • {p.position}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-blue-500">{p.form}</p>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Form</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </aside>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-primary py-8 px-10 text-center">
        <p className="text-slate-500 text-sm">© 2024 Fantasy League Manager. All rights reserved.</p>
      </footer>
    </>
  );
}
