import { useState, useEffect } from "react";
import { getFixtures } from "../api/fpl";
import DifficultyBadge from "../components/DifficultyBadge";

function Spinner() {
  return <div className="flex justify-center p-8 text-primary">
    <div className="w-8 h-8 border-4 border-current border-t-transparent rounded-full animate-spin" />
  </div>;
}

export default function Fixtures() {
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFixtures().then(setFixtures).finally(() => setLoading(false));
  }, []);

  const groupedFixtures = fixtures.reduce((acc, f) => {
    const date = f.kickoff ? new Date(f.kickoff).toLocaleDateString("fr-FR", { weekday: 'long', day: 'numeric', month: 'long' }) : "Date à confirmer";
    if (!acc[date]) acc[date] = [];
    acc[date].push(f);
    return acc;
  }, {});

  return (
    <main className="flex flex-col max-w-[1024px] mx-auto w-full px-4 py-8 gap-8">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Upcoming Fixtures</h1>
          <p className="text-slate-500 dark:text-slate-400">Match calendar</p>
        </div>
      </section>

      {loading ? <Spinner /> : (
        <div className="flex flex-col gap-8">
          {Object.entries(groupedFixtures).map(([date, matches]) => (
            <div key={date} className="flex flex-col gap-3">
              <h2 className="text-sm font-bold uppercase tracking-widest text-primary dark:text-accent ml-1">{date}</h2>
              <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 w-24">GW</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Home Team</th>
                        <th className="px-4 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500">FDR (H)</th>
                        <th className="px-6 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500">vs</th>
                        <th className="px-4 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500">FDR (A)</th>
                        <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-wider text-slate-500">Away Team</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {matches.map(f => (
                        <tr key={f.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-5 text-sm text-slate-500 whitespace-nowrap font-medium">GW {f.gameweek || "-"}</td>
                          <td className="px-6 py-5 font-semibold text-slate-900 dark:text-white">{f.home_team}</td>
                          <td className="px-4 py-5"><DifficultyBadge value={f.home_difficulty} /></td>
                          <td className="px-6 py-5 text-center font-bold text-slate-400">VS</td>
                          <td className="px-4 py-5"><DifficultyBadge value={f.away_difficulty} /></td>
                          <td className="px-6 py-5 text-right font-semibold text-slate-900 dark:text-white">{f.away_team}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
