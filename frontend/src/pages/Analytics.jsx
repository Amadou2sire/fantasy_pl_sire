import { useState, useEffect, useRef } from "react";
import { getPlayers, getPredictions, getTeams } from "../api/fpl";

/* ── helpers ────────────────────────────────────────────────── */
function Spinner() {
  return (
    <div className="flex justify-center items-center py-20">
      <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
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
    const colors = top.map((_, i) => `hsl(${145 - i * 6}, 65%, ${55 - i * 1.5}%)`);

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
            callbacks: {
              label: ctx => ` ${ctx.raw} pts prédits`
            }
          }
        },
        scales: {
          x: {
            grid: { color: "rgba(255,255,255,0.06)" },
            ticks: { color: "#94a3b8", font: { size: 12 } },
          },
          y: {
            grid: { display: false },
            ticks: { color: "#cbd5e1", font: { size: 12, weight: "bold" } }
          }
        }
      }
    });
  });

  return (
    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl">
      <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
        <span className="material-symbols-outlined text-emerald-400">bar_chart</span>
        Top 15 – Points prédits (prochain GW)
      </h2>
      <p className="text-slate-400 text-sm mb-5">Combinaison Form + ICT + xG/xA pondérée par le FDR</p>
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
      norm(p.total_points, maxPts),
      norm(parseFloat(p.form), maxForm),
      norm(parseFloat(p.xg), maxXg),
      norm(parseFloat(p.xa), maxXa),
      norm(p.bps, maxBps),
      norm(p.minutes, maxMins),
    ];

    if (chartRef.current) chartRef.current.destroy();

    chartRef.current = new window.Chart(ref.current, {
      type: "radar",
      data: {
        labels: ["Total Pts", "Forme", "xG", "xA", "BPS", "Minutes"],
        datasets: [
          {
            label: p1.web_name,
            data: toRadar(p1),
            backgroundColor: "rgba(52,211,153,0.2)",
            borderColor: "#34d399",
            pointBackgroundColor: "#34d399",
            borderWidth: 2,
          },
          {
            label: p2.web_name,
            data: toRadar(p2),
            backgroundColor: "rgba(96,165,250,0.2)",
            borderColor: "#60a5fa",
            pointBackgroundColor: "#60a5fa",
            borderWidth: 2,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            min: 0, max: 100, ticks: { display: false },
            grid: { color: "rgba(255,255,255,0.1)" },
            angleLines: { color: "rgba(255,255,255,0.1)" },
            pointLabels: { color: "#cbd5e1", font: { size: 13, weight: "600" } }
          }
        },
        plugins: {
          legend: { labels: { color: "#fff", font: { size: 13, weight: "bold" } } }
        }
      }
    });
  });

  // Re-render chart when picks change
  useEffect(() => {
    if (!window.Chart) return;
    const [p1, p2] = selectedPlayers;
    if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }
    if (p1 && p2 && ref.current) {
      // trigger redraw by calling same logic via a tiny timeout
      setTimeout(() => {
        const ev = new Event("Chart.js-redraw");
        ref.current?.dispatchEvent(ev);
      }, 50);
      // Easier: just force re-mount by calling the hook dependency manually
      const norm = (val, max) => max > 0 ? Math.min(100, Math.round((val / max) * 100)) : 0;
      const maxPts = Math.max(...players.map(p => p.total_points || 0)) || 1;
      const maxForm = Math.max(...players.map(p => parseFloat(p.form) || 0)) || 1;
      const maxXg   = Math.max(...players.map(p => parseFloat(p.xg) || 0)) || 1;
      const maxXa   = Math.max(...players.map(p => parseFloat(p.xa) || 0)) || 1;
      const maxBps  = Math.max(...players.map(p => p.bps || 0)) || 1;
      const maxMins = Math.max(...players.map(p => p.minutes || 0)) || 1;
      const toR = (p) => [
        norm(p.total_points, maxPts), norm(parseFloat(p.form), maxForm),
        norm(parseFloat(p.xg), maxXg), norm(parseFloat(p.xa), maxXa),
        norm(p.bps, maxBps), norm(p.minutes, maxMins),
      ];
      chartRef.current = new window.Chart(ref.current, {
        type: "radar",
        data: {
          labels: ["Total Pts", "Forme", "xG", "xA", "BPS", "Minutes"],
          datasets: [
            { label: p1.web_name, data: toR(p1), backgroundColor: "rgba(52,211,153,0.2)", borderColor: "#34d399", pointBackgroundColor: "#34d399", borderWidth: 2 },
            { label: p2.web_name, data: toR(p2), backgroundColor: "rgba(96,165,250,0.2)", borderColor: "#60a5fa", pointBackgroundColor: "#60a5fa", borderWidth: 2 }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          scales: { r: { min: 0, max: 100, ticks: { display: false }, grid: { color: "rgba(255,255,255,0.1)" }, angleLines: { color: "rgba(255,255,255,0.1)" }, pointLabels: { color: "#cbd5e1", font: { size: 13, weight: "600" } } } },
          plugins: { legend: { labels: { color: "#fff", font: { size: 13, weight: "bold" } } } }
        }
      });
    }
  }, [picks]);

  const PlayerPicker = ({ idx }) => (
    <div className="flex flex-col gap-2 flex-1">
      <label className="text-xs font-bold uppercase tracking-widest text-slate-400">
        {idx === 0 ? "🟢 Joueur 1" : "🔵 Joueur 2"}
      </label>
      <input
        value={search[idx]}
        onChange={e => setSearch(s => { const n=[...s]; n[idx]=e.target.value; return n; })}
        placeholder="Chercher un joueur…"
        className="bg-slate-700 border border-slate-600 text-white placeholder-slate-400 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-emerald-500 w-full"
      />
      {search[idx] && filtered(idx).length > 0 && (
        <div className="bg-slate-700 border border-slate-600 rounded-xl overflow-hidden shadow-xl z-10">
          {filtered(idx).map(p => (
            <button key={p.id}
              className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-600 transition flex justify-between"
              onClick={() => {
                setPicks(pk => { const n=[...pk]; n[idx]=p.id; return n; });
                setSearch(s => { const n=[...s]; n[idx]=p.web_name; return n; });
              }}>
              <span className="font-bold">{p.web_name}</span>
              <span className="text-slate-400">{p.position} · {p.team}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl">
      <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
        <span className="material-symbols-outlined text-blue-400">compare_arrows</span>
        Comparateur de joueurs
      </h2>
      <p className="text-slate-400 text-sm mb-5">Comparez les profils sur 6 dimensions clés (normalisées sur 100)</p>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <PlayerPicker idx={0} />
        <div className="flex items-center justify-center text-slate-500 font-black text-lg mt-6">VS</div>
        <PlayerPicker idx={1} />
      </div>

      {selectedPlayers[0] && selectedPlayers[1] ? (
        <div style={{ height: "360px" }}>
          <canvas ref={ref} />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-slate-600 rounded-2xl text-slate-500">
          <span className="material-symbols-outlined text-4xl mb-2">person_search</span>
          <p className="text-sm font-semibold">Sélectionnez 2 joueurs pour voir le radar</p>
        </div>
      )}

      {/* Stats table */}
      {selectedPlayers[0] && selectedPlayers[1] && (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-2 text-slate-400 font-bold">Stat</th>
                <th className="text-right py-2 text-emerald-400 font-bold">{selectedPlayers[0].web_name}</th>
                <th className="text-right py-2 text-blue-400 font-bold">{selectedPlayers[1].web_name}</th>
              </tr>
            </thead>
            <tbody>
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
                  <tr key={label} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition">
                    <td className="py-2 text-slate-400">{label}</td>
                    <td className={`py-2 text-right font-bold ${Number(v1) > Number(v2) ? "text-emerald-400" : "text-white"}`}>{v1}</td>
                    <td className={`py-2 text-right font-bold ${Number(v2) > Number(v1) ? "text-blue-400" : "text-white"}`}>{v2}</td>
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

        // Enrich predictions with player label
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
    <main className="flex-1 w-full max-w-[1440px] mx-auto p-4 md:p-8 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">
          Analytics & Comparateur
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">
          Visualisez les prédictions et comparez les profils de joueurs en temps réel
        </p>
      </div>

      {/* Charts */}
      <TopPredictionsChart data={state.predictions} />
      <RadarComparator players={state.players} />
    </main>
  );
}
