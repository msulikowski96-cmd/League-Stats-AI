import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

router.post("/ekstraklasa/analyze", async (req, res) => {
  try {
    const { prompt, context } = req.body as { prompt: string; context: string };

    if (!prompt || !context) {
      res.status(400).json({ error: "prompt and context are required" });
      return;
    }

    const systemPrompt = `You are an expert football analyst specializing in Polish Ekstraklasa league. 
You analyze league tables, team performance, trends, and make insightful predictions.
Always respond in the same language as the user's question (Polish or English).
Be concise but insightful — around 3-5 sentences. Focus on key patterns, strengths, weaknesses, and notable trends.`;

    const response = await openai.chat.completions.create({
      model: "gpt-5.1",
      max_completion_tokens: 512,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Table/Team data:\n${context}\n\nUser question: ${prompt}`,
        },
      ],
    });

    const analysis = response.choices[0]?.message?.content ?? "No analysis available.";
    res.json({ analysis });
  } catch (err) {
    req.log.error({ err }, "Error analyzing with AI");
    res.status(500).json({ error: "Failed to analyze" });
  }
});

export default router;
