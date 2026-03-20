"""
Intégration Claude pour conseils FPL avec contexte temps réel.
"""
import os
from dotenv import load_dotenv
from openai import OpenAI
from fpl_client import get_top_players, get_fixtures_with_teams, get_current_gameweek

dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path)

client = OpenAI(
    api_key=os.environ.get("AICC_API_KEY"),
    base_url="https://api.ai.cc/v1"
)

SYSTEM_PROMPT = """
Tu es un expert confirmé de Fantasy Premier League (FPL) avec une maîtrise avancée des statistiques, du calendrier, des tendances de forme et des stratégies différentielles.

Ta mission est d’analyser uniquement les données réelles fournies et de produire des recommandations claires, optimisées et immédiatement actionnables.

Règles de réponse :

Réponds toujours dans la même langue que celle utilisée dans la question.

Adopte un ton direct, analytique et stratégique.

fais la diférences entre les postes : gardien - defenseur - milieu - attaquant

Structure systématiquement la réponse sous forme de bullet points.

Chaque recommandation doit être justifiée par des données chiffrées précises lorsque disponibles (xG, xA, tirs, minutes jouées, fixtures, clean sheet probability, ownership, forme récente, etc.).

Mets en évidence les opportunités à fort potentiel ainsi que les risques associés.

Si certaines données sont manquantes ou insuffisantes, indique-le explicitement.

Priorise la clarté et l’efficacité : pas de remplissage inutile.

Objectif :
Maximiser les points sur la Gameweek en cours tout en optimisant la stratégie à moyen terme. Si un classement de ligue est fourni, analyse la position de l'utilisateur par rapport à ses rivaux directs et suggère des coups stratégiques pour les rattraper ou distancer.
"""

async def build_fpl_context(team_id: int = None, league_id: int = None, db = None) -> str:
    from fpl_client import get_user_team, get_league_standings
    from models import TemplateTeam
    
    gw      = await get_current_gameweek()
    top_fwd = await get_top_players(limit=5,  position="FWD")
    top_mid = await get_top_players(limit=5,  position="MID")
    fixtures = await get_fixtures_with_teams(gameweek=gw.get("id"))

    def fmt(p):
        return (f"{p['web_name']} ({p['team']}, £{p['price']}m) — "
                f"{p['total_points']}pts, forme={p['form']}, "
                f"xG={p['xg']}, xA={p['xa']}, ownership={p['selected_by']}%")

    lines = [
        f"=== CONTEXTE FPL — GW {gw.get('id')} ===",
        f"Deadline: {gw.get('deadline_time', 'N/A')}",
        "", "--- JOUEURS CLÉS ---", *[fmt(p) for p in (top_fwd + top_mid)],
    ]

    # Add user team context
    if team_id:
        user_data = await get_user_team(team_id)
        if "team" in user_data:
            lines.append("\n--- ÉQUIPE ACTUELLE DE L'UTILISATEUR ---")
            lines.append(f"Nom: {user_data.get('team_name')}")
            for p in user_data["team"]:
                lines.append(f"- {p['web_name']} ({p['position']}, {p['team']})")

    # Add League context
    if league_id:
        league_data = await get_league_standings(league_id)
        if "standings" in league_data:
            lines.append("\n--- CLASSEMENT COMPLET DE LA LIGUE ---")
            lines.append(f"Ligue: {league_data.get('league', {}).get('name', 'Ma Ligue')}")
            for entry in league_data["standings"].get("results", []):
                lines.append(f"#{entry['rank']} {entry['entry_name']} ({entry['player_name']}) — {entry['total']} pts")


    # Add DB templates context
    if db:
        templates = db.query(TemplateTeam).order_by(TemplateTeam.created_at.desc()).limit(3).all()
        if templates:
            lines.append("\n--- ÉQUIPES TYPES ENREGISTRÉES (SOUHAITS) ---")
            for t in templates:
                p_names = ", ".join([p.get("web_name", "?") for p in t.players[:5]])
                lines.append(f"- {t.name}: {p_names}...")

    lines.append("\n--- MATCHS GW ---")
    for f in fixtures[:8]:
        lines.append(f"{f['home_team']} vs {f['away_team']} (Diff: {f['home_difficulty']}/{f['away_difficulty']})")
    
    return "\n".join(lines)

async def get_ai_advice(question: str, team_id: int = None, league_id: int = None, db = None) -> str:
    context = await build_fpl_context(team_id=team_id, league_id=league_id, db=db)
    completion = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Données FPL:\n{context}\n\nQuestion de l'utilisateur: {question}"}
        ],
        temperature=0.7,
        max_tokens=1024,
    )
    return completion.choices[0].message.content



async def compare_players_ai(player_names: list[str]) -> str:
    all_p = await get_top_players(limit=200)
    selected = []
    for name in player_names:
        n = name.lower()
        m = next((p for p in all_p if n in p["name"].lower() or n in p["web_name"].lower()), None)
        if m:
            selected.append(m)
    if not selected:
        return "❌ Aucun joueur trouvé avec ces noms."

    ctx = "Comparaison de joueurs FPL:\n"
    for p in selected:
        ctx += (f"\n{p['name']} ({p['position']}, {p['team']}, £{p['price']}m):\n"
                f"  Points: {p['total_points']} | Forme: {p['form']} | "
                f"xG: {p['xg']} | xA: {p['xa']} | Ownership: {p['selected_by']}%\n"
                f"  Buts: {p['goals']} | Passes: {p['assists']} | Minutes: {p['minutes']}\n")

    completion = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"{ctx}\nQui faut-il privilégier et pourquoi ?"}
        ],
        temperature=0.7,
        max_tokens=800,
    )
    return completion.choices[0].message.content
