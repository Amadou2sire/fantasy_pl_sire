import asyncio
import httpx
from fpl_client import get_players_with_history

async def test():
    players = await get_players_with_history()
    for p in players[:3]:
        print(f"Player: {p['web_name']}, PPM: {p.get('points_per_game')}")

if __name__ == "__main__":
    asyncio.run(test())
