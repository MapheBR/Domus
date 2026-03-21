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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { Colors, Shadows } from "../../theme/colors";

const { width } = Dimensions.get("window");

export default function CalculatorScreen({ onBack }) {
  const [calcType, setCalcType] = useState("payroll");
  const [salary, setSalary] = useState("1412");
  const [overtimeHours, setOvertimeHours] = useState("0");
  const [nightHours, setNightHours] = useState("0");
  const [months, setMonths] = useState("12");
  const [result, setResult] = useState(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const calculate = () => {
    const base = parseFloat(salary) || 0;
    const extra = parseFloat(overtimeHours) || 0;
    const night = parseFloat(nightHours) || 0;

    if (calcType === "payroll") {
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
    } else {
      const m = parseInt(months) || 12;
      const vacation = ((base + base / 3) * (m % 12)) / 12;
      const thirteenth = (base / 12) * (m % 12);
      const fgtsTotal = base * 0.08 * m;
      const noticePay = base;
      const fgtsPenalty = fgtsTotal * 0.4;
      const total = vacation + thirteenth + noticePay + fgtsPenalty;

      setResult({
        rows: [
          { label: "Férias", value: vacation },
          { label: "13º", value: thirteenth },
          { label: "FGTS", value: fgtsTotal },
          { label: "Aviso", value: noticePay },
          { label: "Multa 40%", value: fgtsPenalty },
          { divider: true },
          { label: "Total", value: total, bold: true, highlight: true },
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
              <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                <Ionicons
                  name="arrow-back"
                  size={22}
                  color={Colors.textPrimary}
                />
              </TouchableOpacity>

              <Text style={styles.title}>Calculadora</Text>
              <Text style={styles.subtitle}>LC 150/2015</Text>

              {/* Toggle */}
              <View style={[styles.toggle, Shadows.small]}>
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
              </View>

              {/* Form */}
              <View style={[styles.form, Shadows.medium]}>
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
                ) : (
                  <Input
                    label="Meses"
                    icon="calendar-outline"
                    value={months}
                    onChangeText={setMonths}
                    keyboardType="numeric"
                  />
                )}
                <Button
                  title="Calcular"
                  icon="calculator-outline"
                  onPress={calculate}
                />
              </View>

              {/* Result */}
              {result && (
                <View style={[styles.resultCard, Shadows.medium]}>
                  <Text style={styles.resultTitle}>Resultado</Text>
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
                          {fmt(row.value)}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}

              <View style={{ height: 30 }} />
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  content: { paddingHorizontal: 20, paddingTop: 16 },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.white,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    ...Shadows.small,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginBottom: 20 },
  toggle: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.gray100,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  toggleActive: { backgroundColor: Colors.orange },
  toggleActiveTeal: { backgroundColor: Colors.teal },
  toggleText: { fontSize: 14, fontWeight: "600", color: Colors.textSecondary },
  form: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.gray100,
  },
  resultCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.gray100,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 14,
  },
  divider: { height: 1, backgroundColor: Colors.gray100, marginVertical: 10 },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  resultLabel: { fontSize: 14, color: Colors.textSecondary },
  resultValue: { fontSize: 14, color: Colors.textPrimary, fontWeight: "500" },
});
