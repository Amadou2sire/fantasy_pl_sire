import { useState, useEffect } from "react";
import { getPlayers, getTeams, getPredictions, saveTemplate, getTemplates, deleteTemplate } from "../api/fpl";
import PlayerCard from "../components/PlayerCard";
import FootballPitch from "../components/FootballPitch";

function Spinner() {
  return (
    <div className="flex justify-center flex-1 py-16">
      <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function Players() {
  const [data, setData] = useState({ players: [], teams: [], predictions: [], loading: true });
  const [filters, setFilters] = useState({ search: "", team: "ALL", pos: "ALL", sort: "total_points" });
  const [template, setTemplate] = useState([]);
  const [savedTemplates, setSavedTemplates] = useState([]);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setData(s => ({ ...s, loading: true }));
    try {
      const [pl, tm, pr, st] = await Promise.all([
        getPlayers(), getTeams(), getPredictions(), getTemplates()
      ]);
      setData({ players: pl, teams: tm, predictions: pr, loading: false });
      setSavedTemplates(st);
      
      // Auto-load last template if exists and template is empty
      if (st && st.length > 0 && template.length === 0) {
        const last = st[0];
        // The players in template might be JSON strings or arrays depending on DB/API
        const savedPlayerIds = (typeof last.players === 'string' ? JSON.parse(last.players) : last.players).map(p => p.id);
        const fullPlayers = pl.filter(p => savedPlayerIds.includes(p.id));
        setTemplate(fullPlayers);
      }
    } catch (err) {
      console.error(err);
      setData(s => ({ ...s, loading: false }));
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = data.players.filter(p => {
    const sMatch = p.web_name.toLowerCase().includes(filters.search.toLowerCase()) || 
                   p.name.toLowerCase().includes(filters.search.toLowerCase());
    const tMatch = filters.team === "ALL" || p.team === filters.team;
    const pMatch = filters.pos === "ALL" || p.position === filters.pos;
    return sMatch && tMatch && pMatch;
  }).sort((a, b) => {
    if (filters.sort === "now_cost") return b.price - a.price;
    if (filters.sort === "form") return b.form - a.form;
    return b.total_points - a.total_points;
  }).slice(0, 50);

  const addToTemplate = (p) => {
    if (template.length >= 15) return alert("Maximum 15 joueurs dans le template");
    if (template.find(x => x.id === p.id)) return;
    setTemplate([...template, p]);
  };

  const removeFromTemplate = (p) => {
    setTemplate(template.filter(x => x.id !== p.id));
  };

  const calculateStartingPPM = () => {
    // Starters selection (Sync with FootballPitch logic)
    const gkp = template.filter(p => p.position === 'GKP').slice(0, 1);
    const def = template.filter(p => p.position === 'DEF').slice(0, 4);
    const mid = template.filter(p => p.position === 'MID').slice(0, 4);
    const fwd = template.filter(p => p.position === 'FWD').slice(0, 2);
    
    const starters = [...gkp, ...def, ...mid, ...fwd];
    return starters.reduce((acc, p) => acc + (parseFloat(p.points_per_game) || 0), 0).toFixed(1);
  };

  const calculateXPoints = () => {
    return template.reduce((acc, p) => {
        const pred = data.predictions.find(pr => pr.player_id === p.id);
        return acc + (pred ? pred.predicted_points : 0);
    }, 0).toFixed(1);
  };

  const handleSave = async () => {
    if (!template.length) return;
    const name = prompt("Nom de votre template :", `Ma Team - ${new Date().toLocaleDateString()}`);
    if (!name) return;

    setSaving(true);
    try {
      await saveTemplate({
        name,
        players: template.map(p => ({ id: p.id, web_name: p.web_name })),
        total_predicted_points: parseFloat(calculatePoints())
      });
      alert("Template sauvegardé avec succès !");
      const st = await getTemplates();
      setSavedTemplates(st);
    } catch (err) {
      alert("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (!confirm("Supprimer ce template ?")) return;
    try {
      await deleteTemplate(id);
      setSavedTemplates(savedTemplates.filter(st => st.id !== id));
    } catch (err) {
      alert("Erreur lors de la suppression");
    }
  };

  return (
    <main className="flex flex-col lg:flex-row gap-8 p-6 lg:p-10 max-w-[1700px] mx-auto w-full items-start">
      
      {/* ── Left: Search & Filters (Scrollable) ── */}
      <div className="flex-1 flex flex-col gap-8">
        <section className="flex flex-col gap-6">
          <div className="flex flex-col">
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Base de Données Joueurs</h1>
            <p className="text-slate-400 font-bold text-sm">Filtrez et trouvez les meilleures pépites pour votre équipe</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Recherche</label>
              <input 
                value={filters.search} 
                onChange={e => setFilters(s => ({...s, search: e.target.value}))}
                placeholder="Nom du joueur..." 
                className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl px-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all" 
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Équipe</label>
              <select 
                value={filters.team}
                onChange={e => setFilters(s => ({...s, team: e.target.value}))}
                className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl px-4 text-sm font-bold outline-none"
              >
                <option value="ALL">Toutes les équipes</option>
                {data.teams.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Position</label>
              <select 
                value={filters.pos}
                onChange={e => setFilters(s => ({...s, pos: e.target.value}))}
                className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl px-4 text-sm font-bold outline-none"
              >
                <option value="ALL">Toutes les postions</option>
                <option value="GKP">Gardiens</option>
                <option value="DEF">Défenseurs</option>
                <option value="MID">Milieux</option>
                <option value="FWD">Attaquants</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Trier par</label>
              <select 
                value={filters.sort}
                onChange={e => setFilters(s => ({...s, sort: e.target.value}))}
                className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl px-4 text-sm font-bold outline-none"
              >
                <option value="total_points">Total Points</option>
                <option value="now_cost">Prix</option>
                <option value="form">Forme (xPts)</option>
              </select>
            </div>
          </div>
        </section>

        {data.loading ? <Spinner /> : (
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
            {filtered.map(p => (
              <PlayerCard 
                key={p.id} 
                player={p} 
                onAdd={addToTemplate} 
                onRemove={removeFromTemplate}
                isSelected={template.some(x => x.id === p.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Right: Template Sidebar (Sticky) ── */}
      <aside className="w-full lg:w-[420px] lg:sticky lg:top-10 flex flex-col gap-6 self-start">
        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm flex flex-col gap-8 border-b-[8px] border-b-emerald-500">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-50 rounded-2xl">
                   <span className="material-symbols-outlined text-emerald-500 text-3xl">stadium</span>
                </div>
                <div>
                  <h2 className="font-black text-slate-900 uppercase tracking-tight text-xl">Tactique</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{template.length}/15 Joueurs</p>
                </div>
              </div>
           </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="bg-slate-50 flex-1 rounded-3xl p-5 flex flex-col items-center justify-center gap-1 border border-slate-100">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Somme PPM (Titulaire)</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-900">{calculateStartingPPM()}</span>
                    <span className="text-[10px] font-black text-emerald-500 uppercase">pts</span>
                  </div>
               </div>
               <div className="bg-emerald-500 flex-1 rounded-3xl p-5 flex flex-col items-center justify-center gap-1 border border-emerald-600 shadow-lg shadow-emerald-100">
                  <p className="text-[8px] font-black text-emerald-100 uppercase tracking-[0.2em] text-center">xPoints Prochain GW</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-white">{calculateXPoints()}</span>
                    <span className="text-[10px] font-black text-white uppercase opacity-70">xpts</span>
                  </div>
               </div>
            </div>

           {/* 🏟️ The Interactive Pitch */}
           <FootballPitch players={template} onRemove={removeFromTemplate} />

           <div className="flex flex-col gap-4 mt-4">
              <button 
                onClick={handleSave}
                disabled={!template.length || saving}
                className="w-full h-16 bg-slate-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-slate-200 hover:bg-emerald-500 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed group flex items-center justify-center gap-3"
              >
                {saving ? "Sauvegarde..." : (
                  <>
                    <span className="material-symbols-outlined text-lg">save</span>
                    Sauvegarder Template
                  </>
                )}
              </button>
              
              <div className="flex justify-center w-full">
                <button 
                  onClick={() => setTemplate([])} 
                  className="w-full h-16 bg-slate-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-slate-200 hover:bg-red-500 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed group flex items-center justify-center gap-3"
                >
                  <span className="material-symbols-outlined text-lg">delete_sweep</span>
                  Réinitialiser
                </button>
              </div>
           </div>
        </div>

        {/* ── Saved Templates ── */}
        {savedTemplates.length > 0 && (
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm flex flex-col gap-6">
            <h2 className="font-black text-slate-900 uppercase tracking-tight text-lg">Templates Sauvegardés</h2>
            <div className="flex flex-col gap-3">
              {savedTemplates.map(st => (
                <div key={st.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-1 group/item">
                   <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-slate-800">{st.name}</span>
                      <button onClick={() => handleDeleteTemplate(st.id)} className="opacity-0 group-hover/item:opacity-100 text-slate-300 hover:text-red-500 transition-all">
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                   </div>
                   <div className="flex justify-between items-center">
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                        {JSON.parse(typeof st.players === 'string' ? st.players : JSON.stringify(st.players)).length} joueurs
                      </p>
                      <span className="text-[10px] font-black text-emerald-500">{st.total_predicted_points} xPts</span>
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>

    </main>
  );
}
