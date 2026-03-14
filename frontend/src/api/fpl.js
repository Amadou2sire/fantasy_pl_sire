const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
const get = (path) => fetch(`${BASE}${path}`).then(r => r.json());
const post = (path, body) => fetch(`${BASE}${path}`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
}).then(r => r.json());
const del = (path) => fetch(`${BASE}${path}`, { method: "DELETE" }).then(r => r.json());

export const getGameweeks   = () => get("/api/gameweeks");
export const getTeams       = () => get("/api/teams");
export const getPlayers     = () => get("/api/players?limit=200");
export const getFixtures    = () => get("/api/fixtures");
export const getPredictions = () => get("/api/predictions");
export const getDreamTeam   = () => get("/api/dream-team");
export const getDreamTeamNext = () => get("/api/dream-team/next");
export const getUserTeam      = (id) => get(`/api/user-team/${id}`);

export const saveTemplate    = (data) => post("/api/templates", data);
export const getTemplates   = () => get("/api/templates");
export const deleteTemplate = (id) => del(`/api/templates/${id}`);

// Fallback old endpoints if they are revived
export const getAIAdvice = (q) => post("/api/ai/advice", { question: q });
export const comparePlayers = (pl) => post("/api/ai/compare", { players: pl });
