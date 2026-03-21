import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from "react-native";
import UserAvatar from "../../components/UserAvatar";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import Header from "../../components/Header";
import Card from "../../components/Card";
import { Colors, Shadows } from "../../theme/colors";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { db } from "../../config/firebase";
import { doc, updateDoc } from "firebase/firestore";

export default function ProfileScreen({ navigation }) {
  const { user, userData, logout, refreshUserData } = useAuth();

  const handleLogout = () => {
    Alert.alert("Sair", "Deseja sair da sua conta?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", style: "destructive", onPress: logout },
    ]);
  };

  const [activeTab, setActiveTab] = React.useState("editProfile");
  const [savingProfile, setSavingProfile] = React.useState(false);
  const [nameDraft, setNameDraft] = React.useState(userData?.name || user?.displayName || "");
  const [notifyEnabled, setNotifyEnabled] = React.useState(true);

  React.useEffect(() => {
    setNameDraft(userData?.name || user?.displayName || "");
  }, [userData?.name, user?.displayName]);

  const tabItems = [
    { key: "editProfile", icon: "person-outline", label: "Editar Perfil", color: Colors.orange },
    { key: "notifications", icon: "notifications-outline", label: "Notificações", color: Colors.info },
    { key: "help", icon: "help-circle-outline", label: "Ajuda e Suporte", color: Colors.warning },
    { key: "terms", icon: "document-text-outline", label: "Termos de Uso", color: Colors.gray600 },
  ];

  const handleSaveProfile = async () => {
    const nextName = (nameDraft || "").trim();
    if (!nextName) {
      Alert.alert("Atenção", "Informe seu nome.");
      return;
    }
    if (!user?.uid) return;

    setSavingProfile(true);
    try {
      await updateDoc(doc(db, "users", user.uid), { name: nextName });
      await refreshUserData();
    } catch (e) {
      Alert.alert("Erro", e?.message || "Não foi possível salvar os dados.");
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Perfil"
        showBack={navigation.canGoBack?.() ?? false}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileRow}>
            <UserAvatar
              userData={userData}
              name={userData?.name || user?.displayName}
              size={64}
              borderRadius={20}
              gradientColors={Colors.gradientOrange}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {userData?.name || user?.displayName || "Usuário"}
              </Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
            </View>
          </View>
        </Card>

        {/* Menu */}
        <Card>
          {tabItems.map((item) => (
            <TouchableOpacity
              style={[
                styles.menuItem,
                activeTab === item.key && { backgroundColor: item.color + "10" },
                item.key !== tabItems[tabItems.length - 1]?.key && styles.menuItemBorder,
              ]}
              key={item.key}
              onPress={() => setActiveTab(item.key)}
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

        {/* Content */}
        <Card style={styles.contentCard}>
          {activeTab === "editProfile" && (
            <>
              <Text style={styles.sectionTitle}>Editar Perfil</Text>
              <Input
                label="Nome"
                value={nameDraft}
                onChangeText={setNameDraft}
                placeholder="Seu nome"
                icon="person-outline"
              />
              <Button
                title={savingProfile ? "Salvando..." : "Salvar alterações"}
                icon="save-outline"
                loading={savingProfile}
                onPress={handleSaveProfile}
                small
                style={styles.saveBtn}
              />
            </>
          )}

          {activeTab === "notifications" && (
            <>
              <Text style={styles.sectionTitle}>Notificações</Text>
              <View style={styles.rowBetween}>
                <Text style={styles.rowLabel}>Atualizações importantes</Text>
                <Switch value={notifyEnabled} onValueChange={setNotifyEnabled} />
              </View>
              <Text style={styles.helperText}>
                (Por enquanto, apenas demonstrativo no app. As preferências podem ser conectadas no próximo ajuste.)
              </Text>
            </>
          )}

          {activeTab === "help" && (
            <>
              <Text style={styles.sectionTitle}>Ajuda e Suporte</Text>
              <Text style={styles.helperText}>
                Em caso de dúvidas, utilize os canais de suporte disponíveis na próxima versão do sistema.
              </Text>
              <TouchableOpacity
                style={[styles.linkBtn, Shadows.small]}
                onPress={() => Alert.alert("Suporte", "Canal de suporte não configurado neste momento.")}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={18} color={Colors.teal} />
                <Text style={styles.linkText}>Falar com o suporte</Text>
              </TouchableOpacity>
            </>
          )}

          {activeTab === "terms" && (
            <>
              <Text style={styles.sectionTitle}>Termos de Uso</Text>
              <Text style={styles.termsText}>
                Este é um conteúdo placeholder para os Termos de Uso do Domus App. Ajuste quando o texto final estiver pronto.
              </Text>
            </>
          )}
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
  profileInfo: { marginLeft: 16, flex: 1 },
  profileName: { fontSize: 20, fontWeight: "700", color: Colors.textPrimary },
  profileEmail: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
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
  contentCard: { marginTop: 14, marginBottom: 6, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: Colors.textPrimary, marginBottom: 12 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  rowLabel: { fontSize: 13, color: Colors.textSecondary, fontWeight: "600" },
  helperText: { fontSize: 12, color: Colors.textSecondary, marginTop: 10, lineHeight: 18 },
  linkBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray100,
    padding: 12,
    borderRadius: 12,
    marginTop: 10,
  },
  linkText: { fontSize: 14, fontWeight: "700", color: Colors.teal },
  termsText: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },
  saveBtn: { marginTop: 10 },
  version: {
    textAlign: "center",
    fontSize: 12,
    color: Colors.gray400,
    marginTop: 24,
  },
});
