import { useQuery } from "@tanstack/react-query";

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
  isLive: boolean;
}

async function fetchTournamentData(): Promise<TournamentData> {
  const baseUrl = process.env.EXPO_PUBLIC_DOMAIN
    ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
    : "";

  const [standingsRes, detailsRes] = await Promise.allSettled([
    fetch(
      `${baseUrl}/api/ekstraklasa/tournament/standings?tournament_stage_id=${encodeURIComponent(TOURNAMENT_STAGE_ID)}&tournament_id=${encodeURIComponent(TOURNAMENT_ID)}&type=overall`,
    ),
    fetch(
      `${baseUrl}/api/ekstraklasa/tournament/details?tournament_stage_id=${encodeURIComponent(TOURNAMENT_STAGE_ID)}`,
    ),
  ]);

  let standings: FlashscoreTeam[] = [];
  let details: TournamentDetails | null = null;

  if (standingsRes.status === "fulfilled" && standingsRes.value.ok) {
    const raw = (await standingsRes.value.json()) as unknown;
    if (Array.isArray(raw) && raw.length > 0) {
      standings = raw as FlashscoreTeam[];
    }
  }

  if (detailsRes.status === "fulfilled" && detailsRes.value.ok) {
    details = (await detailsRes.value.json()) as TournamentDetails;
  }

  return { standings, details, isLive: standings.length > 0 };
}

export function useTournament() {
  return useQuery({
    queryKey: ["tournament", "ekstraklasa-2025-2026"],
    queryFn: fetchTournamentData,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}
