import { useState, useEffect, useRef } from "react";
import { getPlayers, getPredictions, getTeams, getLeagueComparison, getUserHistory, getUserTeam } from "../api/fpl";

/* ── helpers ────────────────────────────────────────────────── */
function Spinner() {
  return (
    <div className="flex justify-center items-center py-20">
      <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

/* ── Modal : Team Details ───────────────────────────────────── */
function TeamDetailsModal({ entry, onClose }) {
  if (!entry) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white border border-slate-200 w-full max-w-4xl max-h-[90vh] rounded-[32px] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="size-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
               <span className="material-symbols-outlined text-3xl">sports_soccer</span>
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 leading-tight">{entry.name}</h3>
              <p className="text-sm text-slate-400 font-medium">Historique & Composition actuelle</p>
            </div>
          </div>
          <button onClick={onClose} className="size-10 flex items-center justify-center hover:bg-slate-100 rounded-full text-slate-400 transition active:scale-90">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">

          {entry.loading ? (
             <Spinner />
          ) : (
            <>
              {/* Squad Section */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">groups</span>
                    Composition Équipe
                  </h4>
                  <span className="text-[10px] font-bold text-slate-400">11 Titulaires</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {entry.team.map(p => (
                    <div key={p.id} className="bg-slate-50 border border-slate-100 p-3 rounded-2xl flex items-center justify-between hover:border-emerald-500 transition">
                      <div>
                        <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                          {p.web_name}
                          {p.is_captain && <span className="bg-emerald-500 text-[8px] px-1 rounded text-white">C</span>}
                        </p>
                        <p className="text-[10px] text-slate-400 uppercase font-black">{p.position} · {p.team}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-black ${p.points > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>{p.points} pts</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* History Section */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">history</span>
                    Performance Gameweeks
                  </h4>
                  <span className="text-[10px] font-bold text-slate-400">Saison en cours</span>
                </div>
                
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-inner">
                   <div className="flex items-end gap-1.5 h-32">
                     {entry.history.map(gw => (
                       <div key={gw.event} className="flex-1 group relative h-full flex flex-col justify-end">
                         <div 
                           style={{ height: `${Math.max(10, Math.min(100, (gw.points / 120) * 100))}%` }}
                           className="bg-blue-500 group-hover:bg-blue-600 rounded-lg transition-all cursor-crosshair"
                         />
                         <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover:block bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-2xl scale-110 z-20 whitespace-nowrap after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-slate-900">
                           GW{gw.event}: {gw.points} pts
                         </div>
                       </div>
                     ))}
                   </div>
                   <div className="flex justify-between text-[10px] text-slate-400 mt-4 font-black uppercase tracking-widest border-t border-slate-50 pt-3">
                     <span>Début</span>
                     <span className="text-blue-600 font-black">Total: {entry.history.reduce((a,b)=>a+b.points,0)} pts</span>
                     <span>Dernière GW</span>
                   </div>
                </div>
                
                <div className="mt-8 overflow-hidden rounded-2xl border border-slate-100">
                   <table className="w-full text-left">
                     <thead className="bg-slate-50 border-b border-slate-100">
                       <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                         <th className="px-4 py-3">Week</th>
                         <th className="px-4 py-3 text-right">Points</th>
                         <th className="px-4 py-3 text-right">Moy. Rang GW</th>
                         <th className="px-4 py-3 text-right">Rang Global</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {entry.history.slice(-8).reverse().map(gw => (
                          <tr key={gw.event} className="hover:bg-slate-50 transition group">
                            <td className="px-4 py-3 text-sm text-slate-600 font-bold group-hover:text-black">Gameweek {gw.event}</td>
                            <td className="px-4 py-3 text-right text-emerald-600 font-black text-sm">{gw.points}</td>
                            <td className="px-4 py-3 text-right text-slate-400 font-medium">{gw.rank.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right text-slate-400">{gw.overall_rank.toLocaleString()}</td>
                          </tr>
                        ))}
                     </tbody>
                   </table>
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── League Comparison : Top 5 Comparison ───────────────────── */
function LeagueComparison() {
  const [leagueId, setLeagueId] = useState("");
  const [userId, setUserId] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedEntry, setSelectedEntry] = useState(null);

  useEffect(() => {
    const savedLeagueId = localStorage.getItem("fpl_league_id");
    const savedUserId = localStorage.getItem("fpl_team_id");
    if (savedLeagueId) setLeagueId(savedLeagueId);
    if (savedUserId) setUserId(savedUserId);

    if (savedLeagueId && savedUserId) {
      getLeagueComparison(savedLeagueId, savedUserId).then(res => {
        if (!res.error) setData(res);
      }).catch(err => console.error("Auto-fetch failed", err));
    }
  }, []);

  const handleCompare = async () => {
    if (!leagueId || !userId) {
      setError("Veuillez entrer un League ID et votre Team ID.");
      return;
    }
    
    localStorage.setItem("fpl_league_id", leagueId);
    localStorage.setItem("fpl_team_id", userId);

    setLoading(true);
    setError("");
    try {
      const res = await getLeagueComparison(leagueId, userId);
      if (res.error) throw new Error(res.error);
      setData(res);
    } catch (err) {
      setError(err.message || "Erreur lors de la récupération des données.");
    } finally {
      setLoading(false);
    }
  };

  const handleEntryClick = async (entry_id, name) => {
    setSelectedEntry({ id: entry_id, name, loading: true });
    try {
      const [history, team] = await Promise.all([
        getUserHistory(entry_id),
        getUserTeam(entry_id)
      ]);
      setSelectedEntry({
        id: entry_id,
        name,
        history: history.current || [],
        team: team.team || [],
        loading: false
      });
    } catch (err) {
      setSelectedEntry(null);
      alert("Erreur lors du chargement des détails.");
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm transition-all focus-within:shadow-md">
      <h2 className="text-xl font-bold text-slate-900 mb-1 flex items-center gap-2">
        <span className="material-symbols-outlined text-amber-500">leaderboard</span>
        Comparaison de Ligue (Top 5)
      </h2>
      <p className="text-slate-400 text-sm mb-6">Comparez vos points avec le Top 5 de votre ligue classique</p>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">League ID</label>
          <input
            type="number"
            value={leagueId}
            onChange={e => setLeagueId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-900 text-sm focus:border-violet-500 outline-none transition-colors"
            placeholder="Ex: 314"
          />
        </div>
        <div className="flex-1">
          <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Votre Team ID</label>
          <input
            type="number"
            value={userId}
            onChange={e => setUserId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-900 text-sm focus:border-violet-500 outline-none transition-colors"
            placeholder="Ex: 123456"
          />
        </div>
        <button
          onClick={handleCompare}
          disabled={loading}
          className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-200 text-white font-black uppercase tracking-widest text-xs rounded-xl px-8 h-10 mt-5 transition-all shadow-lg active:scale-95"
        >
          {loading ? "Chargement..." : "Comparer"}
        </button>
      </div>

      {error && <p className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>}

      {data && (
        <div className="space-y-6">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase">Mon Équipe</p>
              <h3 className="text-lg font-black text-slate-900">{data.user.name}</h3>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-emerald-600">{data.user.total_points} pts</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Total Saison</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-100">
                  <th className="pb-3 text-[10px] font-black uppercase">Rang</th>
                  <th className="pb-3 text-[10px] font-black uppercase">Équipe</th>
                  <th className="pb-3 text-[10px] font-black uppercase">Manager</th>
                  <th className="pb-3 text-right text-[10px] font-black uppercase">Points</th>
                  <th className="pb-3 text-right text-[10px] font-black uppercase">Écart</th>
                </tr>
              </thead>
              <tbody>
                {data.top_5.map((entry) => {
                  const diff = entry.total_points - data.user.total_points;
                  return (
                    <tr 
                      key={entry.entry_id} 
                      onClick={() => handleEntryClick(entry.entry_id, entry.entry_name)}
                      className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors group"
                    >
                      <td className="py-4 font-bold text-slate-400 group-hover:text-black">#{entry.rank}</td>
                      <td className="py-4 text-slate-900 font-bold group-hover:text-violet-600 transition-colors">
                        {entry.entry_name}
                      </td>
                      <td className="py-4 text-slate-500">{entry.player_name}</td>
                      <td className="py-4 text-right font-black text-slate-900">{entry.total_points}</td>
                      <td className={`py-4 text-right font-black ${diff > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                        {diff > 0 ? `+${diff}` : diff}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedEntry && (
        <TeamDetailsModal 
          entry={selectedEntry} 
          onClose={() => setSelectedEntry(null)} 
        />
      )}
    </div>
  );
}

/** Inject Chart.js from CDN once */
function useChartJs(cb) {
  useEffect(() => {
    if (window.Chart) { cb(); return; }
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js";
    s.onload = cb;
    document.head.appendChild(s);
  }, []);
}

/* ── Bar Chart : Top 15 Predicted Points ───────────────────── */
function TopPredictionsChart({ data }) {
  const ref = useRef(null);
  const chartRef = useRef(null);

  useChartJs(() => {
    if (!ref.current || !data.length) return;
    if (chartRef.current) chartRef.current.destroy();

    const top = data.slice(0, 15);
    const colors = top.map((_, i) => `hsl(${145 - i * 4}, 60%, ${45 + i * 1}%)`);

    chartRef.current = new window.Chart(ref.current, {
      type: "bar",
      data: {
        labels: top.map(p => p.label),
        datasets: [{
          label: "Points prédits",
          data: top.map(p => p.predicted_points),
          backgroundColor: colors,
          borderRadius: 8,
          borderSkipped: false,
        }]
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#1e293b",
            padding: 12,
            titleFont: { size: 14, weight: "bold" },
            bodyFont: { size: 13 },
            callbacks: {
              label: ctx => ` ${ctx.raw} pts prédits`
            }
          }
        },
        scales: {
          x: {
            grid: { color: "rgba(0,0,0,0.03)" },
            ticks: { color: "#64748b", font: { size: 12 } },
          },
          y: {
            grid: { display: false },
            ticks: { color: "#334155", font: { size: 12, weight: "600" } }
          }
        }
      }
    });
  });

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
      <h2 className="text-xl font-bold text-slate-900 mb-1 flex items-center gap-2">
        <span className="material-symbols-outlined text-emerald-500">bar_chart</span>
        Top 15 – Points prédits
      </h2>
      <p className="text-slate-400 text-sm mb-6">Combinaison Form + ICT + xG/xA pondérée par le FDR</p>
      <div style={{ height: "420px" }}>
        <canvas ref={ref} />
      </div>
    </div>
  );
}

/* ── Radar Chart : Comparateur ──────────────────────────────── */
function RadarComparator({ players }) {
  const ref = useRef(null);
  const chartRef = useRef(null);
  const [picks, setPicks] = useState(["", ""]);
  const [search, setSearch] = useState(["", ""]);

  const filtered = (idx) => {
    const q = search[idx].toLowerCase();
    if (!q) return [];
    return players.filter(p =>
      p.web_name.toLowerCase().includes(q) || p.name?.toLowerCase().includes(q)
    ).slice(0, 8);
  };

  const selectedPlayers = picks.map(pid => players.find(p => p.id === Number(pid)));

  useChartJs(() => {
    if (!ref.current) return;
    const [p1, p2] = selectedPlayers;
    if (!p1 || !p2) { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; } return; }

    const norm = (val, max) => max > 0 ? Math.min(100, Math.round((val / max) * 100)) : 0;
    const maxPts = Math.max(...players.map(p => p.total_points || 0)) || 1;
    const maxForm = Math.max(...players.map(p => parseFloat(p.form) || 0)) || 1;
    const maxXg   = Math.max(...players.map(p => parseFloat(p.xg) || 0)) || 1;
    const maxXa   = Math.max(...players.map(p => parseFloat(p.xa) || 0)) || 1;
    const maxBps  = Math.max(...players.map(p => p.bps || 0)) || 1;
    const maxMins = Math.max(...players.map(p => p.minutes || 0)) || 1;

    const toRadar = (p) => [
      norm(p.total_points, maxPts), norm(parseFloat(p.form), maxForm),
      norm(parseFloat(p.xg), maxXg), norm(parseFloat(p.xa), maxXa),
      norm(p.bps, maxBps), norm(p.minutes, maxMins),
    ];

    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new window.Chart(ref.current, {
      type: "radar",
      data: {
        labels: ["Total Pts", "Forme", "xG", "xA", "BPS", "Minutes"],
        datasets: [
          { label: p1.web_name, data: toRadar(p1), backgroundColor: "rgba(16,185,129,0.1)", borderColor: "#10b981", pointBackgroundColor: "#10b981", borderWidth: 2 },
          { label: p2.web_name, data: toRadar(p2), backgroundColor: "rgba(59,130,246,0.1)", borderColor: "#3b82f6", pointBackgroundColor: "#3b82f6", borderWidth: 2 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: {
          r: {
            min: 0, max: 100, ticks: { display: false },
            grid: { color: "rgba(0,0,0,0.05)" },
            angleLines: { color: "rgba(0,0,0,0.05)" },
            pointLabels: { color: "#475569", font: { size: 12, weight: "600" } }
          }
        },
        plugins: {
          legend: { labels: { color: "#1e293b", font: { size: 13, weight: "700" } } }
        }
      }
    });
  });

  const PlayerPicker = ({ idx }) => (
    <div className="flex flex-col gap-2 flex-1">
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
        {idx === 0 ? "🟢 Joueur 1" : "🔵 Joueur 2"}
      </label>
      <input
        value={search[idx]}
        onChange={e => setSearch(s => { const n=[...s]; n[idx]=e.target.value; return n; })}
        placeholder="Chercher un joueur…"
        className="bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500 w-full transition-colors"
      />
      {search[idx] && filtered(idx).length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl z-20">
          {filtered(idx).map(p => (
            <button key={p.id}
              className="w-full text-left px-5 py-3 text-sm text-slate-600 hover:bg-slate-50 transition flex justify-between group"
              onClick={() => {
                setPicks(pk => { const n=[...pk]; n[idx]=p.id; return n; });
                setSearch(s => { const n=[...s]; n[idx]=p.web_name; return n; });
              }}>
              <span className="font-bold group-hover:text-violet-600">{p.web_name}</span>
              <span className="text-slate-400 font-medium">{p.position} · {p.team}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
      <h2 className="text-xl font-bold text-slate-900 mb-1 flex items-center gap-2">
        <span className="material-symbols-outlined text-blue-500">compare_arrows</span>
        Comparateur de joueurs
      </h2>
      <p className="text-slate-400 text-sm mb-6">Comparez les profils sur 6 dimensions clés</p>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <PlayerPicker idx={0} />
        <div className="flex items-center justify-center text-slate-200 font-black text-xl mt-6 px-4">VS</div>
        <PlayerPicker idx={1} />
      </div>

      {selectedPlayers[0] && selectedPlayers[1] ? (
        <div style={{ height: "360px" }}>
          <canvas ref={ref} />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-slate-100 rounded-3xl text-slate-300">
          <span className="material-symbols-outlined text-4xl mb-2">person_search</span>
          <p className="text-xs font-bold uppercase tracking-widest">Sélectionnez 2 joueurs</p>
        </div>
      )}

      {selectedPlayers[0] && selectedPlayers[1] && (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-3 text-slate-400 text-[10px] font-black uppercase">Stat</th>
                <th className="text-right py-3 text-emerald-600 font-black">{selectedPlayers[0].web_name}</th>
                <th className="text-right py-3 text-blue-600 font-black">{selectedPlayers[1].web_name}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {[
                ["Total Pts", "total_points"],
                ["Prix (M£)", p => (p.price || 0).toFixed(1)],
                ["Forme", "form"],
                ["xG", "xg"],
                ["xA", "xa"],
                ["Buts", "goals"],
                ["Passes D.", "assists"],
                ["BPS", "bps"],
                ["Minutes", "minutes"],
                ["Sélection %", p => `${p.selected_by}%`],
              ].map(([label, key]) => {
                const v1 = typeof key === "function" ? key(selectedPlayers[0]) : selectedPlayers[0][key];
                const v2 = typeof key === "function" ? key(selectedPlayers[1]) : selectedPlayers[1][key];
                return (
                  <tr key={label} className="hover:bg-slate-50 transition group">
                    <td className="py-3 text-slate-500 group-hover:text-slate-700">{label}</td>
                    <td className={`py-3 text-right font-black ${Number(v1) > Number(v2) ? "text-emerald-600" : "text-slate-900"}`}>{v1}</td>
                    <td className={`py-3 text-right font-black ${Number(v2) > Number(v1) ? "text-blue-600" : "text-slate-900"}`}>{v2}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ── Main Analytics Page ────────────────────────────────────── */
export default function Analytics() {
  const [state, setState] = useState({ players: [], predictions: [], teams: [], loading: true });

  useEffect(() => {
    Promise.all([getPlayers(), getPredictions(), getTeams()])
      .then(([players, predictions, teams]) => {
        const teamMap = Object.fromEntries(teams.map(t => [t.id, t.short_name]));
        const enriched = predictions
          .map(pred => {
            const p = players.find(pl => pl.id === pred.player_id);
            return p ? { ...pred, label: `${p.web_name} (${teamMap[p.team_id] || p.team || "?"})` } : null;
          })
          .filter(Boolean);
        setState({ players, predictions: enriched, teams, loading: false });
      })
      .catch(() => setState(s => ({ ...s, loading: false })));
  }, []);

  if (state.loading) return <Spinner />;

  return (
    <main className="flex-1 w-full bg-slate-50 min-h-screen">
      <div className="max-w-[1440px] mx-auto p-4 md:p-8 flex flex-col gap-8">
        <div className="flex flex-col gap-1 px-2">
          <h1 className="text-4xl font-black tracking-tighter text-slate-900">
            Analytics & <span className="text-violet-600">Comparateur</span>
          </h1>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">
            Performances en temps réel & Prédictions IA
          </p>
        </div>

        <LeagueComparison />
        <TopPredictionsChart data={state.predictions} />
        <RadarComparator players={state.players} />
      </div>
    </main>
  );
}
