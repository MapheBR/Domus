import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  SafeAreaView,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Button from "../../components/Button";
import { Colors, Shadows } from "../../theme/colors";

const { width } = Dimensions.get("window");

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: "5,90",
    icon: "leaf-outline",
    color: Colors.success,
    features: ["1 empregado", "Check-in GPS", "Histórico 3 meses"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "9,90",
    icon: "star-outline",
    color: Colors.orange,
    popular: true,
    features: ["Até 3 empregados", "Relatórios PDF", "Folha automática"],
  },
  {
    id: "complete",
    name: "Completo",
    price: "14,90",
    icon: "diamond-outline",
    color: Colors.teal,
    features: ["Ilimitado", "Contrato digital", "Suporte VIP"],
  },
];

export default function PlansScreen({ onBack }) {
  const [selected, setSelected] = useState("pro");
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={Colors.gradientWarm} style={{ flex: 1 }}>
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

            <Text style={styles.title}>Planos</Text>
            <Text style={styles.subtitle}>Cancele quando quiser</Text>

            {/* Plans */}
            {PLANS.map((plan) => (
              <TouchableOpacity
                key={plan.id}
                activeOpacity={0.9}
                onPress={() => setSelected(plan.id)}
                style={[
                  styles.planCard,
                  Shadows.small,
                  selected === plan.id && {
                    borderColor: plan.color,
                    borderWidth: 2,
                  },
                ]}
              >
                {plan.popular && (
                  <View
                    style={[styles.popularTag, { backgroundColor: plan.color }]}
                  >
                    <Text style={styles.popularText}>Popular</Text>
                  </View>
                )}

                <View style={styles.planRow}>
                  <View
                    style={[
                      styles.planIcon,
                      { backgroundColor: plan.color + "12" },
                    ]}
                  >
                    <Ionicons name={plan.icon} size={20} color={plan.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.planName}>{plan.name}</Text>
                    <View style={styles.featureRow}>
                      {plan.features.map((f, i) => (
                        <View key={i} style={styles.featureItem}>
                          <Ionicons
                            name="checkmark"
                            size={12}
                            color={plan.color}
                          />
                          <Text style={styles.featureText}>{f}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  <View style={styles.priceBox}>
                    <Text style={[styles.price, { color: plan.color }]}>
                      R$ {plan.price}
                    </Text>
                    <Text style={styles.priceUnit}>/mês</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}

            <Button
              title="Começar agora"
              iconRight="arrow-forward"
              onPress={() => alert("Plano: " + selected)}
              style={{ marginTop: 8 }}
            />

            <Text style={styles.guarantee}>Garantia de 7 dias</Text>

            <View style={{ height: 30 }} />
          </Animated.View>
        </ScrollView>
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
  planCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.gray100,
    position: "relative",
  },
  popularTag: {
    position: "absolute",
    top: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  popularText: { fontSize: 10, fontWeight: "700", color: "#FFF" },
  planRow: { flexDirection: "row", alignItems: "center" },
  planIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  planName: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  featureRow: { gap: 4 },
  featureItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  featureText: { fontSize: 12, color: Colors.textSecondary },
  priceBox: { alignItems: "flex-end" },
  price: { fontSize: 18, fontWeight: "800" },
  priceUnit: { fontSize: 11, color: Colors.textLight },
  guarantee: {
    textAlign: "center",
    fontSize: 13,
    color: Colors.textLight,
    marginTop: 16,
  },
});
