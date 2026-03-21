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
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { Colors, Shadows } from "../../theme/colors";
import { useAuth } from "../../contexts/AuthContext";

const { width, height } = Dimensions.get("window");

export default function LoginScreen({ onLogin, onGoToRegister }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = "Informe seu email";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Email inválido";
    if (!password) e.password = "Informe sua senha";
    else if (password.length < 6) e.password = "Mínimo 6 caracteres";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);

    const result = await login(email, password);

    setLoading(false);

    if (result.success) {
      // Login automático pelo AuthContext
    } else {
      Alert.alert("Erro ao entrar", result.error);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={Colors.gradientWarm} style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
              {/* Back */}
              <TouchableOpacity onPress={onGoToRegister} style={styles.backBtn}>
                <Ionicons
                  name="arrow-back"
                  size={22}
                  color={Colors.textPrimary}
                />
              </TouchableOpacity>

              {/* Logo */}
              <View style={styles.logoBox}>
                <Image
                  source={require("../../../assets/logo.png")}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>

              {/* Header */}
              <Text style={styles.title}>Bem-vindo de volta</Text>
              <Text style={styles.subtitle}>Entre para continuar</Text>

              {/* Form */}
              <View style={[styles.form, Shadows.medium]}>
                <Input
                  label="Email"
                  icon="mail-outline"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="seu@email.com"
                  keyboardType="email-address"
                  error={errors.email}
                />
                <Input
                  label="Senha"
                  icon="lock-closed-outline"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Sua senha"
                  secureTextEntry
                  error={errors.password}
                />

                <TouchableOpacity style={styles.forgotBtn}>
                  <Text style={styles.forgotText}>Esqueceu a senha?</Text>
                </TouchableOpacity>

                <Button
                  title="Entrar"
                  iconRight="arrow-forward"
                  onPress={handleLogin}
                  loading={loading}
                />
              </View>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>ou</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Social */}
              <View style={styles.socialRow}>
                <TouchableOpacity style={[styles.socialBtn, Shadows.small]}>
                  <Ionicons name="logo-google" size={20} color="#EA4335" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.socialBtn, Shadows.small]}>
                  <Ionicons
                    name="logo-apple"
                    size={20}
                    color={Colors.textPrimary}
                  />
                </TouchableOpacity>
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>Não tem conta? </Text>
                <TouchableOpacity onPress={onGoToRegister}>
                  <Text style={styles.footerLink}>Criar conta</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  scroll: { flexGrow: 1, paddingBottom: 20 },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 16 },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.white,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    ...Shadows.small,
  },
  logoBox: { alignItems: "center", marginBottom: height * 0.03 },
  logo: { width: width * 0.35, height: width * 0.18 },
  title: {
    fontSize: width * 0.065,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: width * 0.04,
    color: Colors.textSecondary,
    marginBottom: height * 0.025,
  },
  form: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.gray100,
  },
  forgotBtn: { alignSelf: "flex-end", marginBottom: 20, marginTop: -8 },
  forgotText: { fontSize: 14, color: Colors.orange, fontWeight: "600" },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.gray200 },
  dividerText: { marginHorizontal: 14, color: Colors.textLight, fontSize: 13 },
  socialRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 14,
    marginBottom: 24,
  },
  socialBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.white,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.gray100,
  },
  footer: { flexDirection: "row", justifyContent: "center" },
  footerText: { fontSize: 15, color: Colors.textSecondary },
  footerLink: { fontSize: 15, color: Colors.orange, fontWeight: "700" },
});
