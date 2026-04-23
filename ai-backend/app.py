from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
from google import genai

load_dotenv()

app = Flask(__name__)
CORS(app)

client = genai.Client(api_key=os.getenv("GEMINI_KEY"))
@app.route("/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json()
        user_message = data.get("message", "")

        if not user_message:
            return jsonify({"reply": "Please ask something."})

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=f"""
You are an AI tutor helping college students understand concepts.

IMPORTANT: Keep your response brief - use ONLY 2-5 lines for your initial answer.
Only provide detailed explanation if the user explicitly asks you to elaborate, elaborate more, explain further, or similar requests.

For initial questions: Provide a concise, direct answer in 2-5 lines.
If user asks for more detail: Then provide comprehensive explanation with examples.

Student question:
{user_message}
"""
        )

        return jsonify({"reply": response.text})

    except Exception as e:
        print(e)
        return jsonify({"reply": "AI server error"})

if __name__ == "__main__":
    app.run(debug=True)