import OpenAI from "openai";


console.log("OPENAI_API_KEY:", process.env.OPENAI_API_KEY);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const sendMessageToGPT = async (req, res) => {
  const { message, userId } = req.body;

  if (!message) return res.status(400).json({ error: "Message is required" });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: message }],
    });

    const gptResponse = completion.choices[0].message.content;
    res.json({ reply: gptResponse }); // reply로 응답
  } catch (error) {
    console.error("GPT 호출 실패:", error);
    res.status(500).json({ error: "GPT 호출 실패" });
  }
};