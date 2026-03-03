const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
const get = (path) => fetch(`${BASE}${path}`).then(r => r.json());
const post = (path, body) => fetch(`${BASE}${path}`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
}).then(r => r.json());

export const getCurrentGameweek = () => get("/api/gameweek/current");
export const getAllGameweeks = () => get("/api/gameweeks");
export const getPlayers = (search = "", position = "", limit = 50) => {
  const p = new URLSearchParams();
  if (search) p.set("search", search);
  if (position && position !== "ALL") p.set("position", position);
  p.set("limit", limit);
  return get(`/api/players?${p}`);
};
export const getPlayerDetail = (id) => get(`/api/players/${id}`);
export const getFixtures = (gw) => get(`/api/fixtures${gw ? "?gameweek=" + gw : ""}`);
export const getAIAdvice = (q) => post("/api/ai/advice", { question: q });
export const comparePlayers = (pl) => post("/api/ai/compare", { players: pl });
export const getLatestDreamTeam = () => get("/api/dream-team");
