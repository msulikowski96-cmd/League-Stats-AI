import React, { useMemo, useState } from "react";
import { View, FlatList, StyleSheet, Modal, Platform, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { TeamRow } from "@/components/TeamRow";
import { TeamDetail } from "@/components/TeamDetail";
import { TableHeader } from "@/components/TableHeader";
import { Legend } from "@/components/Legend";
import { useTournament } from "@/hooks/useTournament";
import { ekstraklasaTable, type Team } from "@/data/table";

function normalizeTeams(standings: unknown): Team[] {
  if (!standings || typeof standings !== "object") return ekstraklasaTable;
  const data = standings as { table?: unknown[]; standings?: unknown[]; teams?: unknown[] };
  const rows = (data.table ?? data.standings ?? data.teams ?? []) as Array<Record<string, unknown>>;
  if (!rows.length) return ekstraklasaTable;
  return rows
    .map((row, index) => ({
      position: Number(row["position"] ?? index + 1),
      name: String(row["name"] ?? row["team_name"] ?? row["team"] ?? "Unknown"),
      shortName: String(row["shortName"] ?? row["short_name"] ?? row["abbreviation"] ?? ""),
      played: Number(row["played"] ?? row["games_played"] ?? 0),
      won: Number(row["won"] ?? row["wins"] ?? 0),
      drawn: Number(row["drawn"] ?? row["draws"] ?? 0),
      lost: Number(row["lost"] ?? row["losses"] ?? 0),
      goalsFor: Number(row["goalsFor"] ?? row["goals_for"] ?? 0),
      goalsAgainst: Number(row["goalsAgainst"] ?? row["goals_against"] ?? 0),
      goalDifference: Number(row["goalDifference"] ?? row["goal_difference"] ?? 0),
      points: Number(row["points"] ?? 0),
      form: Array.isArray(row["form"]) ? (row["form"] as Team["form"]) : ["W", "D", "L", "W", "D"],
      badge: String(row["badge"] ?? row["icon"] ?? "⚽"),
    }))
    .filter((team) => team.name !== "Unknown")
    .sort((a, b) => a.position - b.position);
}

export default function TableScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const { data, isLoading, error, refetch } = useTournament();

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const teams = useMemo(() => normalizeTeams((data as { standings?: unknown } | undefined)?.standings), [data]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border, paddingTop: topPadding + 12 }]}> 
        <View style={styles.headerLeft}>
          <Text style={[styles.league, { color: colors.primary }]}>Ekstraklasa</Text>
          <Text style={[styles.season, { color: colors.mutedForeground }]}>{data ? "Live standings" : "2025/26 Season"}</Text>
        </View>
        <View style={[styles.liveBadge, { backgroundColor: colors.accent }]}>
          <View style={[styles.liveDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.liveText, { color: colors.primary }]}>{data ? "LIVE" : "FALLBACK"}</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.mutedForeground, marginTop: 12 }}>Loading tournament data...</Text>
        </View>
      ) : error ? (
        <View style={styles.loadingWrap}>
          <Feather name="alert-triangle" size={28} color={colors.destructive} />
          <Text style={{ color: colors.foreground, marginTop: 12 }}>Failed to load tournament data</Text>
          <TouchableOpacity onPress={() => refetch()} style={[styles.retryBtn, { backgroundColor: colors.primary }]}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={teams}
          keyExtractor={(item, index) => `${item.position}-${index}`}
          ListHeaderComponent={<TableHeader />}
          ListFooterComponent={
            <>
              <Legend />
              <View style={{ height: Platform.OS === "web" ? 34 : insets.bottom + 20 }} />
            </>
          }
          renderItem={({ item }) => (
            <TeamRow
              team={item}
              onPress={(team) => setSelectedTeam(team)}
              isSelected={selectedTeam?.position === item.position}
            />
          )}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal visible={selectedTeam !== null} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelectedTeam(null)}>
        {selectedTeam && <TeamDetail team={selectedTeam} onClose={() => setSelectedTeam(null)} />}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {},
  league: { fontSize: 24, fontWeight: "800", letterSpacing: -0.5 },
  season: { fontSize: 13, marginTop: 2 },
  liveBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  liveText: { fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  retryBtn: { marginTop: 12, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  retryText: { color: "#fff", fontWeight: "700" },
});
