<p align="center">
  <img src="frontend/src/img/logo-medianet.png" width="100" alt="Medianet Logo" />
</p>

# FPL Intelligent Dashboard & JarvisBot GPT-4o


[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![TailwindCSS](https://img.shields.io/badge/Styling-Tailwind-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![OpenAI](https://img.shields.io/badge/AI-Jarvis_GPT--4o-412991?style=for-the-badge&logo=openai&logoColor=white)](https://openai.com/)

Une plateforme analytique avancée pour la Fantasy Premier League, intégrant un moteur de prédiction algorithmique et un assistant IA ultra-personnalisé (JarvisBot) capable de lire vos données de ligue et votre effectif en temps réel.

---

## Fonctionnalités Clés

### JarvisBot : Votre Assistant IA Stratégique
Un chatbot flottant accessible partout, propulsé par GPT-4o, avec un contexte de données profond :
- **Lecture d'Équipe** : Jarvis connaît votre effectif actuel (via votre ID FPL).
- **Analyse de Ligue** : Accès complet au classement de votre ligue pour des conseils de rivalité.
- **Base de Données Locale** : Capacité à analyser vos "Équipes Types" sauvegardées dans la base SQLite.
- **Live Context** : Injection automatique des stats GW (xG, xA, FDR) dans le prompt.

### Analyses & Predictions
- **Scoring Engine** : Algorithme multicritères simulant le potentiel de points (PPG, Forme, FDR, xG/xA).
- **Team of the Week** : Visualisation de la Dream Team actuelle et de la Predicted XI (prochaine GW).
- **Stats Avancées** : Filtrage dynamique des joueurs par poste, prix et indicateurs de performance.

### Calendrier & Résultats (Fixtures)
- Historique des scores de la saison en cours.
- Indicateurs visuels de difficulté (FDR) sans bruit numérique pour une lecture rapide.

---

## Stack Technique

| Composant | Technologie | Rôle |
| :--- | :--- | :--- |
| **Backend** | Python / FastAPI | API REST & Scraping FPL de haute performance |
| **Frontend** | React / Vite | Interface utilisateur réactive et moderne |
| **Styling** | Tailwind CSS | Design Système Premium (Glassmorphism) |
| **Database** | SQLite / SQLAlchemy| Stockage des templates et préférences utilisateur |
| **IA** | OpenAI GPT-4o | Moteur de recommandation stratégique |

---

## Installation & Lancement

### 1. Prérequis
- Python 3.9+
- Node.js 18+
- Une clé API pour OpenAI (ou compatible via AI.CC)

### 2. Configuration Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Configuration des variables d'environnement
cp .env.example .env
```
Éditez le fichier `.env` :
```env
AICC_API_KEY=votre_cle_ici
# Optionnel
DATABASE_URL=sqlite:///./fpl.db
```
Lancer le serveur :
```bash
uvicorn main:app --reload --port 8000
```

### 3. Configuration Frontend
```bash
cd frontend
npm install
npm run dev
```
L'application sera accessible sur `http://localhost:5173`.

---

## Architecture de l'API

### Endpoints Principaux
| Méthode | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/players` | Liste enrichie des joueurs avec stats xG/xA |
| `GET` | `/api/fixtures` | Calendrier complet + scores passés |
| `POST`| `/api/ai/advice`| Chatbot Jarvis (Question + context utilisateur) |
| `POST`| `/api/templates` | Sauvegarder une équipe type en DB |
| `GET` | `/api/user-team/{id}` | Récupère la squad officielle d'un manager FPL |

### Intégrations Externes (FPL API)
Le projet interagit dynamiquement avec les endpoints officiels :
- `bootstrap-static/` : Données globales (joueurs, clubs).
- `fixtures/` : Matchs et FDR.
- `leagues-classic/{id}/standings/` : Classements de ligues.

---

## Le Moteur de Prédiction (Scoring Engine)
L'algorithme de prédiction calcule une note de **1 à 100** pour chaque joueur selon :
1. **Poids Offensif (35%)** : xG + xA par 90 min.
2. **Momentum (25%)** : Moyenne de forme sur les 5 derniers matchs.
3. **FDR Adjustment (20%)** : Bonus/Malus selon la difficulté du prochain adversaire.
4. **Disponibilité (20%)** : Réduction drastique du score en cas de blessure ou suspension.

---

## Licence
Ce projet est distribué sous licence MIT. Libre à vous de l'adapter pour vos propres ligues !

---
*Développé pour la communauté FPL de MEDIANET.*
