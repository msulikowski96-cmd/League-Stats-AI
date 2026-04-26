import { useQuery } from "@tanstack/react-query";

export interface FlashscoreTeam {
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

export interface FlashscoreFormEntry {
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

export interface FlashscoreMatchTeam {
  team_id: string;
  name: string;
  short_name: string | null;
  small_image_path: string;
}

export interface FlashscoreResult {
  match_id: string;
  timestamp: number;
  home_team: FlashscoreMatchTeam;
  away_team: FlashscoreMatchTeam;
  scores: { home: number; away: number };
}

export interface TournamentDetails {
  tournament_id: string;
  tournament_stage_id: string;
  name: string;
  image_path: string;
  country: {
    name: string;
    image_path: string;
    small_image_path: string;
  };
  start_year: string;
  end_year: string;
  is_current: boolean;
  stage_start_date_timestamp: number;
  stage_end_date_timestamp: number;
  winner: unknown[];
}

export interface TournamentData {
  standings: FlashscoreTeam[];
  details: TournamentDetails | null;
  results: FlashscoreResult[];
  form: FlashscoreFormEntry[];
  isLive: boolean;
}

async function fetchAll(): Promise<TournamentData> {
  const baseUrl = process.env.EXPO_PUBLIC_DOMAIN
    ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
    : "";

  const res = await fetch(`${baseUrl}/api/ekstraklasa/all`);
  if (!res.ok) throw new Error(`/api/ekstraklasa/all failed: ${res.status}`);

  const raw = (await res.json()) as {
    standings: unknown;
    details: unknown;
    results: unknown;
    form: unknown;
  };

  const standings = Array.isArray(raw.standings) ? (raw.standings as FlashscoreTeam[]) : [];
  const details =
    raw.details && typeof raw.details === "object" ? (raw.details as TournamentDetails) : null;
  const results = Array.isArray(raw.results)
    ? (raw.results as FlashscoreResult[]).slice(0, 20)
    : [];
  const form = Array.isArray(raw.form) ? (raw.form as FlashscoreFormEntry[]) : [];

  return { standings, details, results, form, isLive: standings.length > 0 };
}

export function useTournament() {
  return useQuery({
    queryKey: ["tournament", "ekstraklasa-2025-2026"],
    queryFn: fetchAll,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
