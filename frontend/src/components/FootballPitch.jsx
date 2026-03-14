import React from 'react';

const FootballPitch = ({ players, onRemove }) => {
  // Sort players by position for organizational purposes
  const gkp = players.filter(p => p.position === 'GKP');
  const def = players.filter(p => p.position === 'DEF');
  const mid = players.filter(p => p.position === 'MID');
  const fwd = players.filter(p => p.position === 'FWD');

  // Logic to determine starters (max 11) and bench
  // Simplified: first 1 GKP, 4 DEF, 4 MID, 2 FWD are starters
  const starters = {
    GKP: gkp.slice(0, 1),
    DEF: def.slice(0, 4),
    MID: mid.slice(0, 4),
    FWD: fwd.slice(0, 2),
  };

  const bench = [
    ...gkp.slice(1),
    ...def.slice(4),
    ...mid.slice(4),
    ...fwd.slice(2),
  ];

  const PlayerIcon = ({ player, isBench = false }) => (
    <div className="relative group flex flex-col items-center animate-in fade-in zoom-in duration-300">
      <div 
        className={`size-10 md:size-12 rounded-full border-2 flex items-center justify-center shadow-lg transition-transform hover:scale-110 cursor-pointer overflow-hidden ${
          isBench ? 'bg-slate-800 border-slate-700' : 'bg-white border-emerald-500'
        }`}
      >
        <span className={`text-[10px] font-black ${isBench ? 'text-slate-400' : 'text-slate-900'} uppercase`}>
          {player.web_name.slice(0, 3)}
        </span>
      </div>
      <div className={`mt-1 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${
        isBench ? 'bg-slate-700 text-slate-300' : 'bg-slate-900 text-white'
      } shadow-sm max-w-[60px] truncate`}>
        {player.web_name}
      </div>
      <button 
        onClick={() => onRemove(player)}
        className="absolute -top-1 -right-1 size-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
      >
        <span className="material-symbols-outlined text-[10px]">close</span>
      </button>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* 🏟️ The Pitch Area */}
      <div className="relative aspect-[3/4] w-full bg-emerald-600 rounded-[2rem] overflow-hidden shadow-2xl border-4 border-emerald-700/50 p-4 flex flex-col justify-between">
        {/* Pitch Lines Overlay */}
        <div className="absolute inset-0 border-2 border-white/20 rounded-[1.8rem] pointer-events-none">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/20 -translate-y-1/2" />
          <div className="absolute top-1/2 left-1/2 size-24 border-2 border-white/20 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-16 border-b-2 border-x-2 border-white/20" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-16 border-t-2 border-x-2 border-white/20" />
        </div>

        {/* Players by Row */}
        <div className="relative z-10 flex flex-col h-full justify-between py-4">
          {/* FWD Line */}
          <div className="flex justify-center gap-6">
            {starters.FWD.map(p => <PlayerIcon key={p.id} player={p} />)}
            {starters.FWD.length === 0 && <div className="size-12 rounded-full border-2 border-white/10 border-dashed" />}
          </div>

          {/* MID Line */}
          <div className="flex justify-center gap-4">
            {starters.MID.map(p => <PlayerIcon key={p.id} player={p} />)}
            {starters.MID.length === 0 && <div className="size-12 rounded-full border-2 border-white/10 border-dashed" />}
          </div>

          {/* DEF Line */}
          <div className="flex justify-center gap-3">
            {starters.DEF.map(p => <PlayerIcon key={p.id} player={p} />)}
            {starters.DEF.length === 0 && <div className="size-12 rounded-full border-2 border-white/10 border-dashed" />}
          </div>

          {/* GKP Line */}
          <div className="flex justify-center">
            {starters.GKP.map(p => <PlayerIcon key={p.id} player={p} />)}
            {starters.GKP.length === 0 && <div className="size-12 rounded-full border-2 border-white/10 border-dashed" />}
          </div>
        </div>

        {/* Grass Texture Effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/5 to-transparent pointer-events-none" />
      </div>

      {/* 🪑 Bench Area */}
      <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-xl">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 text-center">Banc de Touche</h3>
        <div className="flex flex-wrap justify-center gap-4">
          {bench.map(p => <PlayerIcon key={p.id} player={p} isBench />)}
          {bench.length === 0 && (
            <p className="text-[9px] text-slate-600 font-bold uppercase italic py-2">Le banc est vide</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FootballPitch;
