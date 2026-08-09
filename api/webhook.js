import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).send("Bot server active!");
  }

  const message = req.body?.message;
  if (!message) {
    return res.status(200).send("OK");
  }

  const chatId = message.chat.id;
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const telegramUrl = "https://api.telegram.org/bot" + botToken + "/sendMessage";

  try {
    await fetch(telegramUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: "ሰላም! ቦቱ በትክክል እየሰራ ነው 🚀"
      })
    });
  } catch (error) {
    console.error("Error sending message:", error);
  }

  return res.status(200).send("OK");
}
