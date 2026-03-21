import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Header from "../../components/Header";
import { Colors, Shadows } from "../../theme/colors";

// Mock data
const MOCK_RECORDS = [
  {
    id: "1",
    type: "check_in",
    time: "08:02",
    date: "2026-01-15",
    employee: "Ana Silva",
    hash: "a3f2...",
  },
  {
    id: "2",
    type: "check_out",
    time: "12:01",
    date: "2026-01-15",
    employee: "Ana Silva",
    hash: "b4e1...",
  },
  {
    id: "3",
    type: "check_in",
    time: "13:05",
    date: "2026-01-15",
    employee: "Ana Silva",
    hash: "c5d0...",
  },
  {
    id: "4",
    type: "check_out",
    time: "17:00",
    date: "2026-01-15",
    employee: "Ana Silva",
    hash: "d6c9...",
  },
  {
    id: "5",
    type: "check_in",
    time: "08:00",
    date: "2026-01-14",
    employee: "Ana Silva",
    hash: "e7b8...",
  },
  {
    id: "6",
    type: "check_out",
    time: "17:02",
    date: "2026-01-14",
    employee: "Ana Silva",
    hash: "f8a7...",
  },
];

export default function RecordsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState("all");

  const filteredRecords =
    filter === "all"
      ? MOCK_RECORDS
      : MOCK_RECORDS.filter((r) => r.type === filter);

  const renderRecord = ({ item }) => (
    <View style={[styles.recordCard, Shadows.small]}>
      <View
        style={[
          styles.recordIcon,
          {
            backgroundColor:
              item.type === "check_in" ? Colors.successSoft : Colors.errorSoft,
          },
        ]}
      >
        <Ionicons
          name={item.type === "check_in" ? "log-in" : "log-out"}
          size={20}
          color={item.type === "check_in" ? Colors.success : Colors.error}
        />
      </View>
      <View style={styles.recordInfo}>
        <Text style={styles.recordTime}>{item.time}</Text>
        <Text style={styles.recordEmployee}>{item.employee}</Text>
        <View style={styles.hashRow}>
          <Ionicons name="shield-checkmark" size={12} color={Colors.teal} />
          <Text style={styles.hashLabel}>SHA-256: {item.hash}</Text>
        </View>
      </View>
      <View style={styles.recordType}>
        <Text
          style={[
            styles.recordTypeText,
            { color: item.type === "check_in" ? Colors.success : Colors.error },
          ]}
        >
          {item.type === "check_in" ? "Entrada" : "Saída"}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header title="Registros" subtitle="Histórico de ponto" />

      {/* Filters */}
      <View style={styles.filterRow}>
        {[
          { key: "all", label: "Todos" },
          { key: "check_in", label: "Entradas" },
          { key: "check_out", label: "Saídas" },
        ].map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterBtn, filter === f.key && styles.filterActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text
              style={[
                styles.filterText,
                filter === f.key && styles.filterTextActive,
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredRecords}
        renderItem={renderRecord}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.white,
  },
  filterActive: { backgroundColor: Colors.orange },
  filterText: { fontSize: 14, fontWeight: "600", color: Colors.textSecondary },
  filterTextActive: { color: Colors.white },
  recordCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    gap: 14,
  },
  recordIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  recordInfo: { flex: 1 },
  recordTime: { fontSize: 18, fontWeight: "700", color: Colors.textPrimary },
  recordEmployee: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  hashRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  hashLabel: { fontSize: 11, color: Colors.teal },
  recordType: {},
  recordTypeText: { fontSize: 13, fontWeight: "600" },
});
