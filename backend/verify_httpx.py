import os
import asyncio
import httpx
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

async def test_groq_httpx():
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        print("❌ GROQ_API_KEY not found in environment.")
        return

    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "gpt-oss-120b",
        "messages": [
            {"role": "system", "content": "Tu es un assistant utile."},
            {"role": "user", "content": "Bonjour, est-ce que tu fonctionnes via httpx ?"}
        ],
        "max_tokens": 50,
    }

    print(f"✅ Testing Groq API via httpx with key: {api_key[:10]}...")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, json=payload, timeout=30.0)
            response.raise_for_status()
            data = response.json()
            print("AI Response:", data["choices"][0]["message"]["content"])
            print("✅ Groq integration via httpx verified successfully!")
    except Exception as e:
        print(f"❌ Error during API call: {e}")

if __name__ == "__main__":
    asyncio.run(test_groq_httpx())
