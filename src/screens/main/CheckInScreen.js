import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  SafeAreaView,
  Alert,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { Colors, Radius, Shadows } from "../../theme/colors";
import { useAuth } from "../../contexts/AuthContext";
import {
  getLastCheckIn,
  registerCheckIn,
  getWorkLocation,
  logCheckInAttempt,
} from "../../config/firebase";
import { isWithinWorkLocation } from "../../utils/geolocation";

const { width } = Dimensions.get("window");

export default function CheckInScreen({ onBack }) {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [checkType, setCheckType] = useState("entrada");
  const [lastCheckIn, setLastCheckIn] = useState(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const formatCheckTime = (item) => {
    if (!item) return "--:--";
    if (item.time) return item.time;
    if (item.localTime) {
      return new Date(item.localTime).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    if (item.timestamp?.toDate) {
      return item.timestamp.toDate().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return "--:--";
  };

  useEffect(() => {
    // Animação de entrada
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Animação de pulso
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();

    // Pedir permissão de localização
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permissão negada",
          "Precisamos da localização para registrar o ponto.",
        );
        setLocationLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(loc.coords);
      setLocationLoading(false);
    })();

    (async () => {
      if (!user?.uid) return;
      const lastResult = await getLastCheckIn(user.uid);
      if (lastResult.success && lastResult.data?.type) {
        setLastCheckIn(lastResult.data);
        setCheckType(lastResult.data.type === "entrada" ? "saida" : "entrada");
      } else if (!lastResult.success) {
        Alert.alert("Aviso", lastResult.error);
      }
    })();

    return () => pulse.stop();
  }, [user?.uid]);

  const handleCheckIn = async () => {
    if (!location) {
      Alert.alert("Erro", "Localização não disponível. Tente novamente.");
      return;
    }

    setLoading(true);

    const employerId = userData?.employerId || null;
    const employeeName = userData?.name || user?.displayName || user?.email || null;

    if (employerId) {
      const locResult = await getWorkLocation(employerId);
      if (locResult.success && locResult.data) {
        const { allowed, distance, radius } = isWithinWorkLocation(location, locResult.data);
        if (!allowed) {
          await logCheckInAttempt(user.uid, {
            employerId,
            employeeName,
            type: checkType,
            latitude: location.latitude,
            longitude: location.longitude,
            distanceMeters: distance,
            radiusMeters: radius,
            reason: "outside_area",
          });
          setLoading(false);
          Alert.alert(
            "📍 Fora do local autorizado",
            `Você está a aproximadamente ${Math.round(distance)} m do local de trabalho (máx. ${radius} m).\n\nAproxime-se do local cadastrado para registrar o ponto.`,
            [{ text: "Entendi" }],
          );
          return;
        }
      }
    }

    const result = await registerCheckIn(user.uid, checkType, location, {
      employerId,
      employeeName,
    });

    setLoading(false);

    if (result.success) {
      const now = new Date();
      setLastCheckIn({
        type: checkType,
        localTime: now.toISOString(),
        time: now.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
      setCheckType(checkType === "entrada" ? "saida" : "entrada");
      Alert.alert(
        "✅ Ponto Registrado!",
        `${checkType === "entrada" ? "Entrada" : "Saída"} registrada com sucesso às ${now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`,
      );
    } else {
      Alert.alert("Erro", result.error);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={Colors.gradientWarm} style={{ flex: 1 }}>
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onBack} style={styles.backBtn}>
              <Ionicons
                name="arrow-back"
                size={22}
                color={Colors.textPrimary}
              />
            </TouchableOpacity>
            <Text style={styles.title}>Registrar Ponto</Text>
            <View style={{ width: 44 }} />
          </View>

          {/* Content */}
          <View style={styles.content}>
            {userData?.role === "employer" && (
              <View style={[styles.lastCard, Shadows.small, { marginBottom: 16 }]}>
                <Ionicons name="information-circle" size={20} color={Colors.info} />
                <Text style={[styles.lastText, { color: Colors.info }]}>
                  Empregador não registra ponto. Use Equipe e Relatórios.
                </Text>
              </View>
            )}
            {/* Toggle Entrada/Saída */}
            <View style={[styles.toggle, Shadows.small]}>
              <TouchableOpacity
                style={[
                  styles.toggleBtn,
                  checkType === "entrada" && styles.toggleActive,
                ]}
                onPress={() => setCheckType("entrada")}
              >
                <Ionicons
                  name="log-in-outline"
                  size={18}
                  color={
                    checkType === "entrada" ? "#FFF" : Colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.toggleText,
                    checkType === "entrada" && { color: "#FFF" },
                  ]}
                >
                  Entrada
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleBtn,
                  checkType === "saida" && styles.toggleActiveTeal,
                ]}
                onPress={() => setCheckType("saida")}
              >
                <Ionicons
                  name="log-out-outline"
                  size={18}
                  color={checkType === "saida" ? "#FFF" : Colors.textSecondary}
                />
                <Text
                  style={[
                    styles.toggleText,
                    checkType === "saida" && { color: "#FFF" },
                  ]}
                >
                  Saída
                </Text>
              </TouchableOpacity>
            </View>

            {/* Big Button */}
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity
                onPress={handleCheckIn}
                disabled={loading || locationLoading || userData?.role === "employer"}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={
                    checkType === "entrada"
                      ? Colors.gradientOrange
                      : Colors.gradientTeal
                  }
                  style={[styles.bigButton, Shadows.large]}
                >
                  {loading ? (
                    <Text style={styles.bigButtonText}>Registrando...</Text>
                  ) : (
                    <>
                      <Ionicons name="finger-print" size={60} color="#FFF" />
                      <Text style={styles.bigButtonText}>
                        {userData?.role === "employer"
                          ? "Disponível apenas para empregado"
                          : locationLoading
                          ? "Obtendo GPS..."
                          : "Toque para registrar"}
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* Location Status */}
            <View style={[styles.statusCard, Shadows.small]}>
              <View style={styles.statusRow}>
                <Ionicons
                  name={locationLoading ? "locate-outline" : "checkmark-circle"}
                  size={18}
                  color={locationLoading ? Colors.warning : Colors.success}
                />
                <Text style={styles.statusText}>
                  {locationLoading
                    ? "Obtendo localização..."
                    : location
                      ? "Localização obtida"
                      : "Ative a permissão de localização nas configurações"}
                </Text>
              </View>
              {location && (
                <Text style={styles.coordsText}>
                  {location.latitude.toFixed(6)},{" "}
                  {location.longitude.toFixed(6)}
                </Text>
              )}
            </View>

            {/* Last Check-in */}
            {lastCheckIn && (
              <View style={[styles.lastCard, Shadows.small]}>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={Colors.success}
                />
                <Text style={styles.lastText}>
                  Último registro: {lastCheckIn.type} às {formatCheckTime(lastCheckIn)}
                </Text>
              </View>
            )}
          </View>
        </Animated.View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  container: { flex: 1, paddingHorizontal: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 16,
    marginBottom: 30,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.small,
  },
  title: { fontSize: 18, fontWeight: "700", color: Colors.textPrimary },
  content: { flex: 1, alignItems: "center", paddingTop: 20 },
  toggle: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: 4,
    marginBottom: 40,
    width: "100%",
    borderWidth: 1,
    borderColor: Colors.gray100,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 12,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  toggleActive: { backgroundColor: Colors.orange },
  toggleActiveTeal: { backgroundColor: Colors.teal },
  toggleText: { fontSize: 15, fontWeight: "600", color: Colors.textSecondary },
  bigButton: {
    width: width * 0.55,
    height: width * 0.55,
    borderRadius: width * 0.275,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },
  bigButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 12,
    textAlign: "center",
  },
  statusCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: 16,
    width: "100%",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.gray100,
  },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  statusText: { fontSize: 14, color: Colors.textSecondary },
  coordsText: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 6,
    marginLeft: 28,
  },
  lastCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.successSoft,
    borderRadius: Radius.md,
    padding: 14,
    width: "100%",
  },
  lastText: { fontSize: 14, color: Colors.success, fontWeight: "500" },
});
