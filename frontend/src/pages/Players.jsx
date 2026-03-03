import { useState, useEffect } from "react";
import { getPlayers } from "../api/fpl";
import PlayerCard from "../components/PlayerCard";

function Spinner() {
  return <div className="flex justify-center p-8 text-primary">
    <div className="w-8 h-8 border-4 border-current border-t-transparent rounded-full animate-spin" />
  </div>;
}

export default function Players() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("total_points");

  const load = async () => {
    setLoading(true);
    try {
      const data = await getPlayers(search, "ALL", 100);
      let sorted = [...data];
      if (sort === "now_cost") {
        sorted.sort((a, b) => b.price - a.price);
      } else if (sort === "form") {
        sorted.sort((a, b) => b.form - a.form);
      } else {
        // default total_points
        sorted.sort((a, b) => b.total_points - a.total_points);
      }
      setPlayers(sorted);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <main className="flex flex-col gap-6 p-6 lg:px-10 max-w-[1440px] mx-auto w-full">
      <section className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">Player Database</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Analyze and compare players</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Live Status:</span>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold">
              <span className="size-2 bg-green-500 rounded-full animate-pulse"></span>
              DATA SYNCED
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-primary p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex flex-col gap-1.5 min-w-[200px]">
            <span className="text-xs font-bold text-slate-500 ml-1">SEARCH</span>
            <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} placeholder="Player name..." className="flex h-10 items-center justify-between gap-x-2 rounded-lg bg-slate-50 border border-slate-200 px-3 w-full text-sm outline-none focus:border-primary" />
          </div>
          <div className="flex flex-col gap-1.5 min-w-[150px]">
            <span className="text-xs font-bold text-slate-500 ml-1">SORT BY</span>
            <select value={sort} onChange={e => setSort(e.target.value)} className="flex h-10 items-center justify-between gap-x-2 rounded-lg bg-slate-50 border border-slate-200 px-3 w-full text-sm outline-none focus:border-primary">
              <option value="total_points">Total Points</option>
              <option value="now_cost">Price</option>
              <option value="form">Form</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5 min-w-[120px] self-end">
            <button onClick={load} className="w-full h-10 bg-primary text-white rounded-lg font-bold text-sm hover:opacity-90 transition-opacity">
              Apply
            </button>
          </div>
        </div>
      </section>

      {loading ? <Spinner /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {players.map(p => <PlayerCard key={p.id} player={p} />)}
        </div>
      )}
    </main>
  );
}
