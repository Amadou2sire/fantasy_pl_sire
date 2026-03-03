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

Maximiser les points sur la Gameweek en cours tout en optimisant la stratégie à moyen terme (value, calendrier, rotation, différentiel, gestion des transferts et du budget).

"""

async def build_fpl_context() -> str:
    gw      = await get_current_gameweek()
    top_fwd = await get_top_players(limit=10, position="FWD")
    top_mid = await get_top_players(limit=10, position="MID")
    top_def = await get_top_players(limit=5,  position="DEF")
    fixtures = await get_fixtures_with_teams(gameweek=gw.get("id"))

    def fmt(p):
        return (f"{p['web_name']} ({p['team']}, £{p['price']}m) — "
                f"{p['total_points']}pts, forme={p['form']}, "
                f"xG={p['xg']}, xA={p['xa']}, ownership={p['selected_by']}%")

    lines = [
        f"=== GAMEWEEK {gw.get('id')} — {gw.get('name')} ===",
        f"Deadline: {gw.get('deadline_time', 'N/A')}",
        "", "--- TOP ATTAQUANTS ---", *[fmt(p) for p in top_fwd],
        "", "--- TOP MILIEUX ---",   *[fmt(p) for p in top_mid],
        "", "--- TOP DÉFENSEURS ---",*[fmt(p) for p in top_def],
        "", "--- FIXTURES GW ---",
    ]
    for f in fixtures[:10]:
        lines.append(f"{f['home_team']} (diff={f['home_difficulty']}) vs {f['away_team']} (diff={f['away_difficulty']})")
    return "\n".join(lines)

async def get_ai_advice(question: str) -> str:
    context = await build_fpl_context()
    completion = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Données FPL:\n{context}\n\nMa question: {question}"}
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
