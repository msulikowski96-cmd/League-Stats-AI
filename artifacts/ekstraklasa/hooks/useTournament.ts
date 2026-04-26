import { useQuery } from "@tanstack/react-query";

import type { TournamentDetails, TournamentIds } from "@/components/tableTypes";

async function fetchTournament() {
  const baseUrl = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";
  const res = await fetch(`${baseUrl}/api/ekstraklasa/tournament`);
  if (!res.ok) {
    throw new Error("Failed to load tournament");
  }
  return (await res.json()) as {
    ids: TournamentIds;
    details: TournamentDetails;
    results: unknown;
    fixtures: unknown;
  };
}

export function useTournament() {
  return useQuery({
    queryKey: ["tournament", "ekstraklasa-2025-2026"],
    queryFn: fetchTournament,
  });
}
