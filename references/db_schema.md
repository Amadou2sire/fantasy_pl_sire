# StatFantasy Database Schema

## Architecture
Le projet StatFantasy utilise une base de données **PostgreSQL** pour stocker les entités, métriques et prédictions FPL. 
Cette base est structurée en plusieurs tables axées sur les joueurs, les équipes, le calendrier (fixtures), ainsi que l'historique statistique (Understat + FBref + FPL API).

---

## 1. Table `teams`
Contient la liste des équipes de Premier League.
* `id` : INT (PK) - ID FPL officiel de l'équipe
* `name` : VARCHAR(100) - Nom de l'équipe
* `short_name` : VARCHAR(3) - Trigramme (ex: ARS, MCI)
* `strength` : INT - Force globale selon FPL
* `strength_attack_home` : INT
* `strength_attack_away` : INT
* `strength_defence_home` : INT
* `strength_defence_away` : INT

## 2. Table `players`
Données statiques des joueurs FPL.
* `id` : INT (PK) - ID FPL du joueur
* `first_name` : VARCHAR(100)
* `second_name` : VARCHAR(100)
* `web_name` : VARCHAR(100) - Nom affiché sur FPL
* `team_id` : INT (FK -> teams.id)
* `element_type` : INT (1=GK, 2=DEF, 3=MID, 4=FWD)
* `status` : VARCHAR(1) (a=available, d=doubtful, i=injured, s=suspended, u=unavailable)
* `is_active` : BOOLEAN

## 3. Table `fixtures`
Calendrier des matchs et difficulté (FDR).
* `id` : INT (PK) - ID Fixture FPL
* `event` : INT (FK -> gameweeks.id) - Peut être null si non planifié
* `team_h` : INT (FK -> teams.id)
* `team_a` : INT (FK -> teams.id)
* `team_h_difficulty` : INT (FDR domicile)
* `team_a_difficulty` : INT (FDR extérieur)
* `kickoff_time` : TIMESTAMP
* `started` : BOOLEAN
* `finished` : BOOLEAN

## 4. Table `gameweeks`
Liste des journées (Event FPL).
* `id` : INT (PK) - Numéro de GW (1 à 38)
* `name` : VARCHAR(50)
* `deadline_time` : TIMESTAMP
* `is_current` : BOOLEAN
* `is_next` : BOOLEAN
* `finished` : BOOLEAN

## 5. Table `player_gw_stats`
Historique granulaire hebdomadaire de chaque joueur. Les métriques avancées sont compilées ici.
* `id` : BIGINT (PK, auto-increment)
* `player_id` : INT (FK -> players.id)
* `fixture_id` : INT (FK -> fixtures.id)
* `gameweek` : INT (FK -> gameweeks.id)
* `minutes` : INT - Minutes jouées
* **Métriques FPL Officielles :**
    * `total_points` : INT
    * `bps` : INT (Bonus Point System)
    * `ict_index` : FLOAT
    * `clean_sheets` : INT
    * `goals_scored` : INT
    * `assists` : INT
* **Métriques Avancées (Understat/FPL) :**
    * `xG` : FLOAT (Expected Goals)
    * `xA` : FLOAT (Expected Assists)
    * `expected_goal_involvements` : FLOAT
    * `form` : FLOAT (Sur les 30 derniers jours typiquement)
    * `ownership_percent` : FLOAT
* **Statut marché :**
    * `value` : INT (Prix du joueur, x10)
    * `transfers_balance` : INT (Transferts In - Out)

## 6. Table `predictions`
Stockage des prédictions générées par notre "Scoring Engine" pour les prochains gameweeks.
* `id` : BIGINT (PK, auto-increment)
* `player_id` : INT (FK -> players.id)
* `gameweek` : INT (FK -> gameweeks.id)
* `predicted_points` : FLOAT - Projection de points bruts
* `predicted_minutes` : INT - Estimation des minutes de jeu
* `prediction_date` : TIMESTAMP - Quand a été fait le calcul
* `model_version` : VARCHAR(50) - Version du Scoring Engine utilisé
