import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Players from "./pages/Players";
import Fixtures from "./pages/Fixtures";
import Advisor from "./pages/Advisor";
import Analytics from "./pages/Analytics";
import Transfers from "./pages/Transfers";

export default function App() {
  return (
    <Router>
      <div className="relative flex min-h-screen flex-col w-full overflow-x-hidden pt-14 bg-slate-50 text-slate-900">
        <Navbar />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/joueurs" element={<Players />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/transfers" element={<Transfers />} />
          <Route path="/fixtures" element={<Fixtures />} />
          <Route path="/advisor" element={<Advisor />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}
