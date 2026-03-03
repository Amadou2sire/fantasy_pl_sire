export default function PlayerCard({ player }) {
  const positionColors = {
    "FWD": "bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800",
    "MID": "bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800",
    "DEF": "bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800",
    "GKP": "bg-amber-100 dark:bg-amber-900/40 border-amber-200 dark:border-amber-800"
  };

  const bgClass = positionColors[player.position] || "bg-white dark:bg-primary border-slate-200 dark:border-slate-800";

  return (
    <div className={`${bgClass} border rounded-xl overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow`}>
      <div className="p-5 flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{player.web_name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{player.team}</span>
              <span className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded font-bold">{player.position}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xs text-slate-500 font-bold uppercase">Points</span>
          <span className="text-2xl font-black text-primary dark:text-white">{player.total_points}</span>
        </div>
      </div>
      <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-800 p-4 bg-slate-50/50 dark:bg-slate-800/20">
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase">Form</span>
          <span className="text-sm font-bold text-slate-900 dark:text-white">{player.form}</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase">Owned %</span>
          <span className="text-sm font-bold text-slate-900 dark:text-white">{player.selected_by}%</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase">Price</span>
          <span className="text-sm font-bold text-slate-900 dark:text-white">£{player.price?.toFixed(1)}m</span>
        </div>
      </div>
      <div className="p-5 flex flex-col gap-4 mt-auto">
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Goals</span>
            <span className="text-base font-bold text-slate-900 dark:text-white">{player.goals}</span>
          </div>
          <div className="flex flex-col p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Assists</span>
            <span className="text-base font-bold text-slate-900 dark:text-white">{player.assists}</span>
          </div>
          <div className="flex flex-col p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-center border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase">CS</span>
            <span className="text-base font-bold text-slate-900 dark:text-white">{player.clean_sheets}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
