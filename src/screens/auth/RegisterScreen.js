import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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
import SectionCard from "../../components/SectionCard";
import { Colors, Radius, Shadows, Spacing } from "../../theme/colors";
import { useAuth } from "../../contexts/AuthContext";

const { width, height } = Dimensions.get("window");

export default function RegisterScreen({ onRegister, onGoToLogin }) {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("employer");
  const [employerEmail, setEmployerEmail] = useState("");
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
    if (role === "employee") {
      if (!employerEmail.trim()) e.employerEmail = "Informe o email do empregador";
      else if (!/\S+@\S+\.\S+/.test(employerEmail))
        e.employerEmail = "Email do empregador inválido";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);

    const result = await register(
      email.trim().toLowerCase(),
      password,
      name.trim(),
      role,
      employerEmail.trim().toLowerCase(),
    );

    setLoading(false);

    if (result.success) {
      if (role === "employee") {
        Alert.alert(
          "Cadastro enviado",
          "Seu cadastro ainda não foi aprovado pelo empregador. Aguarde a liberação para utilizar o sistema.",
        );
      }
      // Navegação principal acontece automaticamente pelo AuthContext
      onRegister?.();
    } else {
      Alert.alert("Erro ao criar conta", result.error);
    }
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
        onPress={() => {
          setRole(type);
          setErrors((prev) => ({ ...prev, employerEmail: undefined }));
        }}
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

              {/* Header */}
              <Text style={styles.title}>Criar conta</Text>
              <Text style={styles.subtitle}>Comece sua jornada</Text>

              {/* Role */}
              <SectionCard title="Tipo de conta" style={styles.roleSection}>
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
              </SectionCard>

              {/* Form */}
              <SectionCard>
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
                {role === "employee" && (
                  <Input
                    label="Email do Empregador"
                    icon="business-outline"
                    value={employerEmail}
                    onChangeText={setEmployerEmail}
                    placeholder="empregador@email.com"
                    keyboardType="email-address"
                    error={errors.employerEmail}
                  />
                )}
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
              </SectionCard>

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
  scroll: { flexGrow: 1, paddingBottom: Spacing.lg },
  container: { flex: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing.md },
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
    fontSize: width * 0.065,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: width * 0.04,
    color: Colors.textSecondary,
    marginBottom: height * 0.02,
  },
  roleSection: { marginBottom: Spacing.md },
  roleRow: { flexDirection: "row", gap: Spacing.sm },
  roleBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.gray200,
    position: "relative",
  },
  roleIconBox: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
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
  terms: {
    fontSize: 12,
    color: Colors.textLight,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  termsLink: { color: Colors.teal, fontWeight: "600" },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: Spacing.sm },
  footerText: { fontSize: 14, color: Colors.textSecondary },
  footerLink: { fontSize: 14, color: Colors.teal, fontWeight: "700" },
});
