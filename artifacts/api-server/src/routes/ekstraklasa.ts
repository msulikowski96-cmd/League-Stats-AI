import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

const fallbackTable = [
  { position: 1, name: "Jagiellonia Białystok", shortName: "JAG", points: 70, played: 34, won: 21, drawn: 7, lost: 6, goalsFor: 68, goalsAgainst: 35, goalDifference: 33, form: ["W", "W", "D", "W", "W"], badge: "🦅" },
  { position: 2, name: "Lech Poznań", shortName: "LEP", points: 66, played: 34, won: 20, drawn: 6, lost: 8, goalsFor: 63, goalsAgainst: 40, goalDifference: 23, form: ["W", "L", "W", "W", "D"], badge: "⚽" },
  { position: 3, name: "Legia Warszawa", shortName: "LEG", points: 63, played: 34, won: 18, drawn: 9, lost: 7, goalsFor: 57, goalsAgainst: 38, goalDifference: 19, form: ["D", "W", "W", "D", "W"], badge: "⚔️" },
  { position: 4, name: "Raków Częstochowa", shortName: "RAK", points: 59, played: 34, won: 17, drawn: 8, lost: 9, goalsFor: 55, goalsAgainst: 42, goalDifference: 13, form: ["W", "W", "L", "D", "W"], badge: "🏰" },
  { position: 5, name: "Cracovia", shortName: "CRA", points: 55, played: 34, won: 16, drawn: 7, lost: 11, goalsFor: 48, goalsAgainst: 44, goalDifference: 4, form: ["L", "W", "W", "L", "W"], badge: "🔴" },
  { position: 6, name: "Pogoń Szczecin", shortName: "POG", points: 52, played: 34, won: 14, drawn: 10, lost: 10, goalsFor: 52, goalsAgainst: 45, goalDifference: 7, form: ["D", "D", "W", "W", "L"], badge: "🦁" },
  { position: 7, name: "Zagłębie Lubin", shortName: "ZAG", points: 48, played: 34, won: 13, drawn: 9, lost: 12, goalsFor: 44, goalsAgainst: 46, goalDifference: -2, form: ["W", "D", "L", "W", "D"], badge: "⛏️" },
  { position: 8, name: "Śląsk Wrocław", shortName: "SLA", points: 46, played: 34, won: 12, drawn: 10, lost: 12, goalsFor: 42, goalsAgainst: 47, goalDifference: -5, form: ["D", "L", "D", "W", "W"], badge: "🦅" },
  { position: 9, name: "Górnik Zabrze", shortName: "GOR", points: 44, played: 34, won: 11, drawn: 11, lost: 12, goalsFor: 40, goalsAgainst: 44, goalDifference: -4, form: ["L", "W", "D", "D", "W"], badge: "⛏️" },
  { position: 10, name: "Wisła Kraków", shortName: "WIS", points: 42, played: 34, won: 11, drawn: 9, lost: 14, goalsFor: 38, goalsAgainst: 50, goalDifference: -12, form: ["W", "L", "L", "W", "D"], badge: "⚪" },
  { position: 11, name: "Warta Poznań", shortName: "WAR", points: 40, played: 34, won: 10, drawn: 10, lost: 14, goalsFor: 39, goalsAgainst: 52, goalDifference: -13, form: ["D", "L", "W", "D", "L"], badge: "🟢" },
  { position: 12, name: "Widzew Łódź", shortName: "WID", points: 38, played: 34, won: 10, drawn: 8, lost: 16, goalsFor: 37, goalsAgainst: 55, goalDifference: -18, form: ["L", "W", "D", "L", "W"], badge: "🔴" },
  { position: 13, name: "Piast Gliwice", shortName: "PIA", points: 36, played: 34, won: 9, drawn: 9, lost: 16, goalsFor: 35, goalsAgainst: 54, goalDifference: -19, form: ["L", "D", "L", "W", "D"], badge: "🏰" },
  { position: 14, name: "Korona Kielce", shortName: "KOR", points: 33, played: 34, won: 8, drawn: 9, lost: 17, goalsFor: 32, goalsAgainst: 57, goalDifference: -25, form: ["L", "L", "D", "W", "L"], badge: "👑" },
  { position: 15, name: "Stal Mielec", shortName: "STA", points: 29, played: 34, won: 7, drawn: 8, lost: 19, goalsFor: 28, goalsAgainst: 60, goalDifference: -32, form: ["L", "D", "L", "L", "D"], badge: "⚙️" },
  { position: 16, name: "Lechia Gdańsk", shortName: "LEH", points: 22, played: 34, won: 5, drawn: 7, lost: 22, goalsFor: 24, goalsAgainst: 73, goalDifference: -49, form: ["L", "L", "L", "D", "L"], badge: "🌊" },
  { position: 17, name: "Zagłębie Sosnowiec", shortName: "ZAS", points: 19, played: 34, won: 4, drawn: 7, lost: 23, goalsFor: 21, goalsAgainst: 78, goalDifference: -57, form: ["L", "L", "D", "L", "L"], badge: "⛏️" },
  { position: 18, name: "Ruch Chorzów", shortName: "RUC", points: 14, played: 34, won: 3, drawn: 5, lost: 26, goalsFor: 18, goalsAgainst: 82, goalDifference: -64, form: ["L", "L", "L", "D", "L"], badge: "🔵" },
];

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

    res.json({ ids, details, results, fixtures, fallbackTable });
  } catch (err) {
    req.log.error({ err }, "Failed to load tournament data");
    res.json({
      ids: null,
      details: null,
      results: { table: fallbackTable },
      fixtures: [],
      fallbackTable,
    });
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
