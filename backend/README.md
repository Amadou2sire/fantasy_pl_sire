# ⚽ FPL Dashboard

Dashboard Fantasy Premier League avec conseils IA (Claude).

## Stack
- **Backend** : FastAPI + Python (données FPL + Anthropic Claude)
- **Frontend** : React + Vite + Tailwind CSS

## Lancement

### Backend
```bash
cd backend
python -m venv .venv
pip install -r requirements.txt
cp .env.example .env   # Ajoute ta clé ANTHROPIC_API_KEY
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Features
- 🏠 Dashboard avec stats GW actuelle
- ⚽ Recherche & stats joueurs (xG, xA, forme, ownership)
- 📅 Fixtures avec indicateurs de difficulté (1=facile → 5=difficile)
- 🤖 Conseiller IA alimenté par Claude avec données temps réel
