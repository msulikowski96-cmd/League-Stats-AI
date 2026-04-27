import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

interface FlashscoreTeam {
  team_id: string;
  team_url: string;
  name: string;
  matches_played: number;
  wins: number;
  draws: number;
  losses: number;
  goals: string;
  goal_difference: number;
  points: number;
}

interface FlashscoreResult {
  match_id: string;
  timestamp: number;
  home_team: { team_id: string; name: string; short_name: string | null; small_image_path: string };
  away_team: { team_id: string; name: string; short_name: string | null; small_image_path: string };
  scores: { home: number; away: number };
}

interface TournamentDetails {
  tournament_id: string;
  tournament_stage_id: string;
  name: string;
  start_year: string;
  end_year: string;
  is_current: boolean;
  stage_start_date_timestamp: number;
  stage_end_date_timestamp: number;
}

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

  if (
    data !== null &&
    typeof data === "object" &&
    !Array.isArray(data) &&
    "message" in (data as object)
  ) {
    const msg = (data as { message: string }).message;
    throw new Error(`Flashscore API error: ${msg}`);
  }

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
    let form: unknown = [];

    try {
      standings = await flashscoreFetch(
        `/tournaments/standings?tournament_stage_id=rgKvyuf4&tournament_id=AgtpmqHN&type=overall`,
      );
    } catch (e) { console.error("[fetchAll] standings failed:", String(e)); }

    await delay(2500);

    try {
      details = await flashscoreFetch(`/tournaments/details?tournament_stage_id=rgKvyuf4`);
    } catch (e) { console.error("[fetchAll] details failed:", String(e)); }

    await delay(2500);

    try {
      results = await flashscoreFetch(
        `/tournaments/results?tournament_template_id=lrMHUHDc&season_id=187&page=1`,
      );
    } catch (e) { console.error("[fetchAll] results failed:", String(e)); }

    await delay(2500);

    try {
      form = await flashscoreFetch(
        `/tournaments/standings/form?tournament_stage_id=rgKvyuf4&tournament_id=AgtpmqHN&type=overall`,
      );
    } catch (e) { console.error("[fetchAll] form failed:", String(e)); }

    const payload = { standings, details, results, form };
    cache.set(ALL_CACHE_KEY, { data: payload, expiresAt: Date.now() + CACHE_TTL_MS });
    allFetchInProgress = null;
    return payload;
  })();

  return allFetchInProgress;
}

router.get("/ekstraklasa/all", async (req, res) => {
  try {
    if (req.query["refresh"] === "1") {
      cache.delete(ALL_CACHE_KEY);
      allFetchInProgress = null;
    }
    const data = await fetchAll();
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to load all tournament data");
    res.json({ standings: fallbackTable, details: null, results: [], form: [] });
  }
});

router.get("/ekstraklasa/tournament/standings/form", async (req, res) => {
  try {
    const tournamentStageId = String(req.query["tournament_stage_id"] ?? "rgKvyuf4");
    const tournamentId = String(req.query["tournament_id"] ?? "AgtpmqHN");
    const type = String(req.query["type"] ?? "overall");
    const data = await flashscoreFetch(
      `/tournaments/standings/form?tournament_stage_id=${encodeURIComponent(tournamentStageId)}&tournament_id=${encodeURIComponent(tournamentId)}&type=${encodeURIComponent(type)}`,
    );
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to load standings form");
    res.status(500).json({ error: "Failed to load standings form" });
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

function buildLeagueContext(data: {
  standings: unknown;
  details: unknown;
  results: unknown;
  form: unknown;
}): string {
  const lines: string[] = [];

  const standings = Array.isArray(data.standings) ? (data.standings as FlashscoreTeam[]) : [];
  const form = Array.isArray(data.form) ? (data.form as FlashscoreTeam[]) : [];
  const results = Array.isArray(data.results) ? (data.results as FlashscoreResult[]) : [];

  const det = data.details as TournamentDetails | null;
  if (det?.name) {
    lines.push(`Rozgrywki: ${det.name}`);
    if (det.start_year && det.end_year) lines.push(`Sezon: ${det.start_year}/${det.end_year}`);
  } else {
    lines.push("Rozgrywki: Ekstraklasa 2025/2026");
  }
  lines.push("");

  if (standings.length > 0) {
    lines.push("TABELA LIGOWA (Pos | Drużyna | M | W | R | P | Bramki | RB | Pkt):");
    standings.forEach((t, i) => {
      const pos = (i + 1).toString().padStart(2);
      const name = t.name.padEnd(22);
      const m = String(t.matches_played).padStart(2);
      const w = String(t.wins).padStart(2);
      const d = String(t.draws).padStart(2);
      const l = String(t.losses).padStart(2);
      const g = String(t.goals ?? "").padStart(7);
      const gd = (t.goal_difference >= 0 ? "+" : "") + String(t.goal_difference).padStart(3);
      const pts = String(t.points).padStart(3);
      lines.push(`${pos}. ${name} ${m} ${w} ${d} ${l} ${g} ${gd} ${pts}`);
    });
    lines.push("");
  }

  if (form.length > 0) {
    lines.push("FORMA (ostatnie 5 meczów każdej drużyny – W | R | P | Pkt):");
    form.forEach((t) => {
      lines.push(`  ${t.name.padEnd(22)} ${t.wins}W ${t.draws}R ${t.losses}P → ${t.points} pkt`);
    });
    lines.push("");
  }

  if (results.length > 0) {
    lines.push("OSTATNIE WYNIKI:");
    results.slice(0, 12).forEach((r) => {
      const date = new Date((r.timestamp ?? 0) * 1000).toLocaleDateString("pl-PL");
      lines.push(`  ${r.home_team?.name} ${r.scores?.home}:${r.scores?.away} ${r.away_team?.name}  (${date})`);
    });
    lines.push("");
  }

  return lines.join("\n");
}

router.post("/ekstraklasa/analyze", async (req, res) => {
  try {
    const { prompt } = req.body as { prompt: string; context?: string };

    if (!prompt) {
      res.status(400).json({ error: "prompt is required" });
      return;
    }

    const raw = await fetchAll() as { standings: unknown; details: unknown; results: unknown; form: unknown };
    const leagueContext = buildLeagueContext(raw);

    const systemPrompt = `Jesteś ekspertem ds. polskiej Ekstraklasy. Analizujesz tabelę ligową, formę drużyn i wyniki meczów.
Odpowiadaj ZAWSZE w tym samym języku, co pytanie użytkownika (polski lub angielski).
Bądź konkretny i zwięzły (4-6 zdań). Powołuj się na konkretne liczby z tabeli.
NIE zmyślaj danych — opieraj się wyłącznie na dostarczonym kontekście.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      max_completion_tokens: 600,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `AKTUALNE DANE LIGI:\n\n${leagueContext}\n\n---\nPytanie: ${prompt}`,
        },
      ],
    });

    const analysis = response.choices[0]?.message?.content ?? "Brak analizy.";
    res.json({ analysis });
  } catch (err) {
    req.log.error({ err }, "Error analyzing with AI");
    res.status(500).json({ error: "Failed to analyze" });
  }
});

export default router;
