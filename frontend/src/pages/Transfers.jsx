import { useState, useEffect, useMemo } from "react";
import { getPlayers, getPredictions, getUserTeam, getDreamTeamNext } from "../api/fpl";

/* ─── helpers ──────────────────────────────────────────────── */
function Spinner() {
  return (
    <div className="flex justify-center flex-1 py-16">
      <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

/* ─── Position UI Config ───────────────────────────────────── */
const POS_COLOR = { 
  GKP: { bg: "bg-amber-500/10", text: "text-amber-600", border: "border-amber-500/20" },
  DEF: { bg: "bg-blue-500/10", text: "text-blue-600", border: "border-blue-500/20" },
  MID: { bg: "bg-emerald-500/10", text: "text-emerald-600", border: "border-emerald-500/20" },
  FWD: { bg: "bg-red-500/10", text: "text-red-600", border: "border-red-500/20" }
};

function PosBadge({ pos, isHovered }) {
  const c = POS_COLOR[pos] || { bg: "bg-slate-500/10", text: "text-slate-500", border: "border-slate-500/20" };
  return (
    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md transition-colors 
      ${isHovered ? "bg-black/5 text-black border-black/10" : `${c.bg} ${c.text} border ${c.border}`}`}>
      {pos}
    </span>
  );
}

/* ─── Transfer Pair Card (AI Rec) ─────────────────────────── */
function TransferPair({ outP, inP, benefit }) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 flex items-center gap-5 group hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm hover:shadow-md relative overflow-hidden cursor-default">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-violet-600" />
      
      <div className="flex-1 min-w-0">
         <div className="flex items-center gap-2 mb-1">
            <span className="text-[8px] font-black bg-red-100 text-red-600 px-1.5 py-0.5 rounded uppercase">OUT</span>
            <p className="text-sm font-black text-slate-900 truncate font-mono">{outP.web_name}</p>
         </div>
         <div className="flex items-center gap-2">
            <span className="text-[8px] font-black bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded uppercase">IN</span>
            <p className="text-sm font-black text-slate-900 truncate font-mono">{inP.web_name}</p>
         </div>
      </div>

      <div className="flex flex-col items-center justify-center bg-violet-600 text-white min-w-[70px] h-[70px] rounded-2xl shadow-lg transition-transform group-hover:scale-105">
         <span className="text-[8px] font-black uppercase tracking-widest opacity-80">Gain</span>
         <span className="text-xl font-black">+{benefit}</span>
      </div>
    </div>
  );
}

/* ─── Suggestion Card (Manual) ────────────────────────────── */
function SuggestionCard({ candidate, outPlayer, rank, onSelect }) {
  const deltaPts   = +(candidate.predicted_pts - outPlayer.predicted_pts).toFixed(1);

  return (
    <div 
      onClick={() => onSelect?.(candidate)}
      className={`relative bg-white border group rounded-2xl p-4 flex flex-col gap-3 shadow-sm transition-all cursor-pointer hover:bg-slate-50
        ${rank === 1 ? "border-violet-600 ring-1 ring-violet-600/10" : "border-slate-200 hover:border-slate-300"}`}>
      
      {rank === 1 && (
        <div className="absolute -top-2 left-4 bg-violet-600 text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shadow-lg z-10">
          Optimal
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
           <div className="size-8 rounded-lg bg-violet-100 flex items-center justify-center text-violet-600 border border-violet-200">
              <span className="material-symbols-outlined text-sm">person</span>
           </div>
           <div>
              <p className="font-black text-sm text-slate-900">{candidate.web_name}</p>
              <p className="text-slate-400 text-[9px] font-black uppercase tracking-tighter">{candidate.team}</p>
           </div>
        </div>
        <PosBadge pos={candidate.position} isHovered={false} />
      </div>

      <div className="grid grid-cols-2 gap-2">
         <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
            <p className="text-[7px] font-black uppercase text-slate-400 mb-0.5">Delta Pts</p>
            <p className={`text-sm font-black ${deltaPts > 0 ? "text-emerald-600" : "text-slate-600"}`}>
               {deltaPts > 0 ? `+${deltaPts}` : deltaPts}
            </p>
         </div>
         <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
            <p className="text-[7px] font-black uppercase text-slate-400 mb-0.5">Prix</p>
            <p className="text-sm font-black text-slate-900">£{candidate.price}M</p>
         </div>
      </div>
    </div>
  );
}

/* ─── Main Transfers Page ─────────────────────────────────── */
export default function Transfers() {
  const [state, setState] = useState({ 
    players: [], predictions: [], userTeam: null, loading: true 
  });
  const [search, setSearch]       = useState("");
  const [outPlayer, setOutPlayer] = useState(null);
  const [budget, setBudget]       = useState(0); 
  const [suggestions, setSuggestions] = useState([]);
  const [aiRecs, setAiRecs] = useState([]);

  useEffect(() => {
    const teamId = localStorage.getItem("fpl_team_id");
    
    Promise.all([
      getPlayers(), 
      getPredictions(),
      teamId ? getUserTeam(teamId) : getDreamTeamNext()
    ]).then(([players, predictions, userTeam]) => {
      const predMap = Object.fromEntries(predictions.map(p => [p.player_id, p.predicted_points]));
      
      const enriched = players.map(p => ({
        ...p,
        price: p.price || (p.now_cost / 10) || 0,
        predicted_pts: predMap[p.id] ?? 0,
      }));
      
      let rawTeam = [];
      if (Array.isArray(userTeam)) {
        rawTeam = userTeam;
      } else if (userTeam && userTeam.team) {
        rawTeam = userTeam.team;
      }

      const enrichedTeam = rawTeam.map(tp => {
        const pid = tp.id || tp.element;
        const fullP = enriched.find(f => f.id === pid);
        return fullP || tp;
      });

      const teamName = userTeam.team_name || "JarvisBot XI";
      
      setState({ 
        players: enriched, 
        predictions, 
        userTeam: { team_name: teamName, team: enrichedTeam }, 
        loading: false 
      });
    }).catch(err => {
      console.error(err);
      setState(s => ({ ...s, loading: false }));
    });
  }, []);

  useEffect(() => {
    if (!outPlayer) { setSuggestions([]); return; }
    const maxPrice = (outPlayer.price || 0) + budget;
    const items = state.players
      .filter(p => p.id !== outPlayer.id && p.position === outPlayer.position && p.price <= maxPrice && p.predicted_pts > 0)
      .sort((a, b) => b.predicted_pts - a.predicted_pts)
      .slice(0, 8);
    setSuggestions(items);
  }, [outPlayer, budget, state.players]);

  useEffect(() => {
    if (!state.userTeam || !state.players.length) return;
    const team = Array.isArray(state.userTeam.team) ? state.userTeam.team : [];
    const recommendations = [];
    team.forEach(tp => {
      const pData = state.players.find(pl => pl.id === tp.id);
      if (!pData) return;
      const better = state.players
        .filter(pl => pl.position === pData.position && pl.price <= pData.price + 0.3 && pl.predicted_pts > pData.predicted_pts + 1.2)
        .sort((a, b) => b.predicted_pts - a.predicted_pts)
        .slice(0, 1);
      if (better.length) {
        recommendations.push({
          outP: pData, inP: better[0], benefit: +(better[0].predicted_pts - pData.predicted_pts).toFixed(1)
        });
      }
    });
    setAiRecs(recommendations.sort((a,b) => b.benefit - a.benefit).slice(0, 4));
  }, [state.userTeam, state.players]);

  if (state.loading) return <Spinner />;

  const searchResults = search.length >= 2 ? state.players
    .filter(p => p.web_name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.predicted_pts - a.predicted_pts)
    .slice(0, 5) : [];

  return (
    <main className="flex-1 w-full bg-slate-50 min-h-screen">
      <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-8">
        
        {/* ─── Header & Finance Block ─── */}
        <section className="bg-white border border-slate-200 rounded-[40px] p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
           <div className="flex items-center gap-4">
              <div className="size-14 rounded-3xl bg-violet-600 flex items-center justify-center text-white shadow-xl shadow-violet-600/20">
                 <span className="material-symbols-outlined text-3xl">token</span>
              </div>
              <div>
                 <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">AI <span className="text-violet-600">Transfers</span></h1>
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Optimisation de l'équipe {state.userTeam?.team_name || "JarvisBot"}</p>
              </div>
           </div>

           <div className="flex items-center gap-6">
              <div className="flex flex-col items-end">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Budget dispo</span>
                 <div className="flex items-center gap-3">
                    <span className="text-2xl font-black text-emerald-600">£{budget.toFixed(1)}M</span>
                    <input type="range" min="0" max="10" step="0.1" value={budget} onChange={e => setBudget(+e.target.value)}
                           className="w-24 accent-violet-600 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer" />
                 </div>
              </div>
              <div className="h-10 w-px bg-slate-200 hidden md:block"></div>
              <div className="bg-slate-50 px-5 py-2.5 rounded-2xl border border-slate-100 flex items-center gap-3">
                 <div className="text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase">{state.userTeam?.team_name || "Squad"}</p>
                    <p className="text-xs font-black text-slate-700">GW Active</p>
                 </div>
                 <span className="material-symbols-outlined text-violet-600">verified_user</span>
              </div>
           </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          
          {/* ─── BLOCK 1: YOUR SQUAD (SELECT TO REPLACE) ─── */}
          <section className="xl:col-span-5 space-y-6">
             <div className="flex items-center justify-between px-2">
                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                   <span className="material-symbols-outlined text-violet-600">grid_view</span>
                   Ma Squad
                </h2>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(state.userTeam?.team || []).map(p => {
                  const isSelected = outPlayer?.id === p.id;
                  return (
                    <button 
                      key={p.id || p.web_name}
                      onClick={() => { setOutPlayer(p); setSearch(""); }}
                      className={`relative p-4 rounded-3xl border transition-all text-left flex items-center justify-between group
                         ${isSelected ? "bg-white border-red-500 shadow-xl shadow-red-100 text-black ring-2 ring-red-500/20" : "bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm"}`}
                    >
                       <div className="flex items-center gap-3 overflow-hidden">
                          <PosBadge pos={p.position} isHovered={isSelected} />
                          <div className="min-w-0">
                             <p className={`font-black text-sm transition-colors text-slate-900 truncate`}>{p.web_name}</p>
                             <p className={`text-[9px] font-bold transition-colors ${isSelected ? "text-red-600" : "text-slate-400"}`}>£{p.price}M · {p.predicted_pts || 0} pts</p>
                          </div>
                       </div>
                       {isSelected ? (
                         <span className="material-symbols-outlined text-red-600">remove_circle</span>
                       ) : (
                         <span className="material-symbols-outlined text-slate-300 group-hover:text-slate-900 transition-colors">swap_horiz</span>
                       )}
                    </button>
                  );
                })}
             </div>

             {/* Quick Search */}
             <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Chercher un autre joueur</label>
                <div className="relative">
                  <input 
                     value={search}
                     onChange={e => { setSearch(e.target.value); setOutPlayer(null); }}
                     placeholder="Salah, Haaland..."
                     className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 text-xs font-bold focus:border-violet-600 outline-none"
                  />
                  {searchResults.length > 0 && (
                     <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl z-20 overflow-hidden">
                        {searchResults.map(p => (
                          <button key={p.id} onClick={() => { setOutPlayer(p); setSearch(p.web_name); }}
                                  className="w-full text-left p-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 flex justify-between group transition-colors">
                             <span className="text-xs font-bold text-slate-900">{p.web_name}</span>
                             <PosBadge pos={p.position} />
                          </button>
                        ))}
                     </div>
                  )}
                </div>
             </div>
          </section>

          {/* ─── BLOCK 2 & 3: OPTIMISATION & SIMULATION ─── */}
          <section className="xl:col-span-7 space-y-8">
             
             {!outPlayer && aiRecs.length > 0 && (
               <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                  <div className="flex items-center gap-3">
                     <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Conseils de Jarvis</h2>
                     <div className="h-px flex-1 bg-slate-200" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {aiRecs.map((rec, i) => (
                        <TransferPair key={i} {...rec} />
                     ))}
                  </div>
               </div>
             )}

             {outPlayer ? (
               <div className="space-y-6 animate-in zoom-in-95 duration-200">
                  <div className="bg-white border border-violet-100 rounded-[32px] p-6 shadow-xl">
                     <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                           <div className="size-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-500 border border-red-100">
                              <span className="material-symbols-outlined">person_remove</span>
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Remplacer</p>
                              <h3 className="text-xl font-black text-slate-900 leading-tight">{outPlayer.web_name}</h3>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-2xl font-black text-slate-900">£{((outPlayer.price || 0) + budget).toFixed(1)}M</p>
                           <p className="text-[9px] font-black text-slate-400 uppercase">Capacité d'Achat</p>
                        </div>
                     </div>

                     <div className="flex items-center gap-3 mb-6">
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                           <span className="material-symbols-outlined text-emerald-500">check_circle</span>
                           {suggestions.length} Alternatives trouvées
                        </h4>
                        <div className="h-px flex-1 bg-slate-100" />
                     </div>

                     {suggestions.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           {suggestions.map((c, i) => (
                              <SuggestionCard key={c.id} candidate={c} outPlayer={outPlayer} rank={i + 1} />
                           ))}
                        </div>
                     ) : (
                        <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-3xl">
                           <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">savings</span>
                           <p className="text-slate-400 font-bold">Budget insuffisant</p>
                           <button onClick={() => setBudget(b => b + 0.5)} className="mt-4 text-[10px] font-black text-violet-600 uppercase hover:underline">Augmenter (+0.5M)</button>
                        </div>
                     )}
                  </div>
                  
                  <button 
                     onClick={() => setOutPlayer(null)}
                     className="w-full py-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition flex items-center justify-center gap-2 shadow-sm"
                  >
                     <span className="material-symbols-outlined text-base">refresh</span> Réinitialiser la sélection
                  </button>
               </div>
             ) : (
               <div className="h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-[40px] text-slate-300 bg-white/50">
                  <div className="size-20 rounded-full bg-white flex items-center justify-center mb-4 border border-slate-100 shadow-sm text-slate-200">
                     <span className="material-symbols-outlined text-3xl">touch_app</span>
                  </div>
                  <p className="text-sm font-black uppercase tracking-widest text-slate-400">Optimiseur Manuel</p>
                  <p className="text-[10px] font-bold opacity-60 mt-1">Sélectionnez un joueur à gauche</p>
               </div>
             )}

          </section>
        </div>

        {/* ─── Footer / Glossary ─── */}
        <footer className="mt-12 pt-8 border-t border-slate-200">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                 <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-violet-600">menu_book</span>
                    Glossaire
                 </h4>
                 <ul className="space-y-3">
                    <li className="flex flex-col">
                       <span className="text-[10px] font-black text-violet-600 uppercase">Delta Pts</span>
                       <span className="text-xs text-slate-500 font-medium">Représente l'augmentation (ou la baisse) de points prédits si vous effectuez ce transfert.</span>
                    </li>
                    <li className="flex flex-col">
                       <span className="text-[10px] font-black text-emerald-600 uppercase">Capacité d'Achat</span>
                       <span className="text-xs text-slate-500 font-medium">Prix de vente du joueur actuel + Budget manuel que vous avez injecté.</span>
                    </li>
                 </ul>
              </div>
           </div>
        </footer>
      </div>
    </main>
  );
}
