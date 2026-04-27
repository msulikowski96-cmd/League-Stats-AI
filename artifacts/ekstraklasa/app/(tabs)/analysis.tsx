import React from "react";
import { View, Text, StyleSheet, Platform, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { TableAnalysis } from "@/components/TableAnalysis";

export default function AnalysisScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border, paddingTop: topPadding + 12 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Analiza AI</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Na podstawie aktualnej tabeli Ekstraklasy</Text>
      </View>
      <TableAnalysis />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  title: { fontSize: 24, fontWeight: "800", letterSpacing: -0.5 },
  subtitle: { fontSize: 13, marginTop: 2 },
});
