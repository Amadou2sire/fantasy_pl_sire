import { useState, useEffect, useRef } from "react";
import { getAIAdvice, comparePlayers } from "../api/fpl";

function Spinner() {
  return <div className="flex justify-center p-8 text-primary">
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
    <main className="flex flex-col gap-6 p-6 lg:px-10 max-w-[1440px] mx-auto w-full">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">AI Advisor</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Ask questions and compare players with AI</p>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
        {/* Left Sidebar: AI Suggestions */}
        <aside className="lg:col-span-3 flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-accent">auto_awesome</span>
              <h3 className="font-bold text-sm uppercase tracking-wider text-slate-500">Smart Transfers</h3>
            </div>
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <p className="text-xs font-semibold text-slate-400 mb-1">Example Insights</p>
                <div className="mt-2 text-[11px] text-slate-500">AI confidence: 94% accuracy on price trends.</div>
              </div>
            </div>
            <button className="w-full mt-4 py-2 bg-primary dark:bg-slate-800 text-white text-xs font-bold rounded-lg hover:opacity-90 transition-opacity">Apply All Suggestions</button>
          </div>
        </aside>

        {/* Middle Section: Main Interface */}
        <section className="lg:col-span-6 flex flex-col gap-6">
          {/* Comparison Tool Section */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">Player Comparison</h3>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex gap-4">
                <input value={compare.p1} onChange={e => setCompare({ ...compare, p1: e.target.value })} placeholder="Joueur 1 (ex: Salah)" className="flex-1 bg-slate-50 dark:bg-slate-800 bg-slate-100 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-accent outline-none border border-slate-200" />
                <input value={compare.p2} onChange={e => setCompare({ ...compare, p2: e.target.value })} placeholder="Joueur 2 (ex: Haaland)" className="flex-1 bg-slate-50 dark:bg-slate-800 bg-slate-100 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-accent outline-none border border-slate-200" />
              </div>
              <button onClick={doCompare} disabled={loading} className="w-full py-2 bg-primary text-white font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
                Comparer
              </button>
            </div>
            {mode === "compare" && loading && <Spinner />}
            {mode === "compare" && compareResult && !loading && (
              <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm whitespace-pre-wrap">
                {compareResult}
              </div>
            )}
          </div>

          {/* Chat Interface */}
          <div className="bg-white dark:bg-slate-900 rounded-xl flex flex-col h-[600px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-sm font-semibold">AI Assistant Active</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"} animate-in fade-in slide-in-from-bottom-2`}>
                  <div className={`size-8 rounded-lg flex shrink-0 items-center justify-center text-white ${msg.role === "user" ? "bg-accent" : "bg-primary"}`}>
                    <span className="material-symbols-outlined text-sm">{msg.role === "user" ? "person" : "smart_toy"}</span>
                  </div>
                  <div className={`p-3 rounded-2xl text-sm leading-relaxed max-w-[85%] ${msg.role === "user" ? "bg-primary text-white rounded-tr-none" : "bg-slate-100 dark:bg-slate-800 dark:text-slate-200 rounded-tl-none whitespace-pre-wrap"}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && mode === "chat" && (
                <div className="flex gap-3">
                  <div className="size-8 rounded-lg bg-primary flex shrink-0 items-center justify-center text-white">
                    <span className="material-symbols-outlined text-sm">smart_toy</span>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none flex items-center gap-2">
                    <div className="size-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="size-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="size-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800">
              <div className="relative flex items-center">
                <input value={question} onChange={e => setQuestion(e.target.value)} onKeyDown={e => e.key === 'Enter' && ask()} className="w-full bg-slate-50 dark:bg-slate-800 bg-slate-100 rounded-xl py-3 pl-4 pr-12 text-sm focus:ring-2 focus:ring-accent transition-all outline-none border border-slate-200 dark:text-white" placeholder="Demander conseil sur un transfert..." type="text" />
                <button onClick={ask} disabled={loading} className="absolute right-2 p-2 bg-primary dark:bg-white text-white dark:text-primary rounded-lg hover:bg-opacity-90 disabled:opacity-50">
                  <span className="material-symbols-outlined">send</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Right Sidebar */}
        <aside className="lg:col-span-3 flex flex-col gap-6">
          <div className="bg-primary dark:bg-slate-800 rounded-xl p-5 text-white shadow-xl shadow-primary/20">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-accent">workspace_premium</span>
              <span className="text-xs font-bold uppercase tracking-widest">Premium Insights</span>
            </div>
            <p className="text-sm font-medium opacity-90 mb-4 leading-snug">
              Powered by AI.CC (gpt-4o)
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
