import json
import os
import sys

TEAM_DIR = ".antigravity/team"

def init_team():
    """Initialise l’infrastructure de l’équipe."""
    os.makedirs(f"{TEAM_DIR}/mailbox", exist_ok=True)
    os.makedirs(f"{TEAM_DIR}/locks", exist_ok=True)
    tasks_path = f"{TEAM_DIR}/tasks.json"
    if not os.path.exists(tasks_path):
        with open(tasks_path, 'w') as f:
            json.dump({"tasks": [], "members": []}, f, indent=2)
    if not os.path.exists(f"{TEAM_DIR}/broadcast.msg"):
        with open(f"{TEAM_DIR}/broadcast.msg", 'w') as f: 
            f.write("")
    print("✓ Infrastructure 'Équipe JarvisBot' prête.")

def assign_task(title, assigned_to, deps=[]):
    """Assigne une nouvelle tâche avec support des dépendances."""
    path = f"{TEAM_DIR}/tasks.json"
    # Ensure file exists and is not empty before reading
    if not os.path.exists(path) or os.path.getsize(path) == 0:
        with open(path, 'w') as f:
            json.dump({"tasks": [], "members": []}, f, indent=2)
            
    with open(path, 'r+') as f:
        data = json.load(f)
        task = {
            "id": len(data["tasks"]) + 1,
            "title": title,
            "status": "PENDING",
            "plan_approved": False,
            "assigned_to": assigned_to,
            "dependencies": deps
        }
        data["tasks"].append(task)
        f.seek(0)
        f.truncate() # Clear existing content
        json.dump(data, f, indent=2)
    print(f"✓ Tâche {task['id']} ({title}) assignée à {assigned_to}.")

def broadcast(sender, text):
    """Envoie un message à tous les membres de l’équipe."""
    msg = {"de": sender, "tipo": "BROADCAST", "mensaje": text}
    with open(f"{TEAM_DIR}/broadcast.msg", 'a') as f:
        f.write(json.dumps(msg) + "\n")
    print(f"✓ Message global envoyé par {sender}.")

def send_message(sender, receiver, text):
    """Envoie un message à la boîte d’un agent spécifique."""
    msg = {"de": sender, "mensaje": text}
    with open(f"{TEAM_DIR}/mailbox/{receiver}.msg", 'a', encoding='utf-8') as f:
        f.write(json.dumps(msg, ensure_ascii=False) + "\n")
    print(f"✓ Message envoyé à {receiver}.")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        cmd = sys.argv[1]
        if cmd == "init":
            init_team()
        elif cmd == "assign" and len(sys.argv) > 3:
            title = sys.argv[2]
            assigned_to = sys.argv[3]
            deps = sys.argv[4].split(",") if len(sys.argv) > 4 else []
            assign_task(title, assigned_to, deps)
        elif cmd == "broadcast" and len(sys.argv) > 3:
            sender = sys.argv[2]
            text = sys.argv[3]
            broadcast(sender, text)
        elif cmd == "send" and len(sys.argv) > 4:
            sender = sys.argv[2]
            receiver = sys.argv[3]
            text = sys.argv[4]
            send_message(sender, receiver, text)
