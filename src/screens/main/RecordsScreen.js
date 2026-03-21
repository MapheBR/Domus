import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Header from "../../components/Header";
import ScreenState from "../../components/ScreenState";
import FilterChips from "../../components/FilterChips";
import { Colors, Shadows } from "../../theme/colors";
import { useAuth } from "../../contexts/AuthContext";
import { getCheckIns, getEmployerCheckIns } from "../../config/firebase";

export default function RecordsScreen({ onBack }) {
  const { user, userData } = useAuth();
  const [filter, setFilter] = useState("all");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const isEmployer = userData?.role === "employer";

  const loadData = async () => {
    if (!user?.uid) return;
    setLoading(true);
    setError("");
    const result = isEmployer
      ? await getEmployerCheckIns(user.uid)
      : await getCheckIns(user.uid);
    if (result.success) {
      setRecords(result.data || []);
      setError("");
    } else {
      setRecords([]);
      setError(result.error || "Falha ao carregar registros.");
    }
    setLoading(false);
  };

  useEffect(() => {
    let active = true;

    (async () => {
      if (!user?.uid || !active) return;
      setLoading(true);
      const result = isEmployer
        ? await getEmployerCheckIns(user.uid)
        : await getCheckIns(user.uid);
      if (!active) return;
      if (result.success) {
        setRecords(result.data || []);
        setError("");
      } else {
        setRecords([]);
        setError(result.error || "Falha ao carregar registros.");
      }
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [user?.uid, isEmployer]);

  const filteredRecords = useMemo(
    () =>
    filter === "all"
      ? records
      : records.filter((r) => r.type === filter),
    [records, filter],
  );

  const parseRecordDate = (item) => {
    if (item?.localTime) return new Date(item.localTime);
    if (item?.timestamp?.toDate) return item.timestamp.toDate();
    return new Date();
  };

  const renderRecord = ({ item }) => (
    <View style={[styles.recordCard, Shadows.small]}>
      <View
        style={[
          styles.recordIcon,
          {
            backgroundColor:
              item.type === "entrada" ? Colors.successSoft : Colors.errorSoft,
          },
        ]}
      >
        <Ionicons
          name={item.type === "entrada" ? "log-in" : "log-out"}
          size={20}
          color={item.type === "entrada" ? Colors.success : Colors.error}
        />
      </View>
      <View style={styles.recordInfo}>
        <Text style={styles.recordTime}>
          {parseRecordDate(item).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
        <Text style={styles.recordEmployee}>
          {isEmployer ? item.employeeName || "Funcionário" : "Meu registro"}
        </Text>
        <View style={styles.hashRow}>
          <Ionicons name="shield-checkmark" size={12} color={Colors.teal} />
          <Text style={styles.hashLabel}>
            {parseRecordDate(item).toLocaleDateString("pt-BR")}
          </Text>
        </View>
      </View>
      <View style={styles.recordType}>
        <Text
          style={[
            styles.recordTypeText,
            { color: item.type === "entrada" ? Colors.success : Colors.error },
          ]}
        >
          {item.type === "entrada" ? "Entrada" : "Saída"}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header
        title="Registros"
        subtitle={isEmployer ? "Pontos da equipe" : "Meu histórico de ponto"}
        showBack
        onBack={onBack}
      />

      {/* Filters */}
      <View style={styles.filterRow}>
        <FilterChips
          options={[
            { label: "Todos", value: "all" },
            { label: "Entradas", value: "entrada" },
            { label: "Saídas", value: "saida" },
          ]}
          selected={filter}
          onSelect={setFilter}
        />
      </View>

      <FlatList
        data={filteredRecords}
        renderItem={renderRecord}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          loading ? (
            <ScreenState type="loading" title="Carregando registros..." />
          ) : error ? (
            <ScreenState
              type="error"
              icon="alert-circle-outline"
              title="Não foi possível carregar"
              subtitle={error}
              actionLabel="Tentar novamente"
              onAction={loadData}
            />
          ) : (
            <ScreenState
              icon="document-text-outline"
              title="Nenhum registro encontrado"
              subtitle="Não existem registros para o filtro selecionado."
            />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  filterRow: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
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
