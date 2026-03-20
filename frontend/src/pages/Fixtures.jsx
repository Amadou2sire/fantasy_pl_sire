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
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Calendrier & Résultats</h1>
          <p className="text-slate-500 dark:text-slate-400">Suivez les scores passés et les rencontres à venir</p>
        </div>
      </section>

  
        {loading ? <Spinner /> : (
          <div className="flex flex-col gap-8">
            {Object.entries(groupedFixtures).map(([date, matches]) => (
              <div key={date} className="flex flex-col gap-3">
                <h2 className="text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 ml-1 drop-shadow-sm">{date}</h2>
                <div className="overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400 w-24">GW</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Domicile</th>
                          <th className="px-2 py-4 text-center text-[10px] font-black uppercase tracking-wider text-slate-400">FDR</th>
                          <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-wider text-slate-400 w-32">Résultat</th>
                          <th className="px-2 py-4 text-center text-[10px] font-black uppercase tracking-wider text-slate-400">FDR</th>
                          <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-wider text-slate-400">Extérieur</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                        {matches.map(f => (
                          <tr key={f.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-all group">
                            <td className="px-6 py-5 text-xs text-slate-400 whitespace-nowrap font-bold">GW {f.gameweek || "-"}</td>
                            <td className="px-6 py-5">
                              <span className="font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">{f.home_team}</span>
                            </td>
                            <td className="px-2 py-5 text-center"><DifficultyBadge value={f.home_difficulty} /></td>
                            <td className="px-6 py-5 text-center">
                              {f.finished ? (
                                <div className="inline-flex items-center gap-2 bg-slate-900 text-white px-3 py-1 rounded-lg font-black text-sm shadow-sm ring-2 ring-slate-100">
                                  <span>{f.home_score}</span>
                                  <span className="text-slate-500">-</span>
                                  <span>{f.away_score}</span>
                                </div>
                              ) : (
                                <span className="text-xs font-black text-slate-300 uppercase tracking-tighter">VS</span>
                              )}
                            </td>
                            <td className="px-2 py-5 text-center"><DifficultyBadge value={f.away_difficulty} /></td>
                            <td className="px-6 py-5 text-right font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">{f.away_team}</td>
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
