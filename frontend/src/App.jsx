import { useState } from "react";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Players from "./pages/Players";
import Fixtures from "./pages/Fixtures";
import Advisor from "./pages/Advisor";

const PAGES = { dashboard: Dashboard, players: Players, fixtures: Fixtures, advisor: Advisor };

export default function App() {
  const [page, setPage] = useState("dashboard");
  const Page = PAGES[page] || Dashboard;
  return (
    <div className="relative flex min-h-screen flex-col w-full overflow-x-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100">
      <Navbar current={page} onChange={setPage} />
      <Page />
    </div>
  );
}
