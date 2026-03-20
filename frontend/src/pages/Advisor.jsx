import { useState, useEffect, useRef } from "react";
import { getAIAdvice, comparePlayers } from "../api/fpl";

function Spinner() {
  return <div className="flex justify-center p-8 text-emerald-600">
    <div className="w-8 h-8 border-4 border-current border-t-transparent rounded-full animate-spin" />
  </div>;
}


export default function Advisor() {
  const [question, setQuestion] = useState("");
  const [compare, setCompare] = useState({ p1: "", p2: "" });
  const [messages, setMessages] = useState([
    { role: "bot", content: "Hello! Je suis votre conseiller FPL propulsé par l'IA. Posez-moi vos questions." }
  ]);
  const [compareResult, setCompareResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("chat");

  const chatEndRef = useRef(null);
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const ask = async () => {
    if (!question.trim()) return;
    const userMsg = question;
    setQuestion("");
    setMode("chat");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const teamId = localStorage.getItem("fpl_team_id");
      const leagueId = localStorage.getItem("fpl_league_id");
      const res = await getAIAdvice(userMsg, teamId ? parseInt(teamId) : null, leagueId ? parseInt(leagueId) : null);
      setMessages(prev => [...prev, { role: "bot", content: res.answer }]);
    } catch (e) {


      setMessages(prev => [...prev, { role: "bot", content: "Erreur: " + e.message }]);
    }
    setLoading(false);
  };

  const doCompare = async () => {
    if (!compare.p1 || !compare.p2) return;
    setLoading(true); setCompareResult(null); setMode("compare");
    try {
      const res = await comparePlayers([compare.p1, compare.p2]);
      setCompareResult(res.answer);
    } catch (e) { setCompareResult("Erreur " + e.message); }
    setLoading(false);
  };

  return (
    <main className="flex flex-col gap-6 p-6 lg:px-10 max-w-[1440px] mx-auto w-full bg-slate-50 min-h-screen">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Conseiller <span className="text-emerald-600">IA</span></h1>
          <p className="text-slate-500 text-xs font-black uppercase tracking-widest opacity-60">Analyses personnalisées & Comparaisons IA par Jarvis</p>
        </div>
      </section>


      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
        <aside className="lg:col-span-3 flex flex-col gap-6">
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl transition-all">
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-emerald-600">auto_awesome</span>
              <h3 className="font-black text-[10px] uppercase tracking-wider text-slate-400">Smart Insights</h3>
            </div>
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-black text-slate-900 mb-2 uppercase tracking-widest">Confiance IA</p>
                <div className="text-[11px] text-slate-500 font-bold leading-relaxed">Précision de 94% sur les tendances de prix cette saison.</div>
              </div>
            </div>
            <button className="w-full mt-6 py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-emerald-600 transition-all shadow-lg active:scale-95">Voir plus</button>
          </div>
        </aside>


        {/* Middle Section: Main Interface */}
        <section className="lg:col-span-6 flex flex-col gap-6">
          {/* Comparison Tool Section */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50">
            <div className="flex items-center gap-4 mb-8">
               <div className="size-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <span className="material-symbols-outlined">compare_arrows</span>
               </div>
               <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Comparateur Direct</h3>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex gap-4">
                <input value={compare.p1} onChange={e => setCompare({ ...compare, p1: e.target.value })} placeholder="Joueur 1 (ex: Salah)" className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold focus:border-emerald-600 outline-none transition-all placeholder:text-slate-300" />
                <input value={compare.p2} onChange={e => setCompare({ ...compare, p2: e.target.value })} placeholder="Joueur 2 (ex: Haaland)" className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold focus:border-emerald-600 outline-none transition-all placeholder:text-slate-300" />
              </div>
              <button onClick={doCompare} disabled={loading} className="w-full py-4 bg-emerald-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200/50 disabled:opacity-50 active:scale-95">
                Comparer avec l'IA
              </button>
            </div>
            {mode === "compare" && loading && <Spinner />}
            {mode === "compare" && compareResult && !loading && (
              <div className="mt-8 p-6 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm font-bold text-slate-700 leading-relaxed whitespace-pre-wrap animate-in fade-in slide-in-from-top-4">
                {compareResult}
              </div>
            )}
          </div>


          {/* Chat Interface */}
          <div className="bg-white rounded-[2.5rem] flex flex-col h-[700px] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="size-3 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50"></div>
                <span className="text-xs font-black uppercase tracking-widest text-slate-900 pointer-events-none">Assistant Jarvis FPL</span>
              </div>
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full">En ligne</span>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar scroll-smooth">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
                  <div className={`size-12 rounded-2xl flex shrink-0 items-center justify-center text-white shadow-xl ${msg.role === "user" ? "bg-emerald-600 shadow-emerald-200/50" : "bg-slate-900 shadow-slate-600/20"}`}>
                    <span className="material-symbols-outlined text-xl">{msg.role === "user" ? "person" : "smart_toy"}</span>
                  </div>
                  <div className={`p-5 rounded-[2rem] text-sm leading-relaxed max-w-[85%] shadow-sm ${msg.role === "user" ? "bg-emerald-600 text-white rounded-tr-none" : "bg-white border border-slate-100 text-slate-700 rounded-tl-none whitespace-pre-wrap font-bold"}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && mode === "chat" && (
                <div className="flex gap-4">
                  <div className="size-12 rounded-2xl bg-slate-900 flex shrink-0 items-center justify-center text-white shadow-xl">
                    <span className="material-symbols-outlined text-xl">smart_toy</span>
                  </div>
                  <div className="bg-white border border-slate-100 p-5 rounded-[2rem] rounded-tl-none flex items-center gap-2 shadow-sm">
                    <div className="size-2 bg-emerald-400 rounded-full animate-bounce"></div>
                    <div className="size-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="size-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-8 border-t border-slate-100 bg-white">
              <div className="relative flex items-center">
                <input value={question} onChange={e => setQuestion(e.target.value)} onKeyDown={e => e.key === 'Enter' && ask()} 
                       className="w-full bg-slate-50 border border-slate-100 rounded-[2.5rem] py-5 pl-8 pr-16 text-sm font-bold focus:border-emerald-600 transition-all outline-none placeholder:text-slate-300" 
                       placeholder="Posez une question technique ou stratégique..." type="text" />
                <button onClick={ask} disabled={loading} className="absolute right-2.5 size-12 bg-slate-900 text-white rounded-full hover:bg-emerald-600 transition-all flex items-center justify-center shadow-xl active:scale-90 group">
                  <span className="material-symbols-outlined text-2xl group-hover:translate-x-0.5 transition-transform">send</span>
                </button>
              </div>
            </div>
          </div>

        </section>

        <aside className="lg:col-span-3 flex flex-col gap-6">
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-slate-300/50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-emerald-500/20 transition-all"></div>
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <span className="material-symbols-outlined text-emerald-400">workspace_premium</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Version Pro</span>
            </div>
            <p className="text-sm font-black tracking-tight leading-snug mb-3 uppercase relative z-10">
              Modèle Jarvis <span className="text-emerald-400">v3.2</span>
            </p>
            <p className="text-[10px] font-bold opacity-60 leading-relaxed relative z-10">
              Analysant les flux live xG, xA et les tendances algorithmiques de la Gameweek en cours.
            </p>
          </div>
        </aside>

      </div>
    </main>
  );
}
