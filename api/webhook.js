[8/9/2026 9:28 AM] 𝖑𝖎𝖑𝖕𝖗𝖎𝖓𝖈𝖊24: {
  "name": "mezgeb-voice-bot",
  "version": "1.0.0",
  "main": "api/webhook.js",
  "type": "module",
  "dependencies": {
    "@google/genai": "^0.1.1",
    "groq-sdk": "^1.4.0",
    "node-fetch": "^3.3.2"
  }
}
[8/9/2026 9:30 AM] 𝖑𝖎𝖑𝖕𝖗𝖎𝖓𝖈𝖊24: import Groq from "groq-sdk";
import { GoogleGenAI } from "@google/genai";
import fetch from "node-fetch";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(200).send("Bot server active!");

  const message = req.body?.message;
  if (!message) return res.status(200).send("OK");

  const chatId = message.chat.id;
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  const sendMessage = async (text) => {
    await fetch(https://api.telegram.org/bot${botToken}/sendMessage, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
    });
  };

  try {
    const audio = message.voice || message.audio;
    if (!audio) {
      await sendMessage("👋 Send me a voice note or audio file, and I'll generate study notes for you!");
      return res.status(200).send("OK");
    }

    await sendMessage("⏳ *Processing your audio recording...*");

    // 1. Get file path from Telegram
    const fileRes = await fetch(https://api.telegram.org/bot${botToken}/getFile?file_id=${audio.file_id});
    const fileData = await fileRes.json();
    const fileUrl = https://api.telegram.org/file/bot${botToken}/${fileData.result.file_path};

    // 2. Transcribe using Groq Whisper
    const audioResponse = await fetch(fileUrl);
    const audioBlob = await audioResponse.blob();

    const transcription = await groq.audio.transcriptions.create({
      file: audioBlob,
      model: "whisper-large-v3",
    });

    // 3. Summarize with Groq (Fallback to Gemini)
    const prompt = Convert this lecture transcription into clean study notes with:
- 📌 Executive Summary (3 key points)
- 💡 Core Concepts & Definitions
- ❓ 3 Exam Practice Questions

Transcript:
${transcription.text};

    let summaryText = "";
    try {
      const groqRes = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
      });
      summaryText = groqRes.choices[0].message.content;
    } catch (err) {
      const geminiRes = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
      summaryText = geminiRes.text;
    }

    await sendMessage(📝 *Your Lecture Notes:*\n\n${summaryText});

  } catch (error) {
    console.error(error);
    await sendMessage("❌ Sorry, something went wrong processing your audio.");
  }

  return res.status(200).send("OK");
}
