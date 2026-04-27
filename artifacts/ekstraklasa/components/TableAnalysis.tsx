import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useTournament } from "@/hooks/useTournament";

export function TableAnalysis() {
  const colors = useColors();
  const [question, setQuestion] = useState("");
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const quickPrompts = [
    "Kto zostanie mistrzem?",
    "Które drużyny są zagrożone spadkiem?",
    "Najlepsza ofensywa vs najlepsza defensywa?",
    "Niespodzianki tego sezonu?",
    "Analiza walki o miejsca europejskie",
    "Analiza walki o mistrzostwo",
  ];

  const handleAnalyze = async (prompt: string) => {
    const q = prompt || question.trim();
    if (!q) return;
    if (Platform.OS !== "web") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      const baseUrl = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";
      const res = await fetch(`${baseUrl}/api/ekstraklasa/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: q,
          context: JSON.stringify({
            tournament: data?.details,
            tournamentIds: data?.ids,
            fixtures: data?.fixtures,
            results: data?.results,
          }),
        }),
      });
      if (!res.ok) throw new Error("Analysis failed");
      const json = (await res.json()) as { analysis: string };
      setAnalysis(json.analysis);
      if (Platform.OS !== "web") await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setError("Failed to get analysis. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={[styles.heroCard, { backgroundColor: colors.primary }]}>
        <View style={styles.heroIcon}>
          <Feather name="cpu" size={28} color="#fff" />
        </View>
        <Text style={styles.heroTitle}>AI Table Analyzer</Text>
        <Text style={styles.heroSub}>Ask anything about live tournament data</Text>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Quick Questions</Text>
        <View style={styles.grid}>
          {quickPrompts.map((p) => (
            <TouchableOpacity key={p} style={[styles.promptCard, { backgroundColor: colors.accent, borderColor: colors.border }]} onPress={() => handleAnalyze(p)} activeOpacity={0.7}>
              <Feather name="zap" size={12} color={colors.primary} />
              <Text style={[styles.promptText, { color: colors.foreground }]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Custom Question</Text>
        <View style={[styles.inputRow, { borderColor: colors.border }]}>
          <TextInput style={[styles.input, { color: colors.foreground }]} placeholder="Ask about the league table..." placeholderTextColor={colors.mutedForeground} value={question} onChangeText={setQuestion} multiline />
          <TouchableOpacity style={[styles.sendBtn, { backgroundColor: colors.primary, opacity: loading || !question.trim() ? 0.4 : 1 }]} onPress={() => handleAnalyze(question)} disabled={loading || !question.trim()}>
            <Feather name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {loading && <View style={styles.loadingContainer}><ActivityIndicator size="large" color={colors.primary} /><Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Analyzing league data...</Text></View>}
      {error && <View style={[styles.errorBox, { backgroundColor: "#fee2e2", borderColor: "#ef4444" }]}><Feather name="alert-circle" size={16} color="#ef4444" /><Text style={styles.errorText}>{error}</Text></View>}
      {analysis && <View style={[styles.analysisBox, { backgroundColor: colors.card, borderColor: colors.primary }]}><View style={styles.analysisHeader}><Feather name="cpu" size={16} color={colors.primary} /><Text style={[styles.analysisLabel, { color: colors.primary }]}>AI Analysis</Text></View><Text style={[styles.analysisText, { color: colors.foreground }]}>{analysis}</Text></View>}
      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  heroCard: { margin: 12, borderRadius: 16, padding: 20, alignItems: "center" },
  heroIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  heroTitle: { fontSize: 22, fontWeight: "700", color: "#fff", marginBottom: 6 },
  heroSub: { fontSize: 14, color: "rgba(255,255,255,0.8)", textAlign: "center" },
  section: { marginHorizontal: 12, marginBottom: 12, borderRadius: 12, borderWidth: 1, padding: 16 },
  sectionTitle: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 },
  grid: { gap: 8 },
  promptCard: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 8, borderWidth: 1 },
  promptText: { fontSize: 14, fontWeight: "500", flex: 1 },
  inputRow: { flexDirection: "row", alignItems: "flex-end", borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  input: { flex: 1, fontSize: 14, maxHeight: 100, minHeight: 40 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  loadingContainer: { alignItems: "center", paddingVertical: 24, gap: 12 },
  loadingText: { fontSize: 14 },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 12, marginBottom: 12, padding: 12, borderRadius: 10, borderWidth: 1 },
  errorText: { fontSize: 13, color: "#ef4444", flex: 1 },
  analysisBox: { marginHorizontal: 12, marginBottom: 12, borderRadius: 12, borderWidth: 1.5, padding: 16 },
  analysisHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  analysisLabel: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  analysisText: { fontSize: 15, lineHeight: 24 },
});
