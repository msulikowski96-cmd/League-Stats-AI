import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

const fallbackTable = [
  { team_id: "f1", team_url: "/team/lech-poznan/f1/", name: "Lech Poznan", matches_played: 30, wins: 14, draws: 10, losses: 6, goals: "55:41", goal_difference: 14, points: 52 },
  { team_id: "f2", team_url: "/team/gornik-zabrze/f2/", name: "Gornik Zabrze", matches_played: 30, wins: 14, draws: 7, losses: 9, goals: "43:34", goal_difference: 9, points: 49 },
  { team_id: "f3", team_url: "/team/jagiellonia/f3/", name: "Jagiellonia", matches_played: 30, wins: 12, draws: 10, losses: 8, goals: "48:37", goal_difference: 11, points: 46 },
  { team_id: "f4", team_url: "/team/rakow-czestochowa/f4/", name: "Rakow", matches_played: 30, wins: 13, draws: 7, losses: 10, goals: "43:37", goal_difference: 6, points: 46 },
  { team_id: "f5", team_url: "/team/wisla-plock/f5/", name: "Wisla Plock", matches_played: 30, wins: 12, draws: 9, losses: 9, goals: "32:28", goal_difference: 4, points: 45 },
  { team_id: "f6", team_url: "/team/gks-katowice/f6/", name: "GKS Katowice", matches_played: 30, wins: 13, draws: 5, losses: 12, goals: "43:41", goal_difference: 2, points: 44 },
  { team_id: "f7", team_url: "/team/zaglebie/f7/", name: "Zaglebie", matches_played: 30, wins: 12, draws: 8, losses: 10, goals: "43:36", goal_difference: 7, points: 44 },
  { team_id: "f8", team_url: "/team/radomiak-radom/f8/", name: "Radomiak Radom", matches_played: 30, wins: 10, draws: 10, losses: 10, goals: "46:43", goal_difference: 3, points: 40 },
  { team_id: "f9", team_url: "/team/motor-lublin/f9/", name: "Motor Lublin", matches_played: 30, wins: 9, draws: 12, losses: 9, goals: "39:45", goal_difference: -6, points: 39 },
  { team_id: "f10", team_url: "/team/lechia-gdansk/f10/", name: "Lechia Gdansk", matches_played: 30, wins: 12, draws: 7, losses: 11, goals: "57:54", goal_difference: 3, points: 38 },
  { team_id: "f11", team_url: "/team/korona-kielce/f11/", name: "Korona Kielce", matches_played: 30, wins: 10, draws: 8, losses: 12, goals: "37:36", goal_difference: 1, points: 38 },
  { team_id: "f12", team_url: "/team/cracovia/f12/", name: "Cracovia", matches_played: 30, wins: 9, draws: 11, losses: 10, goals: "35:38", goal_difference: -3, points: 38 },
  { team_id: "f13", team_url: "/team/pogon-szczecin/f13/", name: "Pogon Szczecin", matches_played: 30, wins: 11, draws: 5, losses: 14, goals: "40:45", goal_difference: -5, points: 38 },
  { team_id: "f14", team_url: "/team/legia/f14/", name: "Legia", matches_played: 30, wins: 8, draws: 13, losses: 9, goals: "34:36", goal_difference: -2, points: 37 },
  { team_id: "f15", team_url: "/team/widzew-lodz/f15/", name: "Widzew Lodz", matches_played: 30, wins: 10, draws: 6, losses: 14, goals: "36:37", goal_difference: -1, points: 36 },
  { team_id: "f16", team_url: "/team/piast-gliwice/f16/", name: "Piast Gliwice", matches_played: 29, wins: 10, draws: 6, losses: 13, goals: "35:39", goal_difference: -4, points: 36 },
  { team_id: "f17", team_url: "/team/arka-gdynia/f17/", name: "Arka Gdynia", matches_played: 29, wins: 9, draws: 7, losses: 13, goals: "30:50", goal_difference: -20, points: 34 },
  { team_id: "f18", team_url: "/team/termalica-bruk-bet/f18/", name: "Termalica B-B.", matches_played: 30, wins: 7, draws: 7, losses: 16, goals: "36:55", goal_difference: -19, points: 28 },
];

const cache = new Map<string, { data: unknown; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function flashscoreFetch(path: string) {
  const cached = cache.get(path);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const key = process.env["RAPIDAPI_KEY"];
  if (!key) throw new Error("RAPIDAPI_KEY is missing");

  const res = await fetch(`https://flashscore4.p.rapidapi.com/api/flashscore/v2${path}`, {
    headers: {
      "x-rapidapi-host": "flashscore4.p.rapidapi.com",
      "x-rapidapi-key": key,
    },
  });

  if (!res.ok) throw new Error(`Flashscore request failed: ${res.status}`);

  const data = await res.json() as unknown;
  cache.set(path, { data, expiresAt: Date.now() + CACHE_TTL_MS });
  return data;
}

const ALL_CACHE_KEY = "ekstraklasa-all";
let allFetchInProgress: Promise<unknown> | null = null;

async function fetchAll() {
  const cached = cache.get(ALL_CACHE_KEY);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  if (allFetchInProgress) return allFetchInProgress;

  allFetchInProgress = (async () => {
    let standings: unknown = fallbackTable;
    let details: unknown = null;
    let results: unknown = [];

    try {
      standings = await flashscoreFetch(
        `/tournaments/standings?tournament_stage_id=rgKvyuf4&tournament_id=AgtpmqHN&type=overall`,
      );
    } catch { /* use fallback */ }

    await delay(1100);

    try {
      details = await flashscoreFetch(`/tournaments/details?tournament_stage_id=rgKvyuf4`);
    } catch { /* details optional */ }

    await delay(1100);

    try {
      results = await flashscoreFetch(
        `/tournaments/results?tournament_template_id=lrMHUHDc&season_id=187&page=1`,
      );
    } catch { /* results optional */ }

    const payload = { standings, details, results };
    cache.set(ALL_CACHE_KEY, { data: payload, expiresAt: Date.now() + CACHE_TTL_MS });
    allFetchInProgress = null;
    return payload;
  })();

  return allFetchInProgress;
}

router.get("/ekstraklasa/all", async (req, res) => {
  try {
    const data = await fetchAll();
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to load all tournament data");
    res.json({ standings: fallbackTable, details: null, results: [] });
  }
});

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

router.get("/ekstraklasa/tournament/ids", async (req, res) => {
  try {
    const tournamentUrl = String(req.query["tournament_url"] ?? "/football/poland/ekstraklasa-2025-2026/");

    const ids = await flashscoreFetch(
      `/tournaments/ids?tournament_url=${encodeURIComponent(tournamentUrl)}`,
    );

    res.json(ids);
  } catch (err) {
    req.log.error({ err }, "Failed to load tournament ids");
    res.status(500).json({ error: "Failed to load tournament ids" });
  }
});

router.get("/ekstraklasa/tournament/details", async (req, res) => {
  try {
    const tournamentStageId = String(req.query["tournament_stage_id"] ?? "rgKvyuf4");
    const data = await flashscoreFetch(
      `/tournaments/details?tournament_stage_id=${encodeURIComponent(tournamentStageId)}`,
    );
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to load tournament details");
    res.status(500).json({ error: "Failed to load tournament details" });
  }
});

router.get("/ekstraklasa/tournament/standings", async (req, res) => {
  try {
    const tournamentStageId = String(req.query["tournament_stage_id"] ?? "rgKvyuf4");
    const tournamentId = String(req.query["tournament_id"] ?? "AgtpmqHN");
    const type = String(req.query["type"] ?? "overall");

    const data = await flashscoreFetch(
      `/tournaments/standings?tournament_stage_id=${encodeURIComponent(tournamentStageId)}&tournament_id=${encodeURIComponent(tournamentId)}&type=${encodeURIComponent(type)}`,
    );

    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Flashscore standings failed, returning fallback");
    res.json(fallbackTable);
  }
});

router.get("/ekstraklasa/tournament/results", async (req, res) => {
  try {
    const tournamentTemplateId = String(req.query["tournament_template_id"] ?? "lrMHUHDc");
    const seasonId = String(req.query["season_id"] ?? "187");
    const page = String(req.query["page"] ?? "1");

    const data = await flashscoreFetch(
      `/tournaments/results?tournament_template_id=${encodeURIComponent(tournamentTemplateId)}&season_id=${encodeURIComponent(seasonId)}&page=${encodeURIComponent(page)}`,
    );

    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to load tournament results");
    res.status(500).json({ error: "Failed to load tournament results" });
  }
});

router.get("/ekstraklasa/tournament/fixtures", async (req, res) => {
  try {
    const tournamentTemplateId = String(req.query["tournament_template_id"] ?? "lrMHUHDc");
    const seasonId = String(req.query["season_id"] ?? "187");
    const page = String(req.query["page"] ?? "1");

    const data = await flashscoreFetch(
      `/tournaments/fixtures?tournament_template_id=${encodeURIComponent(tournamentTemplateId)}&season_id=${encodeURIComponent(seasonId)}&page=${encodeURIComponent(page)}`,
    );

    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to load tournament fixtures");
    res.status(500).json({ error: "Failed to load tournament fixtures" });
  }
});

router.get("/ekstraklasa/general/tournaments", async (req, res) => {
  try {
    const countryId = String(req.query["country_id"] ?? "");
    const sportId = String(req.query["sport_id"] ?? "");

    if (!countryId || !sportId) {
      res.status(400).json({ error: "country_id and sport_id are required" });
      return;
    }

    const data = await flashscoreFetch(
      `/general/tournaments?country_id=${encodeURIComponent(countryId)}&sport_id=${encodeURIComponent(sportId)}`,
    );

    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to load general tournaments");
    res.status(500).json({ error: "Failed to load general tournaments" });
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
