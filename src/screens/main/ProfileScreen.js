import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import Header from "../../components/Header";
import Card from "../../components/Card";
import { Colors, Shadows } from "../../theme/colors";

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, userData, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert("Sair", "Deseja sair da sua conta?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", style: "destructive", onPress: logout },
    ]);
  };

  const menuItems = [
    { icon: "person-outline", label: "Editar Perfil", color: Colors.orange },
    {
      icon: "card-outline",
      label: "Plano e Assinatura",
      color: Colors.teal,
      screen: "Plans",
    },
    {
      icon: "notifications-outline",
      label: "Notificações",
      color: Colors.info,
    },
    {
      icon: "shield-outline",
      label: "Privacidade (LGPD)",
      color: Colors.success,
    },
    {
      icon: "help-circle-outline",
      label: "Ajuda e Suporte",
      color: Colors.warning,
    },
    {
      icon: "document-text-outline",
      label: "Termos de Uso",
      color: Colors.gray600,
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header title="Perfil" />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileRow}>
            <LinearGradient
              colors={Colors.gradientOrange}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>
                {(user?.displayName || "U")[0].toUpperCase()}
              </Text>
            </LinearGradient>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {user?.displayName || "Usuário"}
              </Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
              <View style={styles.planBadge}>
                <Ionicons name="sparkles" size={12} color={Colors.teal} />
                <Text style={styles.planText}>
                  {userData?.plan === "trial"
                    ? "Período de Teste"
                    : "Plano " + (userData?.plan || "Free")}
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Menu */}
        <Card>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuItem,
                index < menuItems.length - 1 && styles.menuItemBorder,
              ]}
              onPress={() => item.screen && navigation.navigate(item.screen)}
              activeOpacity={0.6}
            >
              <View
                style={[
                  styles.menuIcon,
                  { backgroundColor: item.color + "15" },
                ]}
              >
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={Colors.gray400}
              />
            </TouchableOpacity>
          ))}
        </Card>

        {/* Logout */}
        <TouchableOpacity
          style={[styles.logoutButton, Shadows.small]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Sair da Conta</Text>
        </TouchableOpacity>

        <Text style={styles.version}>DOMUS v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 20, paddingBottom: 100 },
  profileCard: {},
  profileRow: { flexDirection: "row", alignItems: "center" },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontSize: 28, fontWeight: "800", color: Colors.white },
  profileInfo: { marginLeft: 16, flex: 1 },
  profileName: { fontSize: 20, fontWeight: "700", color: Colors.textPrimary },
  profileEmail: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  planBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.tealSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  planText: { fontSize: 12, color: Colors.teal, fontWeight: "600" },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 14,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: Colors.textPrimary,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
    marginTop: 8,
  },
  logoutText: { fontSize: 16, fontWeight: "600", color: Colors.error },
  version: {
    textAlign: "center",
    fontSize: 12,
    color: Colors.gray400,
    marginTop: 24,
  },
});
