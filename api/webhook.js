import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).send("Bot server active!");
  }

  const message = req.body?.message;
  if (!message || !message.text) {
    return res.status(200).send("OK");
  }

  const chatId = message.chat.id;
  const userText = message.text;
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const groqApiKey = process.env.GROQ_API_KEY;

  if (!groqApiKey) {
    await fetch("https://api.telegram.org/bot" + botToken + "/sendMessage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: "ስህተት: GROQ_API_KEY Vercel ላይ አልተገኘም!" })
    });
    return res.status(200).send("OK");
  }

  try {
    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + groqApiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { 
            role: "system", 
            content: "You are a native Amharic speaker and an expert AI assistant. Always reply in the exact language the user uses. When answering in Amharic: 1) Speak naturally and fluidly like a real Ethiopian person, NOT like a literal machine translation. 2) Use warm, friendly, and culturally idiomatic Amharic. 3) Avoid awkward phrase structures and word-for-word translation from English." 
          },
          { role: "user", content: userText }
        ]
      })
    });

    const groqData = await groqResponse.json();

    if (groqData.error) {
      throw new Error(groqData.error.message || "Groq API error");
    }

    const aiReply = groqData.choices?.[0]?.message?.content || "መልስ ማግኘት አልተቻለም።";

    await fetch("https://api.telegram.org/bot" + botToken + "/sendMessage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: aiReply
      })
    });

  } catch (error) {
    await fetch("https://api.telegram.org/bot" + botToken + "/sendMessage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: "ስህተት አጋጥሟል፦ " + error.message
      })
    });
  }

  return res.status(200).send("OK");
}
