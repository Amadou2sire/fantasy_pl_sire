import { useState, useEffect } from "react";
import {
  getGameweeks, getPlayers, getPredictions,
  getTeams, getDreamTeam, getDreamTeamNext, getUserTeam
} from "../api/fpl";

/* ── helpers ─────────────────────────────────────────────────── */
function Spinner() {
  return (
    <div className="flex justify-center flex-1 py-16">
      <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function safe(val, digits = 2) {
  const n = Number(val);
  return isNaN(n) ? "0.00" : n.toFixed(digits);
}

/* Position row layout: GKP bottom, DEF, MID, FWD top */
const PITCH_ROWS = ["FWD", "MID", "DEF", "GKP"]; // Top to Bottom
const POS_COLOR  = { GKP: "#f59e0b", DEF: "#3b82f6", MID: "#10b981", FWD: "#ef4444" };

/* ── Football Pitch component (VERTICAL & RESPONSIVE) ─────────── */
function Pitch({ team, label, scoreKey = "points", accentColor = "#10b981" }) {
  if (!team?.length) return (
    <div className="flex items-center justify-center h-48 text-slate-500 text-sm italic">
      Chargement de l'équipe...
    </div>
  );

  const byPos = Object.fromEntries(
    PITCH_ROWS.map(pos => [pos, team.filter(p => p.position === pos)])
  );

  return (
    <div className="flex flex-col gap-1 w-full">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 text-center">{label}</p>
      
      {/* Vertical Pitch Landscape */}
      <div className="relative rounded-3xl overflow-hidden border border-emerald-200/50 shadow-inner h-[400px] md:h-[500px]"
           style={{ background: "linear-gradient(180deg, #166534 0%, #15803d 50%, #166534 100%)" }}>
        
        {/* Pitch markings (Vertical) */}
        <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 300 500" preserveAspectRatio="none">
          <rect x="5" y="5" width="290" height="490" rx="10" fill="none" stroke="white" strokeWidth="2"/>
          <line x1="5" y1="250" x2="295" y2="250" stroke="white" strokeWidth="1.5"/>
          <circle cx="150" cy="250" r="45" fill="none" stroke="white" strokeWidth="1.5"/>
          <rect x="75" y="5" width="150" height="80" fill="none" stroke="white" strokeWidth="1.5"/>
          <rect x="75" y="415" width="150" height="80" fill="none" stroke="white" strokeWidth="1.5"/>
          <rect x="110" y="5" width="80" height="30" fill="none" stroke="white" strokeWidth="1.5"/>
          <rect x="110" y="465" width="80" height="30" fill="none" stroke="white" strokeWidth="1.5"/>
          <circle cx="150" cy="5" r="8" fill="white" opacity="0.3"/>
          <circle cx="150" cy="495" r="8" fill="white" opacity="0.3"/>
        </svg>

        {/* Players (Vertical rows) */}
        <div className="relative z-10 flex flex-col h-full justify-around py-6">
          {PITCH_ROWS.map(pos => {
            const players = byPos[pos] || [];
            return (
              <div key={pos} className="flex justify-around items-center w-full px-4">
                {players.map(p => (
                  <div key={p.id || p.web_name} className="flex flex-col items-center group cursor-default">
                    <div className="relative">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 bg-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform"
                           style={{ borderColor: POS_COLOR[pos] }}>
                         <span className="text-[9px] md:text-[10px] font-black text-slate-800 uppercase">{(p.web_name || "?").slice(0,3)}</span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-md text-[8px] md:text-[9px] font-black shadow-sm text-white flex items-center gap-1"
                           style={{ background: accentColor }}>
                        {p[scoreKey] ?? "–"}
                        {p.is_captain && <span className="text-[7px] bg-slate-900/40 px-0.5 rounded">C</span>}
                        {p.is_vice_captain && <span className="text-[7px] bg-slate-900/40 px-0.5 rounded">V</span>}
                      </div>
                    </div>
                    <span className="mt-1.5 text-[9px] md:text-[10px] font-black text-white drop-shadow-md text-center max-w-[70px] md:max-w-[80px] break-words">
                      {p.web_name}
                    </span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Compact player row ─────────────────────────────────────── */
function PredRow({ pred, idx, teamMap }) {
  const p        = pred.player;
  const teamName = teamMap?.[p?.team_id] || p?.team || "?";
  const xg       = safe(p?.xg);
  const xa       = safe(p?.xa);

  return (
    <div className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition border-b border-slate-100 last:border-0">
      <span className="w-5 text-center text-[11px] font-black text-slate-300">{idx + 1}</span>
      <span className="text-[9px] font-black px-1.5 py-0.5 rounded"
            style={{ background: POS_COLOR[p?.position] + "22", color: POS_COLOR[p?.position] || "#94a3b8" }}>
        {p?.position || "?"}
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-slate-800 truncate">{p?.web_name}</p>
        <p className="text-[10px] text-slate-400 font-medium">
          {teamName} · <span className="text-slate-500">xG {xg}</span> · <span className="text-slate-500">xA {xa}</span>
        </p>
      </div>
      <div className="text-right">
        <span className="text-base font-black text-emerald-500">{pred.predicted_points}</span>
        <span className="text-[9px] text-slate-400 font-bold ml-0.5 uppercase">pts</span>
      </div>
    </div>
  );
}

/* ── KPI card ───────────────────────────────────────────────── */
function KpiCard({ icon, label, value, sub }) {
  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
        <span className="material-symbols-outlined text-emerald-500 text-2xl">{icon}</span>
      </div>
      <div>
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{label}</p>
        <p className="text-xl font-black text-slate-900">{value}</p>
        {sub && <p className="text-[10px] text-slate-500 font-medium">{sub}</p>}
      </div>
    </div>
  );
}

/* ── Dashboard ──────────────────────────────────────────────── */
export default function Dashboard() {
  const [d, setD] = useState({
    gameweeks: [], players: [], predictions: [],
    teams: [], dreamTeam: null, nextTeam: null, loading: true,
    userTeam: null
  });
  const [teamIdInput, setTeamIdInput] = useState("");
  const [fetchingUser, setFetchingUser] = useState(false);

  useEffect(() => {
    Promise.all([
      getGameweeks(), getPlayers(), getPredictions(),
      getTeams(), getDreamTeam(), getDreamTeamNext()
    ]).then(([gw, pl, pred, tm, dt, nt]) => {
      setD({ gameweeks: gw, players: pl, predictions: pred,
             teams: tm, dreamTeam: dt, nextTeam: nt, loading: false });
    }).catch(err => {
      console.error(err);
      setD(s => ({ ...s, loading: false }));
    });

    const savedId = localStorage.getItem("fpl_team_id");
    if (savedId) {
       handleFetchUserTeam(savedId);
       setTeamIdInput(savedId);
    }
  }, []);

  const handleFetchUserTeam = (id) => {
    if (!id) return;
    setFetchingUser(true);
    getUserTeam(id).then(res => {
      if (!res.error) {
        setD(s => ({ ...s, userTeam: res }));
        localStorage.setItem("fpl_team_id", id);
      } else {
        alert(res.error);
      }
      setFetchingUser(false);
    }).catch(err => {
      console.error(err);
      setFetchingUser(false);
    });
  };

  if (d.loading) return <Spinner />;

  const currentGw = d.gameweeks.find(g => g.is_current) || {};
  const nextGw    = d.gameweeks.find(g => g.is_next)    || {};
  const teamShortMap = Object.fromEntries((d.teams || []).map(t => [t.id, t.short_name]));

  const topPredictions = d.predictions
    .map(p => {
      const player = d.players.find(pl => pl.id === p.player_id);
      return { ...p, player };
    })
    .filter(p => p.player)
    .sort((a, b) => b.predicted_points - a.predicted_points)
    .slice(0, 15);

  const avgGwPts = currentGw.average_entry_score ?? "—";
  const totalPlayers = d.players.length;

  return (
    <main className="flex-1 flex flex-col max-w-[1400px] mx-auto w-full p-6 md:p-10 gap-8">

      {/* ── Hero Header ── */}
      <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase text-slate-900 leading-tight">
            FPL <span className="text-emerald-500">Analytics</span> Hub
          </h1>
          <p className="text-slate-500 font-bold text-sm flex items-center gap-2 mt-2">
            <span className="material-symbols-outlined text-emerald-500 text-lg">verified</span>
            Modèle Prédictif Temps Réel · {currentGw.name || "Saison 24/25"}
          </p>
        </div>
        <div className="bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100">
           <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1">Status</p>
           <p className="text-xs font-bold text-emerald-800">{totalPlayers} Joueurs Synchronisés</p>
        </div>
      </section>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard icon="stadium"        label="Prochain GW"    value={nextGw.name || "—"} />
        <KpiCard icon="analytics"      label="Points Moyens"  value={avgGwPts}               sub="Dernier GW" />
        <KpiCard icon="groups"         label="Base de données" value={totalPlayers}          sub="Joueurs actifs" />
        <KpiCard icon="schedule"       label="Deadline"       value={new Date(nextGw.deadline_time || Date.now()).toLocaleDateString("fr-FR", {day: "numeric", month: "long"})} sub="Transferts" />
      </div>

      {/* ── My Team Search ── */}
      <section className="bg-white rounded-[32px] border border-slate-100 p-6 shadow-sm flex flex-col sm:flex-row items-center gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="p-2 bg-emerald-50 rounded-xl">
             <span className="material-symbols-outlined text-emerald-500">person_search</span>
          </div>
          <div>
            <h2 className="font-black text-slate-900 uppercase tracking-tight text-sm">Ma Team FPL</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Entre ton ID pour comparer tes points</p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input 
            type="number"
            placeholder="Ex: 564231"
            className="flex-1 sm:w-40 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            value={teamIdInput}
            onChange={(e) => setTeamIdInput(e.target.value)}
          />
          <button 
            onClick={() => handleFetchUserTeam(teamIdInput)}
            disabled={fetchingUser}
            className="px-6 py-2 bg-slate-900 text-white text-xs font-black uppercase rounded-xl hover:bg-emerald-500 transition-colors disabled:opacity-50"
          >
            {fetchingUser ? "Chargement..." : "Analyser"}
          </button>
        </div>
      </section>

      {/* ── Main Content ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Pitch Column (Left) */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
             {/* My Team (If loaded) */}
             {d.userTeam && (
               <div className="bg-white rounded-[32px] border border-emerald-500/30 p-6 shadow-md ring-4 ring-emerald-50">
                 <div className="flex items-center justify-between mb-6">
                   <div className="flex items-center gap-3">
                     <div className="p-2 bg-emerald-50 rounded-xl">
                       <span className="material-symbols-outlined text-emerald-500">person</span>
                     </div>
                     <div>
                       <h2 className="font-black text-slate-900 uppercase tracking-tight">Ma Team</h2>
                       <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">{d.userTeam.team_name} · GW {d.userTeam.gameweek}</p>
                     </div>
                   </div>
                   <div className="bg-emerald-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase">
                     {d.userTeam.total_points} pts
                   </div>
                 </div>
                 <Pitch
                   team={d.userTeam.team || []}
                   label=""
                   scoreKey="points"
                   accentColor="#10b981"
                 />
               </div>
             )}

             {/* Realtime Team of the Week */}
             <div className="bg-white rounded-[32px] border border-slate-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 rounded-xl">
                  <span className="material-symbols-outlined text-amber-500">military_tech</span>
                </div>
                <div>
                  <h2 className="font-black text-slate-900 uppercase tracking-tight">Team of the Week</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">GW {d.dreamTeam?.gameweek || "?"} · Points en Temps Réel</p>
                </div>
              </div>
              <div className="px-3 py-1 bg-slate-50 rounded-full border border-slate-100 flex items-center gap-1.5">
                 <span className="size-2 bg-emerald-500 rounded-full animate-pulse"></span>
                 <span className="text-[10px] font-black text-slate-800 uppercase">Live</span>
              </div>
            </div>
            <Pitch
              team={d.dreamTeam?.team || []}
              label=""
              scoreKey="points"
              accentColor="#f59e0b"
            />
          </div>

          {/* AI Predicted XI */}
          <div className="bg-white rounded-[32px] border border-slate-100 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-violet-50 rounded-xl">
                <span className="material-symbols-outlined text-violet-500">model_training</span>
              </div>
              <div>
                <h2 className="font-black text-slate-900 uppercase tracking-tight">AI Predicted XI</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">GW {d.nextTeam?.gameweek || "?"} · Disponibilité Vérifiée</p>
              </div>
            </div>
            <Pitch
              team={d.nextTeam?.team || []}
              label=""
              scoreKey="predicted_points"
              accentColor="#8b5cf6"
            />
          </div>
        </div>
        </div>

        {/* Prediction List (Right) */}
        <div className="lg:col-span-4 bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-slate-50 flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-xl">
              <span className="material-symbols-outlined text-emerald-500">rocket_launch</span>
            </div>
            <div>
              <h2 className="font-black text-slate-900 uppercase tracking-tight text-sm">Top Predictions</h2>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Calculé par Intelligence Artificielle</p>
            </div>
          </div>
          <div className="overflow-y-auto flex-1" style={{ maxHeight: "800px" }}>
            {topPredictions.map((pred, i) => (
              <PredRow key={pred.player_id} pred={pred} idx={i} teamMap={teamShortMap} />
            ))}
            {!topPredictions.length && (
              <div className="p-10 text-center flex flex-col items-center gap-2">
                <Spinner />
                <p className="text-xs text-slate-400 font-bold uppercase">Analyse des données...</p>
              </div>
            )}
          </div>
          <div className="p-4 bg-slate-50 text-center">
            <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-emerald-500 transition">Voir tout le classement</button>
          </div>
        </div>

      </div>

    </main>
  );
}
