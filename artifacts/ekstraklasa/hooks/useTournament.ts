import { useQuery } from "@tanstack/react-query";

const TOURNAMENT_URL = "/football/poland/ekstraklasa-2025-2026/";
const TOURNAMENT_STAGE_ID = "rgKvyuf4";
const TOURNAMENT_ID = "AgtpmqHN";

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

async function fetchStandings(): Promise<FlashscoreTeam[]> {
  const baseUrl = process.env.EXPO_PUBLIC_DOMAIN
    ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
    : "";

  const res = await fetch(
    `${baseUrl}/api/ekstraklasa/tournament/standings?tournament_stage_id=${encodeURIComponent(TOURNAMENT_STAGE_ID)}&tournament_id=${encodeURIComponent(TOURNAMENT_ID)}&type=overall`,
  );

  if (!res.ok) {
    throw new Error(`Standings request failed: ${res.status}`);
  }

  const data = (await res.json()) as unknown;
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("Empty standings returned");
  }

  return data as FlashscoreTeam[];
}

export function useTournament() {
  return useQuery({
    queryKey: ["tournament", "ekstraklasa-standings"],
    queryFn: fetchStandings,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}
