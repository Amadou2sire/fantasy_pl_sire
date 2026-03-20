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
cp .env.example .env   # Ajoute ta clé AICC_API_KEY - TEST sk-u1AjEyl698WGZxlDnFfCmIaq83R6z5pjR5RaTxZO5AawD2uP

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

### AI Prediction Engine (Scoring Engine)

Le calcul des **Top Predictions** et du **Predicted XI** n'est pas une simple moyenne, mais un algorithme multicritères ("Scoring Engine") qui simule une intelligence analytique sportive :

1. **Base de Potentiel** : Un mix pondéré entre la **forme récente** (5 derniers matchs) et la **moyenne globale de points par match (PPG)**.
2. **Menace Offensive (xG/xA)** : Analyse des **Expected Goals (xG)** et **Expected Assists (xA)** par 90 minutes. Le poids des buts varie selon le poste (plus élevé pour un défenseur/milieu).
3. **Indice ICT** : Intégration de l'Influence, Créativité et Menace (statistiques officielles FPL) pour évaluer l'impact réel sur le terrain.
4. **Difficulté du Match (FDR)** : Le score est dynamiquement ajusté selon l'adversaire de la prochaine Gameweek. Un match à domicile contre une équipe faible booste le score, tandis qu'un match difficile à l'extérieur le réduit.
5. **Bonus de Momentum** : Un multiplicateur de confiance est appliqué aux joueurs figurant dans la *Dream Team* actuelle.
6. **Probabilité de Jeu** : Les scores sont automatiquement réduits si un joueur est blessé ou incertain (douleur, suspension).

### AI Advisor (LLM)

Le **Conseiller IA** (le chat et le comparateur) utilise un modèle de langage avancé (via l'API **AI.CC** ou **Groq**) qui récupère le contexte des données FPL injectées pour fournir des conseils stratégiques en langage naturel.

---
[API AI.CC](https://api.ai.cc/)

