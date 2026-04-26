import React, { useState } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Modal,
  SafeAreaView,
  Platform,
  Text,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { TeamRow } from "@/components/TeamRow";
import { TeamDetail } from "@/components/TeamDetail";
import { TableHeader } from "@/components/TableHeader";
import { Legend } from "@/components/Legend";
import { ekstraklasaTable, type Team } from "@/data/table";

export default function TableScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

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
          <Text style={[styles.season, { color: colors.mutedForeground }]}>2025/26 Season</Text>
        </View>
        <View style={[styles.liveBadge, { backgroundColor: colors.accent }]}>
          <View style={[styles.liveDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.liveText, { color: colors.primary }]}>LIVE</Text>
        </View>
      </View>

      <FlatList
        data={ekstraklasaTable}
        keyExtractor={(item) => String(item.position)}
        ListHeaderComponent={
          <>
            <TableHeader />
          </>
        }
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
        scrollEnabled={true}
      />

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
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {},
  league: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  season: {
    fontSize: 13,
    marginTop: 2,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
});
