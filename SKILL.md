---
name: jarvisbot-team
description: >
  Utilise cette compétence pour coordonner une équipe d'agents intelligents (multi-agents) sur n'importe quel projet complexe.
  JarvisBot orchestre des rôles spécialisés (Architecte, Frontend, Backend, Marketer, Chercheur, Réviseur) qui travaillent en parallèle via un système de messagerie et de tâches.
  DÉCLENCHE cette compétence dès que l'utilisateur mentionne : "équipe d'agents", "multi-agents", "JarvisBot", "clone de site", "application Fantasy Football", "fantasy stats", "fantasy PL", ou toute demande de projet nécessitant plusieurs rôles spécialisés en parallèle.
  Inclut un module dédié à la création d'un clone de Premier League Fantasy Football orienté statistiques avancées, permettant à l'utilisateur de maximiser ses points à chaque gameweek.
---

# Skill : Équipe JarvisBot (Multi-Agents)

Cette compétence permet à Antigravity de coordonner une équipe d'agents intelligents travaillant en parallèle, en reproduisant la fonctionnalité **"Agent Teams" de Claude Code**.

Elle intègre également un module spécialisé : **StatFantasy** — un clone de PL Fantasy basé sur les statistiques avancées pour maximiser les points de l'utilisateur à chaque gameweek.

---

## Configuration de l'environnement

L'équipe utilise un dossier caché à la racine du projet :

- `.antigravity/team/tasks.json` → Liste des tâches, états et dépendances
- `.antigravity/team/mailbox/` → Messages individuels (`.msg`)
- `.antigravity/team/broadcast.msg` → Messages globaux pour toute l'équipe
- `.antigravity/team/locks/` → Sémaphores pour éviter l'édition simultanée

---

## Rôles de l'équipe

| Rôle | Responsabilité |
|------|----------------|
| **Directeur (JarvisBot)** | Divise le problème, attribue les rôles, approuve les plans |
| **Architecte** | Définit la structure et les patterns avant de coder |
| **Spécialiste** (Frontend / Backend / DB) | Exécute les tâches techniques |
| **Marketer** | Branding, logos, copywriting, landing pages |
| **Chercheur / Investigateur** | Recherche, documentation, analyse de marché |
| **Réviseur (Devil's Advocate)** | Cherche les failles, bugs et failles de sécurité |

---

## Protocole d'orchestration

### 1. Mode de planification (Gatekeeping)

Avant toute modification importante, chaque agent envoie un **Plan d'Action** dans la boîte de réception de JarvisBot.
L'agent reste en mode `READ_ONLY` ou `PLANNING` jusqu'à la réponse `APPROVED`.

### 2. Messagerie et diffusion

- **Message direct** : coordination 1-à-1 entre spécialistes
- **Broadcast** : JarvisBot écrit dans `broadcast.msg` pour diffuser à toute l'équipe

### 3. Dépendances de tâches

Une tâche ne peut être réclamée que si toutes ses `dependencies` ont le statut `COMPLETED`.

---

## Règles critiques

- **NE JAMAIS modifier un fichier** si un `.lock` actif existe dans `.antigravity/team/locks/`
- Quand une tâche est terminée : libérer les locks ET notifier JarvisBot

---

## Script d'orchestration

> Voir `scripts/team_manager.py` pour le script complet.

Commandes disponibles :
```bash
python team_manager.py init              # Initialise l'infrastructure
python team_manager.py assign "titre" "agent" '["dep1"]'
python team_manager.py broadcast "sender" "message"
python team_manager.py send "sender" "receiver" "message"
```

---

---

# MODULE : StatFantasy — Clone PL Fantasy orienté Statistiques

> **Objectif** : Construire une application web full-stack qui reproduit les fonctionnalités de PL Fantasy (sélection d'équipe, transferts, points par gameweek) en y ajoutant une couche d'analyse statistique avancée pour maximiser les points de l'utilisateur.

Pour l'implémentation complète, lire : `references/statfantasy.md`

---

## Vue d'ensemble du projet StatFantasy

### Fonctionnalités principales

1. **Sélection d'équipe intelligente** — Recommandations basées sur les statistiques (xG, xA, forme, fixtures)
2. **Tableau de bord analytique** — Visualisation des données de performance par joueur
3. **Moteur de score prédictif** — Prédiction des points pour le prochain gameweek
4. **Gestionnaire de transferts** — Suggestions optimales de transferts basées sur les stats
5. **Comparateur de joueurs** — Comparaison multi-critères statistiques
6. **Alertes intelligentes** — Notifications pour les joueurs en forme / blessures / rotations

### Stack technologique recommandée

```
Frontend  : React + TypeScript + Tailwind CSS + Recharts / Chart.js
Backend   : FastAPI (Python) ou Node.js/Express
Base de données : PostgreSQL + Redis (cache)
Data Sources : FPL API officielle + Understat + FBref
Déploiement : Docker + Vercel/Railway
```

---

## Architecture des agents pour StatFantasy

Quand l'utilisateur demande de construire StatFantasy, JarvisBot assigne les rôles ainsi :

```
JarvisBot (Directeur)
├── Architecte          → Structure DB, schéma API, modèle de données joueurs
├── Backend Specialist  → FastAPI, endpoints /players /fixtures /predictions
├── Data Specialist     → Ingestion FPL API, calcul xG/xA, scoring engine
├── Frontend Specialist → Dashboard React, sélecteur d'équipe, graphiques
├── Chercheur           → Analyse des métriques FPL, stratégies gameweek
└── Réviseur            → Tests, edge cases, validation des scores
```

---

## Métriques statistiques clés à implémenter

| Métrique | Description | Impact sur les points |
|----------|-------------|----------------------|
| **xG** (expected goals) | Probabilité de marquer | Prédire les buts → 4-6 pts |
| **xA** (expected assists) | Probabilité de passe décisive | Prédire les assists → 3 pts |
| **Form score** | Moyenne des points sur les 5 derniers GW | Tendance récente |
| **Fixture Difficulty Rating** | Difficulté des prochains adversaires | Calendrier favorable |
| **Minutes played %** | % de titularisation | Éviter les remplaçants |
| **Bonus Point System (BPS)** | Score brut de performance en match | Prédire les bonus pts |
| **Clean sheet probability** | Pour défenseurs/gardiens | 4-6 pts potentiels |
| **ICT Index** | Influence + Créativité + Menace | Score composite FPL officiel |
| **Ownership %** | Taux de possession dans FPL global | Différentiel ou capitaine sûr |
| **Price change velocity** | Vitesse de variation de prix | Acheter avant hausse |

---

## Démarrage rapide avec JarvisBot

### Étape 1 — Initialiser le projet

```
Utilise la compétence Équipe JarvisBot pour créer un clone de PL Fantasy orienté statistiques (StatFantasy)
```

### Étape 2 — JarvisBot décompose le travail

JarvisBot créera automatiquement les tâches suivantes dans `tasks.json` :

```json
[
  {"id": 1, "title": "Setup DB schema (players, fixtures, gameweeks)", "assigned_to": "Architecte"},
  {"id": 2, "title": "FPL API ingestion pipeline", "assigned_to": "Data Specialist", "dependencies": [1]},
  {"id": 3, "title": "xG/xA stats calculator", "assigned_to": "Data Specialist", "dependencies": [2]},
  {"id": 4, "title": "Prediction scoring engine", "assigned_to": "Backend", "dependencies": [3]},
  {"id": 5, "title": "REST API endpoints", "assigned_to": "Backend", "dependencies": [1]},
  {"id": 6, "title": "React dashboard + team selector", "assigned_to": "Frontend", "dependencies": [5]},
  {"id": 7, "title": "Charts & analytics views", "assigned_to": "Frontend", "dependencies": [5, 3]},
  {"id": 8, "title": "Transfer optimizer UI", "assigned_to": "Frontend", "dependencies": [4, 6]},
  {"id": 9, "title": "QA + edge cases", "assigned_to": "Réviseur", "dependencies": [6, 7, 8]}
]
```

### Étape 3 — Ouvrir les terminaux agents

Un terminal par agent, chacun reçoit son rôle via broadcast.

---

## Stratégies de maximisation des points par gameweek

Ces règles doivent être intégrées dans le moteur de recommandation :

1. **Triple Captain weeks** — Identifier les GW où un joueur premium a un fixture facile à domicile
2. **Bench boost optimization** — Calculer la valeur totale du banc avant d'activer le chip
3. **Free Hit strategy** — Analyser les doubles/blanks gameweeks pour maximiser le free hit
4. **Differential picks** — Suggérer des joueurs à < 10% ownership avec xG élevé
5. **Captain choice algorithm** — Classer les candidats par (xG + xA) × (1 / FDR) × form
6. **Wildcard timing** — Détecter le meilleur moment via analyse des fixtures sur 6 GW

---

## Flux de données

```
FPL Official API ──────────────────────────────────────────────────────┐
  /bootstrap-static  (joueurs, équipes, éléments)                      │
  /fixtures          (matchs, FDR)                                      ▼
  /element-summary/{id} (stats historiques par joueur)        Data Ingestion Layer
                                                                        │
Understat API ──────────────────────────────────────────────────────────┤
  xG, xA, npxG par match                                                │
                                                                        ▼
                                                            PostgreSQL Database
                                                            (players, stats, gw)
                                                                        │
                                                                        ▼
                                                            Scoring Engine (Python)
                                                            xG model + Form + FDR
                                                                        │
                                                                        ▼
                                                            FastAPI REST endpoints
                                                                        │
                                                                        ▼
                                                            React Dashboard
                                                            (Team Picker + Analytics)
```

---

## Pour aller plus loin

Consulter `references/statfantasy.md` pour :
- Schéma complet de la base de données
- Code du scoring engine Python
- Composants React de référence
- Endpoints API détaillés
- Stratégies de test et validation des prédictions