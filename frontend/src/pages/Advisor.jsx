import { useState, useEffect, useRef } from "react";
import { getAIAdvice, comparePlayers } from "../api/fpl";

function Spinner() {
  return <div className="flex justify-center p-8 text-violet-600">
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
      const res = await getAIAdvice(userMsg);
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
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">AI <span className="text-violet-600">Advisor</span></h1>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest text-[10px]">Conseils personnalisés & Comparaisons IA</p>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
        {/* Left Sidebar: AI Suggestions */}
        <aside className="lg:col-span-3 flex flex-col gap-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-violet-600">auto_awesome</span>
              <h3 className="font-black text-[10px] uppercase tracking-wider text-slate-400">Smart Insights</h3>
            </div>
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-black text-slate-900 mb-1 uppercase tracking-widest">Confiance IA</p>
                <div className="mt-2 text-[11px] text-slate-500 font-medium leading-relaxed">Précision de 94% sur les tendances de prix cette saison.</div>
              </div>
            </div>
            <button className="w-full mt-4 py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-violet-600 transition-all shadow-lg active:scale-95">Voir plus</button>
          </div>
        </aside>

        {/* Middle Section: Main Interface */}
        <section className="lg:col-span-6 flex flex-col gap-6">
          {/* Comparison Tool Section */}
          <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
               <div className="size-10 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600">
                  <span className="material-symbols-outlined">compare_arrows</span>
               </div>
               <h3 className="text-xl font-black text-slate-900">Comparateur Direct</h3>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex gap-4">
                <input value={compare.p1} onChange={e => setCompare({ ...compare, p1: e.target.value })} placeholder="Joueur 1 (ex: Salah)" className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-sm font-bold focus:border-violet-600 outline-none transition-all" />
                <input value={compare.p2} onChange={e => setCompare({ ...compare, p2: e.target.value })} placeholder="Joueur 2 (ex: Haaland)" className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-sm font-bold focus:border-violet-600 outline-none transition-all" />
              </div>
              <button onClick={doCompare} disabled={loading} className="w-full py-3 bg-violet-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-violet-700 transition-all shadow-xl shadow-violet-200 disabled:opacity-50 active:scale-95">
                Comparer avec l'IA
              </button>
            </div>
            {mode === "compare" && loading && <Spinner />}
            {mode === "compare" && compareResult && !loading && (
              <div className="mt-6 p-6 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap animate-in fade-in slide-in-from-top-2">
                {compareResult}
              </div>
            )}
          </div>

          {/* Chat Interface */}
          <div className="bg-white rounded-[40px] flex flex-col h-[650px] border border-slate-200 shadow-xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-3 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50"></div>
                <span className="text-xs font-black uppercase tracking-widest text-slate-900">Jarvis FPL Assistant</span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">En ligne</span>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"} animate-in fade-in slide-in-from-bottom-2`}>
                  <div className={`size-10 rounded-2xl flex shrink-0 items-center justify-center text-white shadow-lg ${msg.role === "user" ? "bg-violet-600 shadow-violet-200" : "bg-slate-900 shadow-slate-200"}`}>
                    <span className="material-symbols-outlined text-lg">{msg.role === "user" ? "person" : "smart_toy"}</span>
                  </div>
                  <div className={`p-4 rounded-3xl text-sm leading-relaxed max-w-[80%] shadow-sm ${msg.role === "user" ? "bg-violet-600 text-white rounded-tr-none" : "bg-slate-50 border border-slate-100 text-slate-700 rounded-tl-none whitespace-pre-wrap font-medium"}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && mode === "chat" && (
                <div className="flex gap-4">
                  <div className="size-10 rounded-2xl bg-slate-900 flex shrink-0 items-center justify-center text-white shadow-lg">
                    <span className="material-symbols-outlined text-lg">smart_toy</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-3xl rounded-tl-none flex items-center gap-2">
                    <div className="size-1.5 bg-violet-400 rounded-full animate-bounce"></div>
                    <div className="size-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="size-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-6 border-t border-slate-100 bg-white">
              <div className="relative flex items-center">
                <input value={question} onChange={e => setQuestion(e.target.value)} onKeyDown={e => e.key === 'Enter' && ask()} 
                       className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] py-4 pl-6 pr-14 text-sm font-bold focus:border-violet-600 transition-all outline-none" 
                       placeholder="Posez une question à Jarvis..." type="text" />
                <button onClick={ask} disabled={loading} className="absolute right-2 size-11 bg-slate-900 text-white rounded-full hover:bg-violet-600 transition-all flex items-center justify-center shadow-lg active:scale-90">
                  <span className="material-symbols-outlined text-xl">send</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Right Sidebar */}
        <aside className="lg:col-span-3 flex flex-col gap-6">
          <div className="bg-slate-900 rounded-[32px] p-6 text-white shadow-2xl shadow-slate-200">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-violet-400">workspace_premium</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-violet-400">Premium Stats</span>
            </div>
            <p className="text-sm font-black tracking-tight leading-snug mb-2 uppercase">
              Modèle Jarvis v3.1
            </p>
            <p className="text-[10px] font-bold opacity-60">
              Analysant les données xG, xA et ICT de cette saison.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
