import os
import asyncio
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables from .env
load_dotenv()

async def test_aicc():
    api_key = os.environ.get("AICC_API_KEY")
    if not api_key:
        print("❌ AICC_API_KEY not found in environment.")
        return

    client = OpenAI(
        api_key=api_key,
        base_url="https://api.ai.cc/v1"
    )
    print(f"✅ Client initialized with AI.CC base URL and key: {api_key[:10]}...")

    print("--- Testing Chat Completion (gpt-4o) ---")
    try:
        completion = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "Tu es un assistant utile."},
                {"role": "user", "content": "Bonjour, est-ce que tu fonctionnes via AI.CC ?"}
            ],
            temperature=0.7,
            max_tokens=100,
        )
        print("AI Response:", completion.choices[0].message.content)
        print("✅ AI.CC integration verified successfully!")
    except Exception as e:
        print(f"❌ Error during API call: {e}")

if __name__ == "__main__":
    asyncio.run(test_aicc())
