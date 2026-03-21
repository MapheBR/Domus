import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  SafeAreaView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Card from "../../components/Card";
import { Colors, Shadows } from "../../theme/colors";

const { width, height } = Dimensions.get("window");

export default function HomeScreen({ onLogout, onGoTo }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  };

  const fmtTime = (d) =>
    d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const fmtDate = (d) =>
    d.toLocaleDateString("pt-BR", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    });

  const actions = [
    {
      id: "checkin",
      icon: "finger-print-outline",
      label: "Ponto",
      color: Colors.orange,
    },
    {
      id: "employees",
      icon: "people-outline",
      label: "Equipe",
      color: Colors.teal,
    },
    {
      id: "records",
      icon: "time-outline",
      label: "Registros",
      color: Colors.info,
    },
    {
      id: "reports",
      icon: "bar-chart-outline",
      label: "Relatórios",
      color: Colors.success,
    },
  ];

  const stats = [
    { icon: "time-outline", value: "176h", label: "Horas", color: Colors.teal },
    {
      icon: "flash-outline",
      value: "8h",
      label: "Extras",
      color: Colors.orange,
    },
    {
      icon: "calendar-outline",
      value: "22",
      label: "Dias",
      color: Colors.info,
    },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={Colors.gradientBackground} style={{ flex: 1 }}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Image
                  source={require("../../../assets/logo.png")}
                  style={styles.headerLogo}
                  resizeMode="contain"
                />
                <View>
                  <Text style={styles.greeting}>{greeting()}</Text>
                  <Text style={styles.userName}>Usuário</Text>
                </View>
              </View>
              <TouchableOpacity onPress={onLogout} style={styles.headerBtn}>
                <Ionicons
                  name="log-out-outline"
                  size={18}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {/* Clock */}
            <View style={[styles.clockCard, Shadows.medium]}>
              <Text style={styles.clockDate}>{fmtDate(currentTime)}</Text>
              <Text style={styles.clockTime}>{fmtTime(currentTime)}</Text>

              <TouchableOpacity
                onPress={() => onGoTo("checkin")}
                activeOpacity={0.9}
                style={{ width: "100%", marginTop: 16 }}
              >
                <LinearGradient
                  colors={Colors.gradientOrange}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.checkinBtn, Shadows.orange]}
                >
                  <Ionicons name="finger-print" size={20} color="#FFF" />
                  <Text style={styles.checkinText}>Registrar Ponto</Text>
                  <Ionicons
                    name="arrow-forward"
                    size={16}
                    color="rgba(255,255,255,0.7)"
                  />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Quick Actions */}
            <Text style={styles.sectionTitle}>Ações Rápidas</Text>
            <View style={styles.actionsRow}>
              {actions.map((a) => (
                <TouchableOpacity
                  key={a.id}
                  style={[styles.actionBtn, Shadows.small]}
                  onPress={() => onGoTo(a.id)}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.actionIcon,
                      { backgroundColor: a.color + "10" },
                    ]}
                  >
                    <Ionicons name={a.icon} size={20} color={a.color} />
                  </View>
                  <Text style={styles.actionLabel}>{a.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Stats */}
            <Text style={styles.sectionTitle}>Este mês</Text>
            <View style={styles.statsRow}>
              {stats.map((s, i) => (
                <View key={i} style={[styles.statCard, Shadows.small]}>
                  <View
                    style={[
                      styles.statIconBox,
                      { backgroundColor: s.color + "10" },
                    ]}
                  >
                    <Ionicons name={s.icon} size={14} color={s.color} />
                  </View>
                  <Text style={[styles.statValue, { color: s.color }]}>
                    {s.value}
                  </Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>

            {/* Tools */}
            <Text style={styles.sectionTitle}>Ferramentas</Text>

            <Card
              icon="calculator-outline"
              iconColor={Colors.orange}
              title="Calculadora"
              subtitle="Folha, INSS, FGTS"
              onPress={() => onGoTo("calculator")}
            />

            <Card
              icon="document-attach-outline"
              iconColor={Colors.teal}
              title="Contrato"
              subtitle="Contratos digitais"
              onPress={() => onGoTo("contract")}
            />

            <Card
              icon="diamond-outline"
              iconColor={Colors.orange}
              title="Planos"
              subtitle="A partir de R$ 5,90"
              onPress={() => onGoTo("plans")}
            />

            <View style={{ height: 30 }} />
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 16 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  headerLogo: { width: 36, height: 36, marginRight: 12, borderRadius: 8 },
  greeting: { fontSize: 13, color: Colors.textSecondary },
  userName: { fontSize: 16, fontWeight: "700", color: Colors.textPrimary },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.white,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.small,
    borderWidth: 1,
    borderColor: Colors.gray100,
  },
  clockCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.gray100,
  },
  clockDate: {
    color: Colors.textSecondary,
    fontSize: 13,
    textTransform: "capitalize",
    marginBottom: 2,
  },
  clockTime: {
    color: Colors.textPrimary,
    fontSize: 40,
    fontWeight: "300",
    letterSpacing: 2,
  },
  checkinBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    gap: 10,
  },
  checkinText: { color: "#FFF", fontWeight: "600", fontSize: 15 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  actionsRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
  actionBtn: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.gray100,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  actionLabel: { fontSize: 12, fontWeight: "600", color: Colors.textPrimary },
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.gray100,
  },
  statIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  statValue: { fontSize: 20, fontWeight: "800" },
  statLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
});
