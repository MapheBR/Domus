import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Header from "../../components/Header";
import Button from "../../components/Button";
import { Colors, Shadows } from "../../theme/colors";

const MOCK_EMPLOYEES = [
  {
    id: "1",
    name: "Ana Maria Silva",
    role: "Empregada Doméstica",
    salary: 1412,
    status: "active",
    startDate: "2024-03-15",
    hoursThisMonth: 168,
    overtimeThisMonth: 4,
  },
  {
    id: "2",
    name: "José Santos",
    role: "Motorista",
    salary: 1800,
    status: "active",
    startDate: "2024-06-01",
    hoursThisMonth: 176,
    overtimeThisMonth: 8,
  },
];

export default function EmployeesScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const renderEmployee = ({ item }) => (
    <TouchableOpacity style={[styles.card, Shadows.medium]} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <LinearGradient colors={Colors.gradientTeal} style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .substring(0, 2)}
          </Text>
        </LinearGradient>
        <View style={styles.employeeInfo}>
          <Text style={styles.employeeName}>{item.name}</Text>
          <Text style={styles.employeeRole}>{item.role}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                item.status === "active" ? Colors.successSoft : Colors.gray100,
            },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor:
                  item.status === "active" ? Colors.success : Colors.gray400,
              },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              {
                color:
                  item.status === "active" ? Colors.success : Colors.gray500,
              },
            ]}
          >
            {item.status === "active" ? "Ativo" : "Inativo"}
          </Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            R${" "}
            {item.salary.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </Text>
          <Text style={styles.statLabel}>Salário</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{item.hoursThisMonth}h</Text>
          <Text style={styles.statLabel}>Horas/mês</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: Colors.orange }]}>
            {item.overtimeThisMonth}h
          </Text>
          <Text style={styles.statLabel}>Extras</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header
        title="Empregados"
        subtitle="Gerenciar funcionários"
        rightIcon="add-circle"
        onRightPress={() => navigation.navigate("AddEmployee")}
      />

      <FlatList
        data={MOCK_EMPLOYEES}
        renderItem={renderEmployee}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color={Colors.gray300} />
            <Text style={styles.emptyTitle}>Nenhum empregado</Text>
            <Text style={styles.emptySubtitle}>
              Cadastre seu primeiro empregado doméstico
            </Text>
            <Button
              title="Adicionar Empregado"
              icon="add"
              onPress={() => navigation.navigate("AddEmployee")}
              fullWidth={false}
              style={{ marginTop: 20, paddingHorizontal: 30 }}
            />
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.white,
  },
  employeeInfo: { flex: 1, marginLeft: 14 },
  employeeName: { fontSize: 16, fontWeight: "700", color: Colors.textPrimary },
  employeeRole: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 6,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: "600" },
  statsRow: {
    flexDirection: "row",
    backgroundColor: Colors.gray50,
    borderRadius: 14,
    padding: 14,
  },
  stat: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 16, fontWeight: "700", color: Colors.textPrimary },
  statLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 4 },
  statDivider: {
    width: 1,
    backgroundColor: Colors.gray200,
    marginVertical: 4,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: "center",
  },
});
