import urllib.request
import json

req = urllib.request.Request(
    'http://localhost:8000/api/ai/advice', 
    data=json.dumps({'question': 'test'}).encode('utf-8'), 
    headers={'Content-Type': 'application/json'}
)

try:
    res = urllib.request.urlopen(req)
    print("OK:", res.read().decode())
except Exception as e:
    print("ERROR:", e)
    if hasattr(e, 'read'):
        print("DETAIL:", e.read().decode())
