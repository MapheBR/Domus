import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Header from "../../components/Header";
import ScreenState from "../../components/ScreenState";
import FilterChips from "../../components/FilterChips";
import SectionCard from "../../components/SectionCard";
import { Colors, Spacing } from "../../theme/colors";
import { useAuth } from "../../contexts/AuthContext";
import { getCheckIns, getEmployerCheckIns } from "../../config/firebase";
import {
  buildDailyWorklogs,
  filterRecordsByLastDays,
  summarizeWorklogs,
} from "../../domain/timeTracking";

export default function ReportsScreen({ onBack }) {
  const { user, userData } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState(30);
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
    } else {
      setRecords([]);
      setError(result.error || "Falha ao carregar relatórios.");
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
        setError(result.error || "Falha ao carregar relatórios.");
      }
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [user?.uid, isEmployer]);

  const stats = useMemo(() => {
    const thisMonth = filterRecordsByLastDays(records, period);

    const entradas = thisMonth.filter((r) => r.type === "entrada").length;
    const saidas = thisMonth.filter((r) => r.type === "saida").length;
    const colaboradores = new Set(
      thisMonth.map((r) => r.employeeName).filter(Boolean),
    ).size;

    const worklogs = buildDailyWorklogs(thisMonth, true);
    const summary = summarizeWorklogs(worklogs);
    const topEmployees = {};

    worklogs.forEach((log) => {
      if (!topEmployees[log.employeeName]) {
        topEmployees[log.employeeName] = { worked: 0, overtime: 0 };
      }
      topEmployees[log.employeeName].worked += log.worked;
      topEmployees[log.employeeName].overtime += log.overtime;
    });

    const ranking = Object.entries(topEmployees)
      .map(([name, values]) => ({
        name,
        worked: Math.round(values.worked * 100) / 100,
        overtime: Math.round(values.overtime * 100) / 100,
      }))
      .sort((a, b) => b.worked - a.worked)
      .slice(0, 5);

    return {
      total: thisMonth.length,
      entradas,
      saidas,
      colaboradores,
      workedTotal: summary.worked,
      overtimeTotal: summary.overtime,
      dailyCount: summary.validDays + summary.incompleteDays,
      ranking,
    };
  }, [records, period]);

  return (
    <View style={styles.container}>
      <Header
        title="Relatórios"
        subtitle={isEmployer ? "Resumo da equipe" : "Meu resumo mensal"}
        showBack
        onBack={onBack}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ScreenState type="loading" title="Gerando relatório..." />
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
          <>
        <FilterChips
          options={[
            { label: "7 dias", value: 7 },
            { label: "15 dias", value: 15 },
            { label: "30 dias", value: 30 },
          ]}
          selected={period}
          onSelect={setPeriod}
          style={styles.periodRow}
        />
        <SectionCard title="Resumo do período">
          <View style={styles.grid}>
            <View style={styles.item}>
              <Ionicons name="time-outline" size={20} color={Colors.teal} />
              <Text style={styles.value}>{stats.total}</Text>
              <Text style={styles.label}>Registros</Text>
            </View>
            <View style={styles.item}>
              <Ionicons name="log-in-outline" size={20} color={Colors.success} />
              <Text style={styles.value}>{stats.entradas}</Text>
              <Text style={styles.label}>Entradas</Text>
            </View>
            <View style={styles.item}>
              <Ionicons name="log-out-outline" size={20} color={Colors.error} />
              <Text style={styles.value}>{stats.saidas}</Text>
              <Text style={styles.label}>Saídas</Text>
            </View>
            <View style={styles.item}>
              <Ionicons name="people-outline" size={20} color={Colors.orange} />
              <Text style={styles.value}>
                {isEmployer ? stats.colaboradores : 1}
              </Text>
              <Text style={styles.label}>
                {isEmployer ? "Colaboradores" : "Usuário"}
              </Text>
            </View>
          </View>
        </SectionCard>

        <SectionCard title="Detalhamento de jornada">
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Dias com registros</Text>
            <Text style={styles.detailValue}>{stats.dailyCount}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Horas trabalhadas</Text>
            <Text style={styles.detailValue}>{stats.workedTotal.toFixed(2)}h</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Horas extras</Text>
            <Text style={[styles.detailValue, { color: Colors.orange }]}>
              {stats.overtimeTotal.toFixed(2)}h
            </Text>
          </View>
        </SectionCard>

        {isEmployer && (
          <SectionCard title="Top colaboradores (período)">
            {stats.ranking.length ? (
              stats.ranking.map((item) => (
                <View key={item.name} style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{item.name}</Text>
                  <Text style={styles.detailValue}>
                    {item.worked.toFixed(2)}h ({item.overtime.toFixed(2)}h extra)
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>Sem dados de jornada este mês.</Text>
            )}
          </SectionCard>
        )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg },
  periodRow: { marginBottom: Spacing.sm },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  item: {
    width: "48%",
    backgroundColor: Colors.gray50,
    borderRadius: 12,
    padding: 12,
  },
  value: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginTop: 8,
  },
  label: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  detailLabel: { color: Colors.textSecondary, fontSize: 13, flex: 1, marginRight: 8 },
  detailValue: { color: Colors.textPrimary, fontSize: 13, fontWeight: "700" },
  emptyText: { fontSize: 13, color: Colors.textSecondary },
});
