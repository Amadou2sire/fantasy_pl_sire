import { useState, useEffect, useMemo } from "react";
import { getPlayers, getPredictions } from "../api/fpl";

/* ─── Spinner ─────────────────────────────────────────────── */
function Spinner() {
  return (
    <div className="flex justify-center items-center py-20">
      <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

/* ─── Delta badge ─────────────────────────────────────────── */
function DeltaBadge({ value, suffix = "" }) {
  const pos = value > 0;
  const zero = value === 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-black px-2 py-0.5 rounded-full
      ${zero ? "bg-slate-700 text-slate-400"
        : pos ? "bg-emerald-900/60 text-emerald-300"
               : "bg-red-900/60 text-red-300"}`}>
      {pos ? "▲" : zero ? "—" : "▼"} {Math.abs(value).toFixed(1)}{suffix}
    </span>
  );
}

/* ─── Position colors ─────────────────────────────────────── */
const POS_COLOR = { GKP: "amber", DEF: "blue", MID: "emerald", FWD: "red" };
function PosBadge({ pos }) {
  const c = POS_COLOR[pos] || "slate";
  return (
    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded
      bg-${c}-900/50 text-${c}-300 border border-${c}-700/50`}>{pos}</span>
  );
}

/* ─── Suggestion card ─────────────────────────────────────── */
function SuggestionCard({ candidate, outPlayer, rank }) {
  const deltaPts   = +(candidate.predicted_points - outPlayer.predicted_pts).toFixed(1);
  const deltaPrice = +(candidate.price - outPlayer.price).toFixed(1);

  return (
    <div className={`relative bg-slate-800 border rounded-2xl p-5 flex flex-col gap-3 
        shadow-lg transition-all hover:scale-[1.02] hover:shadow-violet-500/20
        ${rank === 1 ? "border-violet-500 shadow-violet-500/30" : "border-slate-700"}`}>
      
      {rank === 1 && (
        <div className="absolute -top-3 left-4 bg-violet-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-0.5 rounded-full shadow">
          ⭐ Meilleur choix
        </div>
      )}

      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-black text-lg text-white leading-tight">{candidate.web_name}</p>
          <p className="text-slate-400 text-xs font-medium mt-0.5">{candidate.team}</p>
        </div>
        <PosBadge pos={candidate.position} />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-slate-700/50 rounded-xl p-2">
          <p className="text-[10px] uppercase tracking-wide text-slate-500 font-bold">Pts prédits</p>
          <p className="text-xl font-black text-violet-400">{candidate.predicted_points}</p>
        </div>
        <div className="bg-slate-700/50 rounded-xl p-2">
          <p className="text-[10px] uppercase tracking-wide text-slate-500 font-bold">Δ Points</p>
          <DeltaBadge value={deltaPts} />
        </div>
        <div className="bg-slate-700/50 rounded-xl p-2">
          <p className="text-[10px] uppercase tracking-wide text-slate-500 font-bold">Δ Prix</p>
          <DeltaBadge value={deltaPrice} suffix="M" />
        </div>
      </div>

      {/* Secondary stats */}
      <div className="flex flex-wrap gap-3 text-xs text-slate-400 font-medium border-t border-slate-700 pt-3">
        <span>Form: <b className="text-white">{candidate.form}</b></span>
        <span>xG: <b className="text-white">{(candidate.xg || 0).toFixed(2)}</b></span>
        <span>xA: <b className="text-white">{(candidate.xa || 0).toFixed(2)}</b></span>
        <span>Prix: <b className="text-white">£{candidate.price}M</b></span>
        <span>Sél: <b className="text-white">{candidate.selected_by}%</b></span>
      </div>
    </div>
  );
}

/* ─── Main Transfer Optimizer ─────────────────────────────── */
export default function Transfers() {
  const [state, setState] = useState({ players: [], predictions: [], loading: true });
  const [search, setSearch]       = useState("");
  const [outPlayer, setOutPlayer] = useState(null);
  const [budget, setBudget]       = useState(0);        // extra budget in £M
  const [posFilter, setPosFilter] = useState("ALL");
  const [suggestions, setSuggestions] = useState([]);

  /* Load data */
  useEffect(() => {
    Promise.all([getPlayers(), getPredictions()])
      .then(([players, predictions]) => {
        const predMap = Object.fromEntries(predictions.map(p => [p.player_id, p.predicted_points]));
        const enriched = players.map(p => ({
          ...p,
          predicted_pts: predMap[p.id] ?? 0,
        }));
        setState({ players: enriched, predictions, loading: false });
      })
      .catch(() => setState(s => ({ ...s, loading: false })));
  }, []);

  /* Filtered search list */
  const searchResults = useMemo(() => {
    if (!search || search.length < 2) return [];
    const q = search.toLowerCase();
    return state.players
      .filter(p =>
        (p.web_name.toLowerCase().includes(q) || p.name?.toLowerCase().includes(q)) &&
        (posFilter === "ALL" || p.position === posFilter)
      )
      .sort((a, b) => b.predicted_pts - a.predicted_pts)
      .slice(0, 10);
  }, [search, posFilter, state.players]);

  /* Generate suggestions when outPlayer is set */
  useEffect(() => {
    if (!outPlayer) { setSuggestions([]); return; }
    const maxPrice = outPlayer.price + budget;
    const candidates = state.players
      .filter(p =>
        p.id !== outPlayer.id &&
        p.position === outPlayer.position &&
        p.price <= maxPrice &&
        p.predicted_pts > 0
      )
      .sort((a, b) => b.predicted_pts - a.predicted_pts)
      .slice(0, 9);
    setSuggestions(candidates);
  }, [outPlayer, budget, state.players]);

  const positions = ["ALL", "GKP", "DEF", "MID", "FWD"];

  if (state.loading) return <Spinner />;

  return (
    <main className="flex-1 w-full max-w-[1440px] mx-auto p-4 md:p-8 flex flex-col gap-8">

      {/* Header */}
      <div>
        <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white flex items-center gap-3">
          <span className="text-violet-400">↔</span> Optimiseur de Transferts
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
          Sélectionnez un joueur à remplacer — l'IA vous propose les meilleurs échanges possibles
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">

        {/* ── LEFT: Selector panel ── */}
        <aside className="w-full lg:w-96 flex flex-col gap-5 flex-shrink-0">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 flex flex-col gap-5 shadow-xl">
            <h2 className="font-bold text-white text-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-violet-400">person_remove</span>
              Joueur à transférer
            </h2>

            {/* Position filter */}
            <div>
              <label className="text-xs uppercase font-bold tracking-widest text-slate-400 mb-2 block">
                Poste
              </label>
              <div className="flex flex-wrap gap-2">
                {positions.map(pos => (
                  <button key={pos}
                    onClick={() => { setPosFilter(pos); setSearch(""); setOutPlayer(null); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition
                      ${posFilter === pos
                        ? "bg-violet-600 text-white shadow shadow-violet-500/30"
                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"}`}>
                    {pos}
                  </button>
                ))}
              </div>
            </div>

            {/* Search */}
            <div>
              <label className="text-xs uppercase font-bold tracking-widest text-slate-400 mb-2 block">
                Nom du joueur
              </label>
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setOutPlayer(null); }}
                placeholder="Ex: Haaland, Salah…"
                className="w-full bg-slate-700 border border-slate-600 text-white placeholder-slate-400 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500 transition"
              />
              {searchResults.length > 0 && !outPlayer && (
                <div className="mt-2 bg-slate-700 border border-slate-600 rounded-xl overflow-hidden shadow-2xl">
                  {searchResults.map(p => (
                    <button key={p.id}
                      className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-slate-600 transition flex justify-between items-center border-b border-slate-600 last:border-0"
                      onClick={() => { setOutPlayer(p); setSearch(p.web_name); }}>
                      <div>
                        <span className="font-bold">{p.web_name}</span>
                        <span className="text-slate-400 ml-2 text-xs">{p.team}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <PosBadge pos={p.position} />
                        <span className="text-violet-400 font-bold text-xs">£{p.price}M</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Budget slider */}
            <div>
              <label className="text-xs uppercase font-bold tracking-widest text-slate-400 mb-2 block">
                Budget supplémentaire: <span className="text-violet-400">+£{budget.toFixed(1)}M</span>
              </label>
              <input type="range" min="0" max="5" step="0.5"
                value={budget}
                onChange={e => setBudget(Number(e.target.value))}
                className="w-full accent-violet-500 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>£0M</span><span>£5M</span>
              </div>
            </div>

            {/* Selected player card */}
            {outPlayer && (
              <div className="bg-red-950/40 border border-red-800/50 rounded-xl p-4 flex flex-col gap-2">
                <p className="text-xs font-bold uppercase text-red-400 tracking-widest">Joueur sélectionné</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-black text-white text-lg">{outPlayer.web_name}</p>
                    <p className="text-slate-400 text-xs">{outPlayer.team} · {outPlayer.position}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-red-400 font-black text-2xl">{outPlayer.predicted_pts}</p>
                    <p className="text-[10px] text-slate-500 uppercase">pts prédits</p>
                  </div>
                </div>
                <div className="flex gap-3 text-xs text-slate-400 flex-wrap">
                  <span>Prix: <b className="text-white">£{outPlayer.price}M</b></span>
                  <span>Form: <b className="text-white">{outPlayer.form}</b></span>
                  <span>xG: <b className="text-white">{(outPlayer.xg || 0).toFixed(2)}</b></span>
                </div>
                <button
                  onClick={() => { setOutPlayer(null); setSearch(""); setSuggestions([]); }}
                  className="mt-1 text-xs text-red-400 hover:text-red-300 self-start underline">
                  × Réinitialiser
                </button>
              </div>
            )}
          </div>

          {/* Budget indicator */}
          {outPlayer && (
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5 text-sm flex flex-col gap-2">
              <p className="font-bold text-white text-base flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400 text-lg">account_balance_wallet</span>
                Enveloppe disponible
              </p>
              <p className="text-slate-400">Jusqu'à <span className="text-emerald-400 font-black text-lg">£{(outPlayer.price + budget).toFixed(1)}M</span></p>
              <p className="text-xs text-slate-500">= Prix actuel (£{outPlayer.price}M) + budget extra (£{budget.toFixed(1)}M)</p>
            </div>
          )}
        </aside>

        {/* ── RIGHT: Suggestions grid ── */}
        <section className="flex-1 flex flex-col gap-5">
          {!outPlayer ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] rounded-2xl border-2 border-dashed border-slate-700 text-slate-500">
              <span className="material-symbols-outlined text-5xl mb-3 text-slate-600">swap_horiz</span>
              <p className="font-bold text-base">Sélectionnez un joueur à gauche</p>
              <p className="text-sm mt-1">Les meilleures alternatives apparaîtront ici</p>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] rounded-2xl border-2 border-dashed border-slate-700 text-slate-500">
              <span className="material-symbols-outlined text-5xl mb-3 text-slate-600">search_off</span>
              <p className="font-bold">Aucun remplaçant trouvé</p>
              <p className="text-sm mt-1">Essayez d'augmenter le budget supplémentaire</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-violet-400">person_add</span>
                  {suggestions.length} remplaçants suggérés
                  <span className="text-sm text-slate-400 font-normal">· poste {outPlayer.position} · max £{(outPlayer.price + budget).toFixed(1)}M</span>
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {suggestions.map((c, i) => (
                  <SuggestionCard key={c.id} candidate={c} outPlayer={outPlayer} rank={i + 1} />
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
