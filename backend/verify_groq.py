import os
import asyncio
from dotenv import load_dotenv
from groq import Groq

# Load environment variables from .env
load_dotenv()

async def test_groq():
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        print("❌ GROQ_API_KEY not found in environment.")
        return

    client = Groq(api_key=api_key)
    print(f"✅ Client initialized with key: {api_key[:10]}...")

    print("--- Testing Chat Completion (gpt-oss-20b) ---")
    try:
        completion = client.chat.completions.create(
            model="openai/gpt-oss-20b",
            messages=[
                {"role": "system", "content": "Tu es un assistant utile."},
                {"role": "user", "content": "Bonjour, est-ce que tu fonctionnes via le SDK Groq ?"}
            ],
            temperature=1,
            max_completion_tokens=8192,
            top_p=1,
            reasoning_effort="medium",
            stop=None
        )
        print("AI Response:", completion.choices[0].message.content)
        print("✅ Groq SDK integration verified successfully!")
    except Exception as e:
        print(f"❌ Error during API call: {e}")

if __name__ == "__main__":
    asyncio.run(test_groq())
