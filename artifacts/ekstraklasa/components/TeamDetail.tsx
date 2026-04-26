import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import type { Team } from "@/data/table";
import { getRowZone } from "@/data/table";

interface TeamDetailProps {
  team: Team;
  onClose: () => void;
}

const FORM_LABEL: Record<string, string> = {
  W: "Win",
  D: "Draw",
  L: "Loss",
};

const FORM_BG: Record<string, string> = {
  W: "#16a34a",
  D: "#f59e0b",
  L: "#ef4444",
};

export function TeamDetail({ team, onClose }: TeamDetailProps) {
  const colors = useColors();
  const [question, setQuestion] = useState("");
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const zone = getRowZone(team.position);

  const winRate = Math.round((team.won / team.played) * 100);
  const goalsPerGame = (team.goalsFor / team.played).toFixed(1);
  const concededPerGame = (team.goalsAgainst / team.played).toFixed(1);

  const quickPrompts = [
    "Analyze this team's performance",
    "What are their key strengths?",
    "Predict their season finale",
    "How do they compare to top 4?",
  ];

  const handleAnalyze = async (prompt: string) => {
    const q = prompt || question.trim();
    if (!q) return;

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const baseUrl = process.env.EXPO_PUBLIC_DOMAIN
        ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
        : "";

      const res = await fetch(`${baseUrl}/api/ekstraklasa/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: q,
          context: JSON.stringify({
            team: team.name,
            position: team.position,
            played: team.played,
            won: team.won,
            drawn: team.drawn,
            lost: team.lost,
            goalsFor: team.goalsFor,
            goalsAgainst: team.goalsAgainst,
            goalDifference: team.goalDifference,
            points: team.points,
            form: team.form,
            winRate: `${winRate}%`,
            goalsPerGame,
            concededPerGame,
          }),
        }),
      });

      if (!res.ok) throw new Error("Analysis failed");
      const data = (await res.json()) as { analysis: string };
      setAnalysis(data.analysis);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      setError("Failed to get analysis. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={8}>
          <Feather name="x" size={22} color={colors.mutedForeground} />
        </TouchableOpacity>
        <Text style={styles.badge}>{team.badge}</Text>
        <View style={styles.headerText}>
          <Text style={[styles.teamName, { color: colors.foreground }]}>{team.name}</Text>
          <Text style={[styles.teamSub, { color: colors.mutedForeground }]}>
            Position {team.position} · {team.points} pts
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.statsGrid, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <StatCard label="Played" value={String(team.played)} colors={colors} />
          <StatCard label="Won" value={String(team.won)} color="#16a34a" colors={colors} />
          <StatCard label="Drawn" value={String(team.drawn)} color="#f59e0b" colors={colors} />
          <StatCard label="Lost" value={String(team.lost)} color="#ef4444" colors={colors} />
          <StatCard label="Goals For" value={String(team.goalsFor)} colors={colors} />
          <StatCard label="Goals Ag." value={String(team.goalsAgainst)} colors={colors} />
          <StatCard
            label="Goal Diff."
            value={team.goalDifference > 0 ? `+${team.goalDifference}` : String(team.goalDifference)}
            color={team.goalDifference >= 0 ? "#16a34a" : "#ef4444"}
            colors={colors}
          />
          <StatCard label="Win Rate" value={`${winRate}%`} color={colors.primary} colors={colors} />
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Recent Form</Text>
          <View style={styles.form}>
            {team.form.map((f, i) => (
              <View key={i} style={[styles.formBadge, { backgroundColor: FORM_BG[f] }]}>
                <Text style={styles.formText}>{f}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.aiHeader}>
            <Feather name="cpu" size={16} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.primary, marginBottom: 0 }]}>AI Analysis</Text>
          </View>

          <View style={styles.quickPrompts}>
            {quickPrompts.map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.quickPrompt, { backgroundColor: colors.accent, borderColor: colors.primary }]}
                onPress={() => handleAnalyze(p)}
                activeOpacity={0.7}
              >
                <Text style={[styles.quickPromptText, { color: colors.accentForeground }]} numberOfLines={1}>
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={[styles.inputRow, { borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              placeholder="Ask anything about this team..."
              placeholderTextColor={colors.mutedForeground}
              value={question}
              onChangeText={setQuestion}
              multiline
              returnKeyType="send"
            />
            <TouchableOpacity
              style={[styles.sendBtn, { backgroundColor: colors.primary, opacity: loading ? 0.5 : 1 }]}
              onPress={() => handleAnalyze(question)}
              disabled={loading || !question.trim()}
            >
              <Feather name="send" size={16} color="#fff" />
            </TouchableOpacity>
          </View>

          {loading && (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Analyzing...</Text>
            </View>
          )}

          {error && (
            <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
          )}

          {analysis && (
            <View style={[styles.analysisBox, { backgroundColor: colors.accent, borderColor: colors.primary }]}>
              <Text style={[styles.analysisText, { color: colors.foreground }]}>{analysis}</Text>
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function StatCard({
  label,
  value,
  color,
  colors,
}: {
  label: string;
  value: string;
  color?: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[styles.statCard, { borderColor: colors.border }]}>
      <Text style={[styles.statValue, { color: color ?? colors.foreground }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  closeBtn: {
    padding: 4,
  },
  badge: {
    fontSize: 32,
  },
  headerText: {
    flex: 1,
  },
  teamName: {
    fontSize: 18,
    fontWeight: "700",
  },
  teamSub: {
    fontSize: 13,
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    margin: 12,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  statCard: {
    width: "25%",
    alignItems: "center",
    paddingVertical: 14,
    borderRightWidth: 1,
    borderBottomWidth: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  section: {
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  form: {
    flexDirection: "row",
    gap: 8,
  },
  formBadge: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  formText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  aiHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  quickPrompts: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  quickPrompt: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  quickPromptText: {
    fontSize: 12,
    fontWeight: "500",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    maxHeight: 80,
    minHeight: 20,
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  loadingText: {
    fontSize: 13,
  },
  errorText: {
    fontSize: 13,
    marginTop: 12,
  },
  analysisBox: {
    marginTop: 12,
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
  },
  analysisText: {
    fontSize: 14,
    lineHeight: 22,
  },
});
