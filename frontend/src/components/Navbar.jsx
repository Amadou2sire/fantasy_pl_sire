export default function Navbar({ current, onChange }) {
  const links = [
    { id: "dashboard", label: "Home" },
    { id: "players", label: "Joueurs" },
    { id: "fixtures", label: "Fixtures" },
    { id: "advisor", label: "Conseiller IA" },
  ];
  return (
    <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-primary px-6 md:px-10 py-4 sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <div className="size-8 text-primary flex items-center justify-center">
          <span className="material-symbols-outlined text-4xl">sports_soccer</span>
        </div>
        <h2 className="text-xl font-black tracking-tight uppercase">MEDIANET Fantasy League</h2>
      </div>

      <div className="hidden md:flex gap-8 items-center">
        <nav className="flex gap-6">
          {links.map(l => (
            <button key={l.id} onClick={() => onChange(l.id)}
              className={`text-sm font-semibold transition-colors
                ${current === l.id
                  ? "text-primary border-b-2 border-primary pb-1"
                  : "text-slate-500 hover:text-primary dark:text-slate-300 dark:hover:text-white"}`}>
              {l.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex gap-3 flex-shrink-0">
        <button className="flex items-center justify-center rounded-lg h-10 w-10 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition hover:bg-slate-200">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <div className="size-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden border border-slate-300 dark:border-slate-600">
          <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAcW1aHe6fcL2J5JUBUXlrDH4WvUzNDMLCDVJLM3l4kTtqxfiMUrqK9SeDzB8jmgjxDad-0gfoPySaJntiq9c3BQrTucEkKEsWC1cXdOHtlrk5C8edIiMaz25OsYdmLuFJ8pWsA2_ZzG1WW87wNZgxvcYnw3Sm8DPe0u_GXaKCB24ECb33fK38SIAOApIyBNj4VZmPYUNu2W4oQvZxAfx3EALmQkCiqQCuxEM7nv8kawrX2oGBla15hxfKR_ugOC_UNrb4dH_yAn8w" />
        </div>
      </div>
    </header>
  );
}
