import React, { useMemo, useState } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Modal,
  Platform,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { TeamRow } from "@/components/TeamRow";
import { TeamDetail } from "@/components/TeamDetail";
import { TableHeader } from "@/components/TableHeader";
import { Legend } from "@/components/Legend";
import { useTournament, type FlashscoreTeam } from "@/hooks/useTournament";
import { ekstraklasaTable, type Team } from "@/data/table";

const BADGE_MAP: Record<string, string> = {
  "lech-poznan": "⚽",
  "gornik-zabrze": "⛏️",
  "jagiellonia": "🦅",
  "rakow-czestochowa": "🏰",
  "wisla-plock": "🚢",
  "gks-katowice": "⚙️",
  "zaglebie": "⛏️",
  "radomiak-radom": "🟢",
  "motor-lublin": "🏎️",
  "lechia-gdansk": "🌊",
  "korona-kielce": "👑",
  "cracovia": "🔴",
  "pogon-szczecin": "🦁",
  "legia": "⚔️",
  "widzew-lodz": "🔴",
  "piast-gliwice": "🏰",
  "arka-gdynia": "⚓",
  "termalica-bruk-bet": "💧",
};

function badgeForUrl(teamUrl: string): string {
  const slug = teamUrl.split("/").filter(Boolean)[1] ?? "";
  for (const [key, badge] of Object.entries(BADGE_MAP)) {
    if (slug.includes(key)) return badge;
  }
  return "⚽";
}

function goalsFor(goalsStr: string): number {
  return parseInt(goalsStr.split(":")[0] ?? "0", 10);
}

function goalsAgainst(goalsStr: string): number {
  return parseInt(goalsStr.split(":")[1] ?? "0", 10);
}

function normalizeTeams(liveData: FlashscoreTeam[] | undefined): { teams: Team[]; isLive: boolean } {
  if (!liveData || liveData.length === 0) {
    return { teams: ekstraklasaTable, isLive: false };
  }

  const teams: Team[] = liveData.map((row, index) => ({
    position: index + 1,
    name: row.name,
    shortName: row.name.substring(0, 3).toUpperCase(),
    played: row.matches_played,
    won: row.wins,
    drawn: row.draws,
    lost: row.losses,
    goalsFor: goalsFor(row.goals),
    goalsAgainst: goalsAgainst(row.goals),
    goalDifference: row.goal_difference,
    points: row.points,
    form: ["W", "D", "L", "W", "W"],
    badge: badgeForUrl(row.team_url),
  }));

  return { teams, isLive: true };
}

export default function TableScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const { data, isLoading, error, refetch } = useTournament();

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const { teams, isLive } = useMemo(() => normalizeTeams(data), [data]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
            paddingTop: topPadding + 12,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <Text style={[styles.league, { color: colors.primary }]}>Ekstraklasa</Text>
          <Text style={[styles.season, { color: colors.mutedForeground }]}>
            {isLive ? "2025/26 – live data" : "2025/26 – fallback data"}
          </Text>
        </View>
        <View style={[styles.liveBadge, { backgroundColor: colors.accent }]}>
          <View
            style={[
              styles.liveDot,
              { backgroundColor: isLive ? colors.primary : colors.mutedForeground },
            ]}
          />
          <Text
            style={[
              styles.liveText,
              { color: isLive ? colors.primary : colors.mutedForeground },
            ]}
          >
            {isLive ? "LIVE" : "OFFLINE"}
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centre}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.mutedForeground, marginTop: 12 }}>
            Loading standings…
          </Text>
        </View>
      ) : error && teams.length === 0 ? (
        <View style={styles.centre}>
          <Feather name="alert-triangle" size={28} color={colors.destructive} />
          <Text style={{ color: colors.foreground, marginTop: 12 }}>
            Could not load standings
          </Text>
          <TouchableOpacity
            onPress={() => refetch()}
            style={[styles.retryBtn, { backgroundColor: colors.primary }]}
          >
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
              <View
                style={{ height: Platform.OS === "web" ? 34 : insets.bottom + 20 }}
              />
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

      <Modal
        visible={selectedTeam !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedTeam(null)}
      >
        {selectedTeam && (
          <TeamDetail team={selectedTeam} onClose={() => setSelectedTeam(null)} />
        )}
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
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  liveText: { fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  centre: { flex: 1, alignItems: "center", justifyContent: "center" },
  retryBtn: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: { color: "#fff", fontWeight: "700" },
});
