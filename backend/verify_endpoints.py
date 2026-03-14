import requests
import time

def check_endpoints():
    base_url = "http://127.0.0.1:8000"
    endpoints = [
        "/",
        "/api/teams",
        "/api/players",
        "/api/fixtures",
        "/api/predictions",
        "/api/gameweeks"
    ]
    
    print("En attente du démarrage du serveur de l'API...")
    # Polling wait for server to start
    for _ in range(30):
        try:
            requests.get(base_url)
            break
        except requests.exceptions.ConnectionError:
            time.sleep(1)
    else:
        print("Erreur: Le serveur n'a pas demarré à temps.")
        return

    print("Verification des endpoints de StatFantasy :")
    for ep in endpoints:
        url = base_url + ep
        try:
            resp = requests.get(url)
            if resp.status_code == 200:
                data_len = len(resp.json()) if isinstance(resp.json(), list) else 1
                if isinstance(resp.json(), dict) and "message" in resp.json():
                    print(f"✅ [200 OK] {ep:<20} - Msg: {resp.json().get('message')}")
                else:
                    print(f"✅ [200 OK] {ep:<20} - {data_len} records fournis.")
            else:
                print(f"❌ [{resp.status_code}] {ep:<20} - {resp.text}")
        except Exception as e:
            print(f"💥 Erreur inattendue sur {ep}: {e}")

if __name__ == "__main__":
    check_endpoints()
