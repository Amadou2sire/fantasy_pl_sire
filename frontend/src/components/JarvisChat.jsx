import { useState, useEffect, useRef } from "react";
import { getAIAdvice, getChatHistory, clearChatHistory } from "../api/fpl";

export default function JarvisChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Load History
  useEffect(() => {
    const loadData = async () => {
      try {
        const history = await getChatHistory();
        if (history && history.length > 0) {
          setMessages(history);
        } else {
          setMessages([
            { role: "bot", content: "Hello! Je suis Jarvis, votre assistant FPL. Comment puis-je vous aider aujourd'hui ?" }
          ]);
        }
      } catch (err) {
        console.error("Failed to load chat history", err);
        setMessages([
          { role: "bot", content: "Hello! Je suis Jarvis, votre assistant FPL. Comment puis-je vous aider aujourd'hui ?" }
        ]);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, loading, isOpen]);

  const ask = async () => {
    if (!question.trim()) return;
    const userMsg = question;
    setQuestion("");
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

  const clearChat = async () => {
    if (window.confirm("Voulez-vous vraiment effacer toute la discussion ?")) {
      await clearChatHistory();
      setMessages([
        { role: "bot", content: "Discussion effacée. Comment puis-je vous aider ?" }
      ]);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-4 pointer-events-none">
      {/* Chat Window */}
      {isOpen && (
        <div className="pointer-events-auto w-[90vw] sm:w-[400px] h-[600px] max-h-[80vh] bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-emerald-500/20 border border-slate-100 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-300">
          {/* Header */}
          <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/50">
                <span className="material-symbols-outlined text-white text-xl">smart_toy</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Assistant IA</span>
                <span className="text-sm font-black uppercase tracking-tighter">JarvisBot</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={clearChat}
                title="Effacer la discussion"
                className="size-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-all text-slate-400 hover:text-white"
              >
                <span className="material-symbols-outlined text-lg">delete_sweep</span>
              </button>
              <button onClick={() => setIsOpen(false)} className="size-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-all">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar scroll-smooth">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`p-4 rounded-[1.5rem] text-xs leading-relaxed max-w-[85%] font-bold shadow-sm ${
                  msg.role === "user" 
                    ? "bg-emerald-600 text-white rounded-tr-none" 
                    : "bg-slate-50 border border-slate-100 text-slate-700 rounded-tl-none whitespace-pre-wrap"
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] rounded-tl-none flex items-center gap-2 shadow-sm">
                  <div className="size-1.5 bg-emerald-400 rounded-full animate-bounce"></div>
                  <div className="size-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="size-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="p-6 border-t border-slate-100 bg-white">
            <div className="relative flex items-center">
              <input 
                value={question} 
                onChange={e => setQuestion(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && ask()} 
                placeholder="Posez votre question..." 
                className="w-full bg-white border border-slate-300 shadow-sm rounded-full py-4 pl-6 pr-14 text-xs font-bold focus:border-emerald-600 outline-none transition-all placeholder:text-slate-300"

              />
              <button onClick={ask} disabled={loading} className="absolute right-1.5 size-10 bg-slate-900 text-white rounded-full flex items-center justify-center hover:bg-emerald-600 transition-all shadow-lg active:scale-95 disabled:opacity-50">
                <span className="material-symbols-outlined text-xl">send</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bubble Trigger */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="pointer-events-auto size-16 bg-slate-900 rounded-full flex items-center justify-center text-white shadow-2xl shadow-emerald-500/30 hover:bg-emerald-600 hover:scale-110 active:scale-90 transition-all group relative"
      >
        <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-20 group-hover:opacity-40 transition-opacity"></div>
        <span className="material-symbols-outlined text-3xl group-hover:rotate-12 transition-transform">
          {isOpen ? 'close_fullscreen' : 'smart_toy'}
        </span>
      </button>
    </div>
  );
}

