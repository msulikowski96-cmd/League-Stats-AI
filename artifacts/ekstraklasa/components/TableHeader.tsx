import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";

export function TableHeader() {
  const colors = useColors();
  return (
    <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
      <View style={styles.zoneBar} />
      <View style={styles.positionContainer}>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>#</Text>
      </View>
      <View style={{ width: 36 }} />
      <View style={styles.nameContainer}>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>Club</Text>
      </View>
      <View style={styles.statsContainer}>
        <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>P</Text>
        <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>W</Text>
        <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>D</Text>
        <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>L</Text>
        <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>GD</Text>
        <Text style={[styles.pointsLabel, { color: colors.mutedForeground }]}>Pts</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    marginBottom: 4,
  },
  zoneBar: {
    width: 4,
    marginRight: 8,
  },
  positionContainer: {
    width: 24,
    alignItems: "center",
  },
  nameContainer: {
    flex: 1,
    marginRight: 8,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    width: 22,
    textAlign: "center",
  },
  pointsLabel: {
    fontSize: 11,
    fontWeight: "700",
    width: 26,
    textAlign: "center",
  },
});
