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

  try {
    // 1. ለ Groq AI ጥያቄውን መላክ
    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + groqApiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "እርስዎ አጋዥ እና ብልህ ረዳት ነዎት። ሁልጊዜ በአማርኛ መልስ ይስጡ።" },
          { role: "user", content: userText }
        ]
      })
    });

    const groqData = await groqResponse.json();
    const aiReply = groqData.choices?.[0]?.message?.content || "ይቅርታ፣ መልስ መስጠት አልቻልኩም።";

    // 2. የ AI መልስ ለተጠቃሚው በ Telegram መላክ
    const telegramUrl = "https://api.telegram.org/bot" + botToken + "/sendMessage";
    await fetch(telegramUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: aiReply
      })
    });

  } catch (error) {
    console.error("Error processing AI response:", error);
  }

  return res.status(200).send("OK");
}
