# FPL Dashboard

Dashboard Fantasy Premier League avec conseils IA (AICC).

## Stack
- Backend : FastAPI + Python (données FPL + AICC GPT-4o)
- Frontend : React + Vite + Tailwind CSS

## Lancement

### Backend
```bash
cd backend
python -m venv .venv
# Sur Windows
.venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env   # Ajoute ta clé AICC_API_KEY
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Features
- Dashboard avec stats GW actuelle et Dream Team
- Recherche et stats joueurs (xG, xA, forme, ownership)
- Fixtures avec indicateurs de difficulté (1=facile -> 5=difficile)
- Conseiller IA alimenté par GPT-4o avec données temps réel

## Intégration API FPL

Le backend récupère les données via l'API officielle de la Premier League :

- **Configuration Globale** : `https://fantasy.premierleague.com/api/bootstrap-static/` (équipes, joueurs, gameweeks)
- **Fixtures** : `https://fantasy.premierleague.com/api/fixtures/`
- **Dream Team** : `https://fantasy.premierleague.com/api/dream-team/{gw}/` (équipe de la semaine)
- **Détails Joueurs** : `https://fantasy.premierleague.com/api/element-summary/{id}/`

Les données sont enrichies et filtrées côté backend (`fpl_client.py`) pour fournir des indicateurs comme l'Expected Goals (xG), l'Expected Assists (xA) et le FDR (Fixture Difficulty Rating).


