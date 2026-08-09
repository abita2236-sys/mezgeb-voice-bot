import Groq from "groq-sdk";
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
      body: JSON.stringify({ chat_id: chatId, text }),
    });
  };

  try {
    await sendMessage("ጥያቄዎ እየተሰራ ነው...");
  } catch (error) {
    console.error(error);
  }

  return res.status(200).send("OK");
}

