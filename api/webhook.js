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
  const groqApiKey = process.env.GROQ_API_KEY;

  if (!groqApiKey || !botToken) {
    return res.status(200).send("API keys missing");
  }

  let userText = "";

  try {
    // 1. ተጠቃሚው የጽሁፍ መልእክት ከላከ
    if (message.text) {
      userText = message.text;
    } 
    // 2. ተጠቃሚው የድምፅ መልእክት (Voice Note) ከላከ
    else if (message.voice) {
      const fileId = message.voice.file_id;
      
      // የፋይሉን ትክክለኛ ማከማቻ ዱካ (Path) ከቴሌግራም እንጠይቃለን
      const fileRes = await fetch(https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId});
      const fileData = await fileRes.json();
      
      if (!fileData.ok) {
        throw new Error("የድምፅ ፋይሉን ማግኘት አልተቻለም።");
      }

      const filePath = fileData.result.file_path;
      const downloadUrl = https://api.telegram.org/file/bot${botToken}/${filePath};

      // የድምፅ ፋይሉን እናወርዳለን
      const audioRes = await fetch(downloadUrl);
      const audioBuffer = await audioRes.buffer();

      // FormData በመጠቀም ፋይሉን ወደ Groq Whisper API እንልካለን
      const FormData = (await import("form-data")).default;
      const formData = new FormData();
      formData.append("file", audioBuffer, { filename: "voice.ogg", contentType: "audio/ogg" });
      formData.append("model", "whisper-large-v3");

      const whisperRes = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          "Authorization": Bearer ${groqApiKey},
          ...formData.getHeaders()
        },
        body: formData
      });

      const whisperData = await whisperRes.json();
      if (whisperData.error) {
        throw new Error(whisperData.error.message || "Whisper transcription error");
      }

      userText = whisperData.text;
      
      // ተጠቃሚው ምን እንደተናገረ እንዲያውቅ በጽሁፍ እናሳየዋለን
      await fetch(https://api.telegram.org/bot${botToken}/sendMessage, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: 🎤 የሰማሁት: "${userText}" })
      });
    }

    if (!userText) {
      return res.status(200).send("OK");
    }

    // 3. ጽሁፉን ለ Llama 3.3 AI በመስጠት መልስ እናስወጣለን
    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": Bearer ${groqApiKey},
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { 
            role: "system", 
            content: "You are a helpful AI assistant. Always match the user's language (English or Amharic). Provide clear, accurate, and concise answers." 
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

    // 4. የ AI መልስ ለተጠቃሚው በቴሌግራም እንልካለን
    await fetch(https://api.telegram.org/bot${botToken}/sendMessage, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: aiReply
      })
    });

  } catch (error) {
    await fetch(https://api.telegram.org/bot${botToken}/sendMessage, {
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
