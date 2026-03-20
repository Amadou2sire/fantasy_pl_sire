import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const links = [
    { path: "/",          id: "dashboard", label: "Home" },
    { path: "/joueurs",   id: "players",   label: "Joueurs" },
    { path: "/analytics", id: "analytics", label: "Analytics" },
    { path: "/transfers", id: "transfers", label: "Transferts" },
    { path: "/fixtures",  id: "fixtures",  label: "Fixtures" },
  ];


  const isActive = (path) => location.pathname === path;

  return (
    <header style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999 }}
            className="w-full bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="flex items-center justify-between px-5 md:px-10 h-14">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0" onClick={() => setOpen(false)}>
          <div className="size-9 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 border border-emerald-200 shadow-sm">
            <span className="material-symbols-outlined text-2xl">sports_soccer</span>
          </div>
          <span className="text-base font-black tracking-tight uppercase text-slate-900 hidden sm:block">
            MEDIANET <span className="text-emerald-500">Fantasy</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex gap-1">
          {links.map(l => (
            <Link 
              key={l.id} 
              to={l.path}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all
                ${isActive(l.path)
                  ? "bg-emerald-50 text-emerald-600 shadow-sm border border-emerald-100"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Right icons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button className="hidden sm:flex items-center justify-center rounded-lg h-9 w-9 bg-slate-50 border border-slate-100 text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition">
            <span className="material-symbols-outlined text-lg">notifications</span>
          </button>
          <div className="size-8 rounded-full bg-slate-200 overflow-hidden border-2 border-emerald-500/50 flex-shrink-0">
            <img className="w-full h-full object-cover"
                 src="https://lh3.googleusercontent.com/aida-public/AB6AXuAcW1aHe6fcL2J5JUBUXlrDH4WvUzNDMLCDVJLM3l4kTtqxfiMUrqK9SeDzB8jmgjxDad-0gfoPySaJntiq9c3BQrTucEkKEsWC1cXdOHtlrk5C8edIiMaz25OsYdmLuFJ8pWsA2_ZzG1WW87wNZgxvcYnw3Sm8DPe0u_GXaKCB24ECb33fK38SIAOApIyBNj4VZmPYUNu2W4oQvZxAfx3EALmQkCiqQCuxEM7nv8kawrX2oGBla15hxfKR_ugOC_UNrb4dH_yAn8w"
                 alt="avatar" 
                 loading="lazy"
                 decoding="async"
            />

          </div>
          {/* Hamburger (mobile) */}
          <button className="md:hidden flex items-center justify-center h-9 w-9 rounded-lg bg-slate-50 border border-slate-100 text-slate-600 hover:bg-slate-100 transition"
                  onClick={() => setOpen(o => !o)}>
            <span className="material-symbols-outlined text-lg">{open ? "close" : "menu"}</span>
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <nav className="md:hidden border-t border-slate-100 bg-white flex flex-col px-4 py-3 gap-1 shadow-xl">
          {links.map(l => (
            <Link 
              key={l.id} 
              to={l.path} 
              onClick={() => setOpen(false)}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition
                ${isActive(l.path)
                  ? "bg-emerald-50 text-emerald-600"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"}`}>
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
