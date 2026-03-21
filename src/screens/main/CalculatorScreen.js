import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Input from "../../components/Input";
import Button from "../../components/Button";
import SectionCard from "../../components/SectionCard";
import { Colors, Radius, Shadows, Spacing } from "../../theme/colors";

const { width } = Dimensions.get("window");

export default function CalculatorScreen({ onBack }) {
  const [calcType, setCalcType] = useState("payroll");
  const [salary, setSalary] = useState("1412");
  const [overtimeHours, setOvertimeHours] = useState("0");
  const [nightHours, setNightHours] = useState("0");
  const [months, setMonths] = useState("12");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("17:00");
  const [breakMinutes, setBreakMinutes] = useState("60");
  const [result, setResult] = useState(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const parseHourToMinutes = (value) => {
    const s = String(value || "").trim();
    if (!s) return null;
    const parts = s.split(":");
    const h = parseInt(parts[0], 10);
    let m = parts.length >= 2 ? parseInt(parts[1], 10) : 0;
    if (Number.isNaN(h)) return null;
    if (Number.isNaN(m)) m = 0;
    if (h < 0 || h > 23 || m < 0 || m > 59) return null;
    return h * 60 + m;
  };

  const calculate = () => {
    const salaryBase = parseFloat(String(salary).replace(",", ".")) || 0;
    const extra = parseFloat(overtimeHours) || 0;
    const night = parseFloat(nightHours) || 0;

    if (calcType === "payroll") {
      if (salaryBase <= 0) {
        Alert.alert("Atenção", "Informe um salário base maior que zero.");
        return;
      }
      const base = salaryBase;
      const hourlyRate = base / 220;
      const overtimeValue = extra * hourlyRate * 1.5;
      const nightValue = night * hourlyRate * 0.2;
      const grossSalary = base + overtimeValue + nightValue;
      let inss =
        grossSalary <= 1412
          ? grossSalary * 0.075
          : grossSalary <= 2666.68
            ? 1412 * 0.075 + (grossSalary - 1412) * 0.09
            : 1412 * 0.075 +
              (2666.68 - 1412) * 0.09 +
              (grossSalary - 2666.68) * 0.12;
      const fgts = grossSalary * 0.08;
      const netSalary = grossSalary - inss;

      setResult({
        rows: [
          { label: "Salário Base", value: base },
          {
            label: "Horas Extras",
            value: overtimeValue,
            color: Colors.success,
            prefix: "+",
          },
          {
            label: "Adic. Noturno",
            value: nightValue,
            color: Colors.success,
            prefix: "+",
          },
          { divider: true },
          { label: "Bruto", value: grossSalary, bold: true },
          { label: "INSS", value: inss, color: Colors.error, prefix: "-" },
          { label: "FGTS", value: fgts, muted: true },
          { divider: true },
          { label: "Líquido", value: netSalary, bold: true, highlight: true },
        ],
      });
    } else if (calcType === "termination") {
      const base = parseFloat(String(salary).replace(",", ".")) || 0;
      if (base <= 0) {
        Alert.alert("Atenção", "Informe um salário base maior que zero.");
        return;
      }
      const m = Math.max(1, Math.min(240, parseInt(months, 10) || 12));
      const monthsInCycle = ((m - 1) % 12) + 1;
      const vacation = ((base + base / 3) * monthsInCycle) / 12;
      const thirteenth = (base / 12) * monthsInCycle;
      const fgtsTotal = base * 0.08 * m;
      const noticePay = base;
      const fgtsPenalty = fgtsTotal * 0.4;
      const total = vacation + thirteenth + noticePay + fgtsPenalty;

      setResult({
        rows: [
          { label: "Férias (prop. ciclo)", value: vacation },
          { label: "13º (prop. ciclo)", value: thirteenth },
          { label: "FGTS", value: fgtsTotal },
          { label: "Aviso", value: noticePay },
          { label: "Multa 40%", value: fgtsPenalty },
          { divider: true },
          { label: "Total", value: total, bold: true, highlight: true },
        ],
        message:
          "Estimativa simplificada para referência. Férias e 13º usam o mês atual do ciclo (1–12 meses). Consulte um profissional para valores oficiais.",
      });
    } else {
      const start = parseHourToMinutes(startTime);
      const end = parseHourToMinutes(endTime);
      const rest = Math.max(0, parseInt(breakMinutes, 10) || 0);

      if (start === null || end === null) {
        setResult({
          error: true,
          message: "Use o formato HH:MM (ex.: 08:00 ou 8:30).",
        });
        return;
      }

      let totalMinutes = end - start;
      if (totalMinutes < 0) totalMinutes += 24 * 60;
      const workedMinutes = Math.max(0, totalMinutes - rest);
      const workedHours = Math.round((workedMinutes / 60) * 100) / 100;
      const overtime = Math.max(0, workedHours - 8);

      setResult({
        rows: [
          { label: "Entrada", value: 0, custom: startTime },
          { label: "Saída", value: 0, custom: endTime },
          { label: "Intervalo", value: 0, custom: `${rest} min` },
          { divider: true },
          { label: "Horas do dia", value: workedHours, bold: true },
          {
            label: "Horas extras do dia",
            value: overtime,
            bold: true,
            highlight: true,
          },
        ],
      });
    }
  };

  const fmt = (v) =>
    "R$ " + (Math.round(v * 100) / 100).toFixed(2).replace(".", ",");

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={Colors.gradientWarm} style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View style={{ opacity: fadeAnim }}>
              <TouchableOpacity
                onPress={() => onBack?.()}
                style={styles.backBtn}
                accessibilityRole="button"
                accessibilityLabel="Voltar"
              >
                <Ionicons
                  name="arrow-back"
                  size={22}
                  color={Colors.textPrimary}
                />
              </TouchableOpacity>

              <Text style={styles.title}>Calculadora</Text>
              <Text style={styles.subtitle}>LC 150/2015</Text>

              {/* Toggle */}
              <SectionCard title="Tipo de cálculo" style={styles.toggleWrapper}>
                <View style={styles.toggle}>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    calcType === "payroll" && styles.toggleActive,
                  ]}
                  onPress={() => {
                    setCalcType("payroll");
                    setResult(null);
                  }}
                >
                  <Ionicons
                    name="receipt-outline"
                    size={16}
                    color={
                      calcType === "payroll" ? "#FFF" : Colors.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.toggleText,
                      calcType === "payroll" && { color: "#FFF" },
                    ]}
                  >
                    Folha
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    calcType === "termination" && styles.toggleActiveTeal,
                  ]}
                  onPress={() => {
                    setCalcType("termination");
                    setResult(null);
                  }}
                >
                  <Ionicons
                    name="exit-outline"
                    size={16}
                    color={
                      calcType === "termination" ? "#FFF" : Colors.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.toggleText,
                      calcType === "termination" && { color: "#FFF" },
                    ]}
                  >
                    Rescisão
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    calcType === "daily" && styles.toggleActive,
                  ]}
                  onPress={() => {
                    setCalcType("daily");
                    setResult(null);
                  }}
                >
                  <Ionicons
                    name="calendar-number-outline"
                    size={16}
                    color={calcType === "daily" ? "#FFF" : Colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.toggleText,
                      calcType === "daily" && { color: "#FFF" },
                    ]}
                  >
                    Dia
                  </Text>
                </TouchableOpacity>
                </View>
              </SectionCard>

              {/* Form */}
              <SectionCard>
                <Input
                  label="Salário (R$)"
                  icon="wallet-outline"
                  value={salary}
                  onChangeText={setSalary}
                  keyboardType="numeric"
                />
                {calcType === "payroll" ? (
                  <>
                    <Input
                      label="Horas Extras"
                      icon="flash-outline"
                      value={overtimeHours}
                      onChangeText={setOvertimeHours}
                      keyboardType="numeric"
                    />
                    <Input
                      label="Horas Noturnas"
                      icon="moon-outline"
                      value={nightHours}
                      onChangeText={setNightHours}
                      keyboardType="numeric"
                    />
                  </>
                ) : calcType === "termination" ? (
                  <Input
                    label="Meses"
                    icon="calendar-outline"
                    value={months}
                    onChangeText={setMonths}
                    keyboardType="numeric"
                  />
                ) : (
                  <>
                    <Input
                      label="Entrada (HH:MM)"
                      icon="log-in-outline"
                      value={startTime}
                      onChangeText={setStartTime}
                      placeholder="08:00"
                    />
                    <Input
                      label="Saída (HH:MM)"
                      icon="log-out-outline"
                      value={endTime}
                      onChangeText={setEndTime}
                      placeholder="17:00"
                    />
                    <Input
                      label="Intervalo (min)"
                      icon="pause-outline"
                      value={breakMinutes}
                      onChangeText={setBreakMinutes}
                      keyboardType="numeric"
                    />
                  </>
                )}
                <Button
                  title="Calcular"
                  icon="calculator-outline"
                  onPress={calculate}
                />
              </SectionCard>

              {/* Result */}
              {result && (
                <SectionCard title="Resultado">
                  {result.error ? (
                    <Text style={styles.errorMessage}>{result.message}</Text>
                  ) : (
                    <>
                      {result.rows.map((row, i) => {
                        if (row.divider)
                          return <View key={i} style={styles.divider} />;
                        return (
                          <View key={i} style={styles.resultRow}>
                            <Text
                              style={[
                                styles.resultLabel,
                                row.bold && {
                                  fontWeight: "600",
                                  color: Colors.textPrimary,
                                },
                              ]}
                            >
                              {row.label}
                            </Text>
                            <Text
                              style={[
                                styles.resultValue,
                                row.bold && { fontWeight: "700" },
                                row.color && { color: row.color },
                                row.muted && { color: Colors.textLight },
                                row.highlight && {
                                  color: Colors.orange,
                                  fontSize: 16,
                                  fontWeight: "800",
                                },
                              ]}
                            >
                              {row.prefix || ""}
                              {row.custom != null && row.custom !== ""
                                ? row.custom
                                : fmt(row.value)}
                            </Text>
                          </View>
                        );
                      })}
                      {!!result.message && (
                        <Text style={styles.noteMessage}>{result.message}</Text>
                      )}
                    </>
                  )}
                </SectionCard>
              )}

              <View style={{ height: Spacing.xl }} />
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginBottom: Spacing.lg },
  toggleWrapper: { marginBottom: Spacing.md },
  toggle: {
    flexDirection: "row",
    backgroundColor: Colors.gray100,
    borderRadius: Radius.sm,
    padding: 4,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  toggleActive: { backgroundColor: Colors.orange },
  toggleActiveTeal: { backgroundColor: Colors.teal },
  toggleText: { fontSize: 14, fontWeight: "600", color: Colors.textSecondary },
  divider: { height: 1, backgroundColor: Colors.gray100, marginVertical: Spacing.sm },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  resultLabel: { fontSize: 14, color: Colors.textSecondary },
  resultValue: { fontSize: 14, color: Colors.textPrimary, fontWeight: "500" },
  errorMessage: {
    marginTop: 4,
    color: Colors.error,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  noteMessage: {
    marginTop: 8,
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
});
