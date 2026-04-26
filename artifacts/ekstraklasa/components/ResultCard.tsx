import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { useColors } from "@/hooks/useColors";
import type { FlashscoreResult } from "@/hooks/useTournament";

interface ResultCardProps {
  result: FlashscoreResult;
}

function formatDate(timestamp: number): string {
  const d = new Date(timestamp * 1000);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function ResultCard({ result }: ResultCardProps) {
  const colors = useColors();
  const homeWon = result.scores.home > result.scores.away;
  const awayWon = result.scores.away > result.scores.home;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.date, { color: colors.mutedForeground }]}>
        {formatDate(result.timestamp)}
      </Text>

      <View style={styles.row}>
        <View style={styles.teamSide}>
          {result.home_team.small_image_path ? (
            <Image source={{ uri: result.home_team.small_image_path }} style={styles.crest} resizeMode="contain" />
          ) : null}
          <Text
            style={[styles.teamName, { color: homeWon ? colors.foreground : colors.mutedForeground, fontWeight: homeWon ? "700" : "500" }]}
            numberOfLines={1}
          >
            {result.home_team.name}
          </Text>
        </View>

        <View style={[styles.scorePill, { backgroundColor: colors.accent }]}>
          <Text style={[styles.score, { color: homeWon ? colors.primary : colors.foreground }]}>
            {result.scores.home}
          </Text>
          <Text style={[styles.scoreSep, { color: colors.mutedForeground }]}>–</Text>
          <Text style={[styles.score, { color: awayWon ? colors.primary : colors.foreground }]}>
            {result.scores.away}
          </Text>
        </View>

        <View style={styles.teamSideAway}>
          {result.away_team.small_image_path ? (
            <Image source={{ uri: result.away_team.small_image_path }} style={styles.crest} resizeMode="contain" />
          ) : null}
          <Text
            style={[styles.teamName, { color: awayWon ? colors.foreground : colors.mutedForeground, fontWeight: awayWon ? "700" : "500" }]}
            numberOfLines={1}
          >
            {result.away_team.name}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 220,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginRight: 10,
  },
  date: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 8,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
  },
  teamSide: {
    flex: 1,
    alignItems: "flex-start",
    gap: 4,
  },
  teamSideAway: {
    flex: 1,
    alignItems: "flex-end",
    gap: 4,
  },
  crest: {
    width: 28,
    height: 28,
  },
  teamName: {
    fontSize: 11,
    textAlign: "left",
  },
  scorePill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 3,
  },
  score: {
    fontSize: 16,
    fontWeight: "800",
    minWidth: 14,
    textAlign: "center",
  },
  scoreSep: {
    fontSize: 13,
    fontWeight: "400",
  },
});
