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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { Colors, Shadows } from "../../theme/colors";

const { width, height } = Dimensions.get("window");

export default function RegisterScreen({ onRegister, onGoToLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("employer");
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
    if (!name.trim()) e.name = "Informe seu nome";
    if (!email.trim()) e.email = "Informe seu email";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Email inválido";
    if (!password) e.password = "Crie uma senha";
    else if (password.length < 6) e.password = "Mínimo 6 caracteres";
    if (password !== confirmPassword)
      e.confirmPassword = "Senhas não coincidem";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = () => {
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onRegister();
    }, 800);
  };

  const RoleButton = ({ type, icon, label }) => {
    const isActive = role === type;
    const color = type === "employer" ? Colors.orange : Colors.teal;

    return (
      <TouchableOpacity
        style={[
          styles.roleBtn,
          isActive && { borderColor: color, backgroundColor: color + "08" },
        ]}
        onPress={() => setRole(type)}
        activeOpacity={0.8}
      >
        <View
          style={[
            styles.roleIconBox,
            { backgroundColor: isActive ? color + "15" : Colors.gray100 },
          ]}
        >
          <Ionicons
            name={icon}
            size={20}
            color={isActive ? color : Colors.gray400}
          />
        </View>
        <Text
          style={[styles.roleLabel, isActive && { color, fontWeight: "600" }]}
        >
          {label}
        </Text>
        {isActive && (
          <View style={[styles.roleCheck, { backgroundColor: color }]}>
            <Ionicons name="checkmark" size={10} color="#FFF" />
          </View>
        )}
      </TouchableOpacity>
    );
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
              <TouchableOpacity onPress={onGoToLogin} style={styles.backBtn}>
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
              <Text style={styles.title}>Criar conta</Text>
              <Text style={styles.subtitle}>Comece sua jornada</Text>

              {/* Role */}
              <View style={styles.roleRow}>
                <RoleButton
                  type="employer"
                  icon="briefcase-outline"
                  label="Empregador"
                />
                <RoleButton
                  type="employee"
                  icon="person-outline"
                  label="Empregado"
                />
              </View>

              {/* Form */}
              <View style={[styles.form, Shadows.medium]}>
                <Input
                  label="Nome"
                  icon="person-outline"
                  value={name}
                  onChangeText={setName}
                  placeholder="Seu nome"
                  error={errors.name}
                />
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
                  placeholder="Mínimo 6 caracteres"
                  secureTextEntry
                  error={errors.password}
                />
                <Input
                  label="Confirmar"
                  icon="lock-closed-outline"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Repita a senha"
                  secureTextEntry
                  error={errors.confirmPassword}
                />

                <Button
                  title="Criar conta"
                  variant="secondary"
                  iconRight="arrow-forward"
                  onPress={handleRegister}
                  loading={loading}
                />
              </View>

              {/* Terms */}
              <Text style={styles.terms}>
                Ao criar conta, você concorda com os{" "}
                <Text style={styles.termsLink}>Termos</Text> e{" "}
                <Text style={styles.termsLink}>Privacidade</Text>
              </Text>

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>Já tem conta? </Text>
                <TouchableOpacity onPress={onGoToLogin}>
                  <Text style={styles.footerLink}>Entrar</Text>
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
    marginBottom: 16,
    ...Shadows.small,
  },
  logoBox: { alignItems: "center", marginBottom: height * 0.02 },
  logo: { width: width * 0.3, height: width * 0.15 },
  title: {
    fontSize: width * 0.065,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: width * 0.04,
    color: Colors.textSecondary,
    marginBottom: height * 0.02,
  },
  roleRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  roleBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.gray200,
    position: "relative",
  },
  roleIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  roleLabel: { fontSize: 13, color: Colors.textSecondary, fontWeight: "500" },
  roleCheck: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  form: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.gray100,
  },
  terms: {
    fontSize: 12,
    color: Colors.textLight,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 16,
  },
  termsLink: { color: Colors.teal, fontWeight: "600" },
  footer: { flexDirection: "row", justifyContent: "center" },
  footerText: { fontSize: 14, color: Colors.textSecondary },
  footerLink: { fontSize: 14, color: Colors.teal, fontWeight: "700" },
});
