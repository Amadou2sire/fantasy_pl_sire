import { useState, useEffect } from "react";
import { getFixtures, getGameweeks } from "../api/fpl";

import DifficultyBadge from "../components/DifficultyBadge";

function Spinner() {
  return <div className="flex justify-center p-8 text-primary">
    <div className="w-8 h-8 border-4 border-current border-t-transparent rounded-full animate-spin" />
  </div>;
}

export default function Fixtures() {
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedGw, setExpandedGw] = useState(null);

  useEffect(() => {
    Promise.all([getFixtures(), getGameweeks()]).then(([fix, gws]) => {
      setFixtures(fix);
      const next = gws.find(g => g.is_next) || gws.find(g => g.is_current) || gws[0];
      if (next) setExpandedGw(next.id);
    }).finally(() => setLoading(false));
  }, []);

  const groupedFixtures = fixtures.reduce((acc, f) => {
    const gw = f.gameweek || "Autres";
    if (!acc[gw]) acc[gw] = [];
    acc[gw].push(f);
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
          <div className="flex flex-col gap-4">
            {Object.entries(groupedFixtures).map(([gw, matches]) => (
              <div key={gw} className="flex flex-col overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all duration-300">
                {/* Accordion Header */}
                <button 
                  onClick={() => setExpandedGw(expandedGw === parseInt(gw) ? null : parseInt(gw))}
                  className={`w-full px-6 py-5 flex items-center justify-between text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30 ${expandedGw === parseInt(gw) ? 'bg-emerald-50/30 dark:bg-emerald-500/5 border-b border-slate-50 dark:border-slate-800' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-xl flex items-center justify-center ${expandedGw === parseInt(gw) ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                       <span className="text-[10px] font-black uppercase">GW</span>
                    </div>
                    <div>
                       <h2 className="font-black text-slate-800 dark:text-white uppercase tracking-tight">Gameweek {gw}</h2>
                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{matches.length} Rencontres</p>
                    </div>
                  </div>
                  <span className={`material-symbols-outlined transition-transform duration-300 ${expandedGw === parseInt(gw) ? 'rotate-180' : ''}`}>expand_more</span>
                </button>

                {/* Accordion Content */}
                <div className={`transition-all duration-300 overflow-hidden ${expandedGw === parseInt(gw) ? 'max-h-[1500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                          <th className="px-6 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Date & Heure</th>
                          <th className="px-6 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Domicile</th>
                          <th className="px-2 py-3 text-center text-[10px] font-black uppercase tracking-wider text-slate-400">FDR</th>
                          <th className="px-6 py-3 text-center text-[10px] font-black uppercase tracking-wider text-slate-400 w-32">Scoring</th>
                          <th className="px-2 py-3 text-center text-[10px] font-black uppercase tracking-wider text-slate-400">FDR</th>
                          <th className="px-6 py-3 text-right text-[10px] font-black uppercase tracking-wider text-slate-400">Extérieur</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                        {matches.map(f => (
                          <tr key={f.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-all group">
                            <td className="px-6 py-5 text-[10px] text-slate-400 whitespace-nowrap font-bold uppercase">
                              {f.kickoff ? new Date(f.kickoff).toLocaleDateString("fr-FR", { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : "À confirmer"}
                            </td>
                            <td className="px-6 py-5">
                              <span className="font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">{f.home_team}</span>
                            </td>
                            <td className="px-2 py-5 text-center"><DifficultyBadge value={f.home_difficulty} /></td>
                            <td className="px-6 py-5 text-center">
                              {f.finished ? (
                                <div className="inline-flex items-center gap-2 bg-slate-900 text-white px-3 py-1 rounded-lg font-black text-sm shadow-md ring-2 ring-slate-100">
                                  <span>{f.home_score}</span>
                                  <span className="text-slate-500">-</span>
                                  <span>{f.away_score}</span>
                                </div>
                              ) : (
                                <span className="text-xs font-black text-slate-300 uppercase tracking-tighter bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-100 dark:border-slate-700">VS</span>
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
