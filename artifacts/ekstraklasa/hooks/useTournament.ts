import { useQuery } from "@tanstack/react-query";

import type { TournamentDetails, TournamentIds } from "@/components/tableTypes";

async function fetchTournament() {
  const baseUrl = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";

  const idsRes = await fetch(
    `${baseUrl}/api/ekstraklasa/tournament/ids?tournament_url=${encodeURIComponent("/football/poland/ekstraklasa-2025-2026/")}`,
  );
  if (!idsRes.ok) {
    throw new Error("Failed to load tournament ids");
  }
  const ids = (await idsRes.json()) as TournamentIds;

  const standingsRes = await fetch(
    `${baseUrl}/api/ekstraklasa/tournament/standings?tournament_stage_id=${encodeURIComponent(ids.tournament_stage_id)}&tournament_id=${encodeURIComponent(ids.tournament_id)}&type=overall`,
  );
  if (!standingsRes.ok) {
    throw new Error("Failed to load standings");
  }
  const standings = (await standingsRes.json()) as unknown;

  const detailsRes = await fetch(
    `${baseUrl}/api/ekstraklasa/tournament/ids?tournament_url=${encodeURIComponent("/football/poland/ekstraklasa-2025-2026/")}`,
  );
  const details = (await detailsRes.json()) as TournamentIds;

  return {
    ids,
    details: details as unknown as TournamentDetails,
    standings,
  };
}

export function useTournament() {
  return useQuery({
    queryKey: ["tournament", "ekstraklasa-2025-2026"],
    queryFn: fetchTournament,
  });
}
