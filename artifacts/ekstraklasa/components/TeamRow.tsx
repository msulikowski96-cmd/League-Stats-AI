import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { useColors } from "@/hooks/useColors";
import type { Team } from "@/data/table";
import { getRowZone } from "@/data/table";

interface TeamRowProps {
  team: Team;
  onPress: (team: Team) => void;
  isSelected: boolean;
}

const FORM_COLORS = {
  W: "#16a34a",
  D: "#f59e0b",
  L: "#ef4444",
};

export function TeamRow({ team, onPress, isSelected }: TeamRowProps) {
  const colors = useColors();
  const zone = getRowZone(team.position);

  const zoneColor = {
    champion: colors.gold,
    title: colors.primary,
    europe: colors.silver,
    mid: "transparent",
    "relegation-playoff": "#f97316",
    relegation: colors.destructive,
  }[zone];

  return (
    <TouchableOpacity
      onPress={() => onPress(team)}
      activeOpacity={0.7}
      style={[
        styles.row,
        {
          backgroundColor: isSelected ? colors.accent : colors.card,
          borderColor: isSelected ? colors.primary : colors.border,
        },
      ]}
    >
      <View style={[styles.zoneBar, { backgroundColor: zoneColor }]} />

      <View style={styles.positionContainer}>
        <Text
          style={[
            styles.position,
            {
              color: team.position <= 4 ? colors.primary : colors.mutedForeground,
              fontWeight: team.position <= 4 ? "700" : "500",
            },
          ]}
        >
          {team.position}
        </Text>
      </View>

      <Text style={styles.badge}>{team.badge}</Text>

      <View style={styles.nameContainer}>
        <Text
          style={[styles.name, { color: colors.foreground }]}
          numberOfLines={1}
        >
          {team.name}
        </Text>
      </View>

      <View style={styles.statsContainer}>
        <Text style={[styles.stat, { color: colors.mutedForeground }]}>
          {team.played}
        </Text>
        <Text style={[styles.stat, { color: "#16a34a" }]}>{team.won}</Text>
        <Text style={[styles.stat, { color: colors.mutedForeground }]}>
          {team.drawn}
        </Text>
        <Text style={[styles.stat, { color: colors.destructive }]}>
          {team.lost}
        </Text>
        <Text style={[styles.stat, { color: colors.mutedForeground }]}>
          {team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}
        </Text>
        <Text
          style={[styles.points, { color: colors.foreground }]}
        >
          {team.points}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 12,
    marginVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 10,
    paddingRight: 12,
    overflow: "hidden",
  },
  zoneBar: {
    width: 4,
    alignSelf: "stretch",
    marginRight: 8,
  },
  positionContainer: {
    width: 24,
    alignItems: "center",
  },
  position: {
    fontSize: 14,
  },
  badge: {
    fontSize: 18,
    marginHorizontal: 8,
  },
  nameContainer: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 13,
    fontWeight: "600",
  },
  statsContainer: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  stat: {
    fontSize: 12,
    width: 22,
    textAlign: "center",
  },
  points: {
    fontSize: 14,
    fontWeight: "700",
    width: 26,
    textAlign: "center",
  },
});
