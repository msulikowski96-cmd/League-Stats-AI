import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

async function flashscoreFetch(path: string) {
  const key = process.env["RAPIDAPI_KEY"];

  if (!key) {
    throw new Error("RAPIDAPI_KEY is missing");
  }

  const res = await fetch(`https://flashscore4.p.rapidapi.com/api/flashscore/v2${path}`, {
    headers: {
      "x-rapidapi-host": "flashscore4.p.rapidapi.com",
      "x-rapidapi-key": key,
    },
  });

  if (!res.ok) {
    throw new Error(`Flashscore request failed: ${res.status}`);
  }

  return res.json() as Promise<unknown>;
}

router.get("/ekstraklasa/tournament", async (req, res) => {
  try {
    const tournamentUrl = "/football/poland/ekstraklasa-2025-2026/";
    const ids = await flashscoreFetch(
      `/tournaments/ids?tournament_url=${encodeURIComponent(tournamentUrl)}`,
    ) as {
      tournament_id: string;
      tournament_stage_id: string;
      tournament_template_id: string;
      season_id: string;
      tournament_stages: { tournament_stage_id: string; name: string }[];
    };

    const details = await flashscoreFetch(
      `/tournaments/details?tournament_stage_id=${ids.tournament_stage_id}`,
    );
    const results = await flashscoreFetch(
      `/tournaments/results?tournament_template_id=${ids.tournament_template_id}&season_id=${ids.season_id}&page=1`,
    );
    const fixtures = await flashscoreFetch(
      `/tournaments/fixtures?tournament_template_id=${ids.tournament_template_id}&season_id=${ids.season_id}&page=1`,
    );

    res.json({ ids, details, results, fixtures });
  } catch (err) {
    req.log.error({ err }, "Failed to load tournament data");
    res.status(500).json({ error: "Failed to load tournament data" });
  }
});

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
