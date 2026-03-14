export default function PlayerCard({ player, onAdd, onRemove, isSelected }) {
  const positionColors = {
    "FWD": "bg-red-50 border-red-200",
    "MID": "bg-emerald-50 border-emerald-200",
    "DEF": "bg-blue-50 border-blue-200",
    "GKP": "bg-amber-50 border-amber-200"
  };

  const borderColors = {
    "FWD": "border-red-200",
    "MID": "border-emerald-200",
    "DEF": "border-blue-200",
    "GKP": "border-amber-200"
  };

  const bgClass = positionColors[player.position] || "bg-white border-slate-200";

  return (
    <div className={`${bgClass} border ${borderColors[player.position]} rounded-2xl overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-all group`}>
      <div className="p-5 flex items-start justify-between gap-4 border-b border-white/50">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <h3 className="text-lg font-black text-slate-900 leading-tight tracking-tight">{player.web_name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{player.team}</span>
              <span className="text-[9px] bg-white/80 text-slate-700 px-1.5 py-0.5 rounded-md font-black shadow-sm border border-slate-100">{player.position}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Points</span>
          <span className="text-2xl font-black text-slate-900 tracking-tighter">{player.total_points}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-3 divide-x divide-white/50 border-b border-white/50 bg-white/30">
        <div className="flex flex-col items-center py-3">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Form</span>
          <span className="text-xs font-black text-slate-900">{player.form}</span>
        </div>
        <div className="flex flex-col items-center py-3">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Owned</span>
          <span className="text-xs font-black text-slate-900">{player.selected_by}%</span>
        </div>
        <div className="flex flex-col items-center py-3">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Price</span>
          <span className="text-xs font-black text-slate-900">£{player.price?.toFixed(1)}m</span>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-4 mt-auto">
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col p-2 bg-white/50 rounded-xl text-center shadow-sm">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Buts</span>
            <span className="text-sm font-black text-slate-900">{player.goals}</span>
          </div>
          <div className="flex flex-col p-2 bg-white/50 rounded-xl text-center shadow-sm">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Passes</span>
            <span className="text-sm font-black text-slate-900">{player.assists}</span>
          </div>
          <div className="flex flex-col p-2 bg-white/50 rounded-xl text-center shadow-sm">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">CS</span>
            <span className="text-sm font-black text-slate-900">{player.clean_sheets}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Historique Points (Last 5 GW)</span>
          <div className="flex gap-2 justify-center">
            {player.recent_points?.map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <span className="text-[7px] font-black text-slate-400">GW{item.gw}</span>
                <div 
                  className="size-7 rounded-full flex items-center justify-center text-[10px] font-black text-white bg-slate-900 shadow-sm transition-transform hover:scale-110"
                >
                  {item.pts}
                </div>
              </div>
            ))}
          </div>
        </div>

        {onAdd && (
          <button
            onClick={() => isSelected ? onRemove(player) : onAdd(player)}
            className={`w-full py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-sm ${
              isSelected 
                ? "bg-red-500 text-white hover:bg-red-600 scale-[0.98]" 
                : "bg-slate-900 text-white hover:bg-emerald-500"
            }`}
          >
            {isSelected ? "Retirer du Template" : "Ajouter au Template"}
          </button>
        )}
      </div>
    </div>
  );
}
