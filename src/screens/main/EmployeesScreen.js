import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Header from "../../components/Header";
import ScreenState from "../../components/ScreenState";
import { Colors, Shadows } from "../../theme/colors";
import { useAuth } from "../../contexts/AuthContext";
import {
  getEmployees,
  isEmployeePendingApproval,
  subscribeEmployerChecklistTasks,
  updateEmployeeApproval,
} from "../../config/firebase";
import { resolveProfileImageUri } from "../../utils/profileImage";

/** Monta URI da foto (URL, data URL ou base64 cru) e volta às iniciais se falhar ao carregar. */
function EmployeeAvatar({ name, photoUrl, photoBase64 }) {
  const [loadFailed, setLoadFailed] = useState(false);

  const imageUri = useMemo(
    () => resolveProfileImageUri({ photoUrl, photoBase64 }),
    [photoUrl, photoBase64],
  );

  const initials = (name || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  if (!imageUri || loadFailed) {
    return (
      <LinearGradient colors={Colors.gradientTeal} style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </LinearGradient>
    );
  }

  return (
    <Image
      key={imageUri}
      source={{ uri: imageUri }}
      style={styles.avatar}
      resizeMode="cover"
      onError={() => setLoadFailed(true)}
    />
  );
}

export default function EmployeesScreen({
  onBack,
  initialTab = "list",
  onOpenEmployee,
}) {
  const { user, userData } = useAuth();
  const isEmployer = userData?.role === "employer";
  const [employees, setEmployees] = useState([]);
  const [tab, setTab] = useState(initialTab === "pending" ? "pending" : "list");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewingId, setReviewingId] = useState("");

  // Checklist (todas tarefas do empregador)
  const [employerChecklistTasks, setEmployerChecklistTasks] = useState([]);
  const pendingEmployees = employees.filter(isEmployeePendingApproval);
  const activeEmployees = employees.filter((item) => !isEmployeePendingApproval(item));
  const pendingCount = pendingEmployees.length;
  const firstEmployeesLoadDone = useRef(false);

  useEffect(() => {
    if (!isEmployer || !user?.uid) return;
    const unsubscribe = subscribeEmployerChecklistTasks(user.uid, (result) => {
      if (!result?.success) {
        setEmployerChecklistTasks([]);
        return;
      }
      setEmployerChecklistTasks(result?.data || []);
    });
    return () => unsubscribe?.();
  }, [isEmployer, user?.uid]);

  const checklistCountsByEmployeeId = useMemo(() => {
    const map = {};
    for (const t of employerChecklistTasks || []) {
      const employeeId = t?.employeeId;
      if (!employeeId) continue;
      if (!map[employeeId]) {
        map[employeeId] = { notStarted: 0, inProgress: 0, completed: 0, total: 0 };
      }

      map[employeeId].total += 1;
      if (t?.completedAt) map[employeeId].completed += 1;
      else if (t?.startedAt) map[employeeId].inProgress += 1;
      else map[employeeId].notStarted += 1;
    }
    return map;
  }, [employerChecklistTasks]);

  const loadEmployees = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    setError("");
    const result = await getEmployees(user.uid);
    if (result.success) {
      setEmployees(result.data || []);
    } else {
      setError(result.error || "Falha ao carregar equipe.");
    }
    setLoading(false);
  }, [user?.uid]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  useFocusEffect(
    useCallback(() => {
      loadEmployees();
    }, [loadEmployees]),
  );

  useEffect(() => {
    if (loading) return;
    if (!firstEmployeesLoadDone.current) {
      firstEmployeesLoadDone.current = true;
      setTab(pendingCount > 0 && initialTab === "list" ? "pending" : initialTab === "pending" ? "pending" : "list");
      return;
    }
  }, [loading, pendingCount, initialTab]);

  useEffect(() => {
    if (loading || !firstEmployeesLoadDone.current) return;
    setTab(initialTab === "pending" ? "pending" : "list");
  }, [initialTab, loading]);

  if (userData?.role !== "employer") {
    return (
      <View style={styles.container}>
        <Header
          title="Empregados"
          subtitle="Acesso exclusivo do empregador"
          showBack
          onBack={onBack}
        />
        <View style={styles.emptyState}>
          <Ionicons name="lock-closed-outline" size={56} color={Colors.gray400} />
          <Text style={styles.emptyTitle}>Sem permissão</Text>
          <Text style={styles.emptySubtitle}>
            Apenas contas de empregador podem gerenciar funcionários.
          </Text>
        </View>
      </View>
    );
  }

  const renderEmployee = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, Shadows.medium]}
      activeOpacity={0.7}
      onPress={() => {
        Alert.alert("Ações do funcionário", undefined, [
          {
            text: "Editar dados",
            onPress: () => onOpenEmployee?.(item, { mode: "editEmployee" }),
          },
          {
            text: "Atribuir tarefa",
            onPress: () => onOpenEmployee?.(item, { mode: "assignTask" }),
          },
          { text: "Cancelar", style: "cancel" },
        ]);
      }}
    >
      <View style={styles.cardHeader}>
        <EmployeeAvatar
          name={item.name}
          photoUrl={item.photoUrl}
          photoBase64={item.photoBase64}
        />
        <View style={styles.employeeInfo}>
          <Text style={styles.employeeName}>{item.name}</Text>
          <Text style={styles.employeeRole}>{item.role || "Funcionário"}</Text>
          {!!item.email && <Text style={styles.employeeEmail}>{item.email}</Text>}
          {isEmployeePendingApproval(item) && item.registrationSource === "self" ? (
            <Text style={styles.selfRegisterHint}>Pediu vínculo informando seu e-mail</Text>
          ) : null}
        </View>
        <View style={styles.cardHeaderRight}>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  item.status === "active"
                    ? Colors.successSoft
                    : item.status === "pending"
                      ? Colors.warningSoft
                      : Colors.gray100,
              },
            ]}
          >
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor:
                  item.status === "active"
                    ? Colors.success
                    : item.status === "pending"
                      ? Colors.warning
                      : Colors.gray400,
              },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              {
                color:
                  item.status === "active"
                    ? Colors.success
                    : item.status === "pending"
                      ? Colors.warning
                      : Colors.gray500,
              },
            ]}
          >
            {item.status === "active"
              ? "Ativo"
              : item.status === "pending"
                ? "Pendente"
                : "Inativo"}
          </Text>
          </View>
          <Ionicons name="ellipsis-horizontal" size={20} color={Colors.gray400} />
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            R${" "}
            {(item.salary || 0).toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
            })}
          </Text>
          <Text style={styles.statLabel}>Salário</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{item.hoursThisMonth || 0}h</Text>
          <Text style={styles.statLabel}>Horas/mês</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: Colors.orange }]}>
            {item.overtimeThisMonth || 0}h
          </Text>
          <Text style={styles.statLabel}>Extras</Text>
        </View>
      </View>

      <View style={styles.checklistMiniRow}>
        <View style={[styles.checklistPill, { backgroundColor: Colors.gray50, borderColor: Colors.gray100 }]}>
          <Text style={[styles.checklistPillValue, { color: Colors.gray500 }]}>{checklistCountsByEmployeeId[item.id]?.notStarted || 0}</Text>
          <Text style={styles.checklistPillLabel}>Não</Text>
        </View>
        <View style={[styles.checklistPill, { backgroundColor: Colors.orangeSoft, borderColor: Colors.orangeSoft }]}>
          <Text style={[styles.checklistPillValue, { color: Colors.orange }]}>{checklistCountsByEmployeeId[item.id]?.inProgress || 0}</Text>
          <Text style={[styles.checklistPillLabel, { color: Colors.orangeDark }]}>Em</Text>
        </View>
        <View style={[styles.checklistPill, { backgroundColor: Colors.successSoft, borderColor: Colors.successSoft }]}>
          <Text style={[styles.checklistPillValue, { color: Colors.success }]}>{checklistCountsByEmployeeId[item.id]?.completed || 0}</Text>
          <Text style={styles.checklistPillLabel}>Feito</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.cardFooterText}>Ver registros individuais</Text>
        <Ionicons name="chevron-forward" size={16} color={Colors.gray400} />
      </View>
      {isEmployeePendingApproval(item) && (
        <View style={styles.pendingActions}>
          <TouchableOpacity
            style={[styles.pendingBtn, styles.pendingApprove]}
            disabled={reviewingId === item.id}
            onPress={async () => {
              setReviewingId(item.id);
              const result = await updateEmployeeApproval(item.id, true);
              setReviewingId("");
              if (!result.success) {
                Alert.alert("Erro", result.error || "Não foi possível aprovar vínculo.");
                return;
              }
              await loadEmployees();
            }}
          >
            <Text style={styles.pendingApproveText}>
              {reviewingId === item.id ? "Aprovando..." : "Aprovar vínculo"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.pendingBtn, styles.pendingReject]}
            disabled={reviewingId === item.id}
            onPress={async () => {
              setReviewingId(item.id);
              const result = await updateEmployeeApproval(item.id, false);
              setReviewingId("");
              if (!result.success) {
                Alert.alert("Erro", result.error || "Não foi possível rejeitar vínculo.");
                return;
              }
              await loadEmployees();
            }}
          >
            <Text style={styles.pendingRejectText}>Rejeitar</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header
        title="Empregados"
        subtitle={
          pendingCount > 0
            ? `${pendingCount} pedido(s) aguardando aprovação na aba Pendentes`
            : "Gerenciar funcionários e autorizar vínculos"
        }
        showBack
        onBack={onBack}
      />

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === "list" && styles.tabBtnActive]}
          onPress={() => setTab("list")}
        >
          <Text style={[styles.tabText, tab === "list" && styles.tabTextActive]}>
            Funcionários
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === "pending" && styles.tabBtnActive]}
          onPress={() => setTab("pending")}
        >
          <Text style={[styles.tabText, tab === "pending" && styles.tabTextActive]}>
            Pendentes {pendingCount > 0 ? `(${pendingCount})` : ""}
          </Text>
        </TouchableOpacity>
      </View>

      {tab === "list" && (
        <FlatList
          data={activeEmployees}
          renderItem={renderEmployee}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            !loading && !error ? (
              <Text style={styles.listHeader}>
                {activeEmployees.length}{" "}
                {activeEmployees.length === 1 ? "funcionário ativo" : "funcionários ativos"}
              </Text>
            ) : null
          }
          ListEmptyComponent={
            loading ? (
              <ScreenState type="loading" title="Carregando equipe..." />
            ) : error ? (
              <ScreenState
                type="error"
                icon="alert-circle-outline"
                title="Erro ao buscar equipe"
                subtitle={error}
                actionLabel="Tentar novamente"
                onAction={loadEmployees}
              />
            ) : (
              <ScreenState
                icon="people-outline"
                title="Nenhum empregado"
                subtitle="Nenhum funcionário encontrado para esta conta."
              />
            )
          }
        />
      )}
      {tab === "pending" && (
        <FlatList
          data={pendingEmployees}
          renderItem={renderEmployee}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            !loading && !error ? (
              <View style={styles.pendingHeaderBlock}>
                <Text style={styles.listHeader}>
                  {pendingCount}{" "}
                  {pendingCount === 1 ? "solicitação pendente" : "solicitações pendentes"}
                </Text>
                <Text style={styles.pendingExplain}>
                  Quem se cadastrou como funcionário e informou seu e-mail como empregador aparece aqui.
                  Ao aprovar, o cadastro na equipe é concluído com nome e foto do perfil.
                </Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            loading ? (
              <ScreenState type="loading" title="Carregando solicitações..." />
            ) : error ? (
              <ScreenState
                type="error"
                icon="alert-circle-outline"
                title="Erro ao buscar solicitações"
                subtitle={error}
                actionLabel="Tentar novamente"
                onAction={loadEmployees}
              />
            ) : (
              <ScreenState
                icon="checkmark-done-outline"
                title="Sem pendências"
                subtitle="Quando alguém criar conta como funcionário usando seu e-mail de empregador, o pedido aparecerá aqui."
              />
            )
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  tabRow: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gray100,
    padding: 4,
    flexDirection: "row",
    gap: 6,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
  },
  tabBtnActive: { backgroundColor: Colors.orange },
  tabText: { color: Colors.textSecondary, fontWeight: "600" },
  tabTextActive: { color: Colors.white },
  listHeader: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  pendingHeaderBlock: { marginBottom: 8 },
  pendingExplain: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 6,
  },
  selfRegisterHint: {
    fontSize: 11,
    color: Colors.teal,
    fontWeight: "600",
    marginTop: 4,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  cardHeaderRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.white,
  },
  employeeInfo: { flex: 1, marginLeft: 14 },
  employeeName: { fontSize: 16, fontWeight: "700", color: Colors.textPrimary },
  employeeRole: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  employeeEmail: { fontSize: 11, color: Colors.textLight, marginTop: 2 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 6,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: "600" },
  statsRow: {
    flexDirection: "row",
    backgroundColor: Colors.gray50,
    borderRadius: 14,
    padding: 14,
  },
  stat: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 16, fontWeight: "700", color: Colors.textPrimary },
  statLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 4 },
  statDivider: {
    width: 1,
    backgroundColor: Colors.gray200,
    marginVertical: 4,
  },
  cardFooter: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardFooterText: { fontSize: 12, color: Colors.textSecondary, fontWeight: "600" },
  pendingActions: {
    marginTop: 10,
    flexDirection: "row",
    gap: 8,
  },
  pendingBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
  },
  pendingApprove: { backgroundColor: Colors.successSoft },
  pendingReject: { backgroundColor: Colors.errorSoft },
  pendingApproveText: { color: Colors.success, fontWeight: "700", fontSize: 12 },
  pendingRejectText: { color: Colors.error, fontWeight: "700", fontSize: 12 },

  // Checklist preview (dashboard)
  checklistMiniRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
    marginBottom: 6,
  },
  checklistPill: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  checklistPillValue: { fontSize: 16, fontWeight: "900" },
  checklistPillLabel: { marginTop: 2, fontSize: 11, fontWeight: "700" },
});
