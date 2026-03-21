import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import Card from "../../components/Card";
import SectionCard from "../../components/SectionCard";
import ScreenState from "../../components/ScreenState";
import UserAvatar from "../../components/UserAvatar";
import { Colors, Radius, Shadows, Spacing } from "../../theme/colors";
import { useAuth } from "../../contexts/AuthContext";
import {
  completeChecklistTask,
  markChecklistTasksStarted,
  subscribeEmployeeChecklistTasks,
  subscribeEmployerChecklistTasks,
  uploadProfilePhoto,
} from "../../config/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { notifyTaskCompleted } from "../../utils/notifications";
import { registerPushToken } from "../../utils/pushRegistration";

const { width } = Dimensions.get("window");

export default function HomeScreen({ onGoTo, onOpenProfile }) {
  const { user, userData, refreshUserData } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const isEmployer = userData?.role === "employer";
  const canViewChecklist = userData?.role === "employee" && userData?.approvalStatus === "approved";
  const fallbackName = user?.displayName || user?.email?.split("@")[0] || "Usuário";
  const firstName = userData?.name?.trim()?.split(" ")[0] || fallbackName;

  // Checklist (somente funcionário)
  const [checklistTasks, setChecklistTasks] = useState([]);
  const [checklistLoading, setChecklistLoading] = useState(false);
  const [checklistError, setChecklistError] = useState("");
  const startTasksInFlightRef = useRef(false);
  const [completingTaskId, setCompletingTaskId] = useState("");

  const [checklistView, setChecklistView] = useState("active"); // "active" | "history"

  // Notificação in-app para o empregador (mostra ao abrir o app).
  const [employerNotif, setEmployerNotif] = useState(null);
  const employerLastCompletedAtRef = useRef(0);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Registra token de push (para notificações via backend).
  useEffect(() => {
    if (!user?.uid) return;
    registerPushToken(user.uid).catch(() => {});
  }, [user?.uid]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  };

  const fmtTime = (d) =>
    d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const fmtDate = (d) =>
    d.toLocaleDateString("pt-BR", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    });

  const pickImage = async () => {
    if (!user?.uid) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permissão", "É necessário permitir acesso às fotos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.4,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;

    setUploadingPhoto(true);
    try {
      const rawUri = result.assets[0].uri;
      // Reduz tamanho antes do upload (evita falha no Storage/Firestore no celular)
      const optimized = await ImageManipulator.manipulateAsync(
        rawUri,
        [{ resize: { width: 800 } }],
        {
          compress: 0.65,
          format: ImageManipulator.SaveFormat.JPEG,
        },
      );
      const res = await uploadProfilePhoto(user.uid, optimized.uri);
      if (res.success) {
        await refreshUserData();
      } else {
        Alert.alert(
          "Foto não salva",
          res.error ||
            "Não foi possível salvar a foto. Tente outra imagem ou verifique a conexão.",
          [{ text: "Entendi" }],
        );
      }
    } catch (e) {
      Alert.alert(
        "Foto não salva",
        e?.message ||
          "Não foi possível processar a imagem. Tente outra foto.",
        [{ text: "Entendi" }],
      );
    } finally {
      setUploadingPhoto(false);
    }
  };

  const checklistCounts = useMemo(() => {
    let completed = 0;
    let inProgress = 0;
    let notStarted = 0;
    for (const t of checklistTasks || []) {
      if (t?.completedAt) completed += 1;
      else if (t?.startedAt) inProgress += 1;
      else notStarted += 1;
    }
    return { completed, inProgress, notStarted, total: checklistTasks.length || 0 };
  }, [checklistTasks]);

  const isHistory = checklistView === "history";

  // Lista: pendentes no modo "active" e concluídas no modo "history".
  const visibleChecklistTasks = useMemo(() => {
    const tasks = checklistTasks || [];
    return tasks.filter((t) => (isHistory ? !!t?.completedAt : !t?.completedAt));
  }, [checklistTasks, isHistory]);

  // Busca/assinatura em tempo real das tarefas do funcionário
  useEffect(() => {
    if (isEmployer || !user?.uid || !canViewChecklist) return;

    setChecklistLoading(true);
    setChecklistError("");
    const unsubscribe = subscribeEmployeeChecklistTasks(user.uid, (result) => {
      if (!result?.success) {
        setChecklistTasks([]);
        setChecklistError(result?.error || "Erro ao carregar checklist");
        setChecklistLoading(false);
        return;
      }
      setChecklistTasks(result?.data || []);
      setChecklistError("");
      setChecklistLoading(false);
    });

    return () => unsubscribe?.();
  }, [isEmployer, user?.uid, canViewChecklist]);

  // Inicia automaticamente tarefas "não iniciadas" quando o funcionário abre o app/tela
  useEffect(() => {
    if (isEmployer) return;
    if (checklistLoading) return;
    if (startTasksInFlightRef.current) return;

    const toStart = (checklistTasks || [])
      .filter((t) => !t?.completedAt && !t?.startedAt)
      .map((t) => t.id);

    if (toStart.length === 0) return;

    startTasksInFlightRef.current = true;
    markChecklistTasksStarted(toStart)
      .catch(() => {
        // Se falhar, o usuário ainda verá as tarefas como "não iniciadas" até nova tentativa.
      })
      .finally(() => {
        startTasksInFlightRef.current = false;
      });
  }, [checklistTasks, checklistLoading, isEmployer]);

  // Empregador: mostra no app quando houver tarefa concluída desde o último acesso.
  useEffect(() => {
    if (!isEmployer || !user?.uid) return;

    const storageKey = `domus:lastChecklistCompletedAt:${user.uid}`;
    let unsub = null;
    let cancelled = false;

    (async () => {
      try {
        const stored = await AsyncStorage.getItem(storageKey);
        if (cancelled) return;
        employerLastCompletedAtRef.current = stored ? Number(stored) || 0 : 0;
      } catch {
        employerLastCompletedAtRef.current = 0;
      }

      unsub = subscribeEmployerChecklistTasks(user.uid, (result) => {
        if (cancelled) return;
        if (!result?.success) return;

        const tasks = result.data || [];
        const completed = tasks
          .filter((t) => t?.completedAt?.toDate)
          .map((t) => ({ ...t, completedAtMs: t.completedAt.toDate().getTime() }))
          .sort((a, b) => b.completedAtMs - a.completedAtMs);

        const latest = completed[0];
        if (!latest) return;

        const lastSeen = employerLastCompletedAtRef.current;
        if (latest.completedAtMs > lastSeen) {
          employerLastCompletedAtRef.current = latest.completedAtMs;
          setEmployerNotif({
            id: latest.id,
            title: "Tarefa concluída",
            body: latest.description || "Uma tarefa foi concluída.",
          });
          AsyncStorage.setItem(storageKey, String(latest.completedAtMs)).catch(() => {});
        }
      });
    })();

    return () => {
      cancelled = true;
      unsub?.();
    };
  }, [isEmployer, user?.uid]);

  const handleCompleteTask = async (task) => {
    const taskId = typeof task === "string" ? task : task?.id;
    if (!taskId || completingTaskId === taskId) return;

    setCompletingTaskId(taskId);
    const result = await completeChecklistTask(taskId);
    setCompletingTaskId("");

    if (!result?.success) {
      Alert.alert("Erro", result?.error || "Não foi possível concluir a tarefa.");
      return;
    }

    // Notificação local somente após a conclusão bem-sucedida.
    notifyTaskCompleted({
      title: "Tarefa concluída",
      body: task?.description ? `“${task.description}”` : "Uma tarefa foi concluída.",
    }).catch(() => {});
  };

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={Colors.gradientBackground} style={{ flex: 1 }}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            {/* Header: foto + saudação */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.avatarWrap}
                onPress={pickImage}
                disabled={uploadingPhoto}
              >
                {uploadingPhoto ? (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <ActivityIndicator size="small" color={Colors.orange} />
                  </View>
                ) : (
                  <UserAvatar
                    userData={userData}
                    name={firstName}
                    size={52}
                    borderRadius={26}
                    gradientColors={Colors.gradientOrange}
                  />
                )}
                <View style={styles.avatarEditBadge}>
                  <Ionicons name="camera" size={12} color="#FFF" />
                </View>
              </TouchableOpacity>
              <View style={styles.headerText}>
                <Text style={styles.greeting}>{greeting()}</Text>
                <Text style={styles.userName}>{firstName}</Text>
              </View>
              <View style={styles.headerActions}>
                {typeof onOpenProfile === "function" ? (
                  <TouchableOpacity
                    onPress={onOpenProfile}
                    style={styles.headerBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Perfil e configurações"
                  >
                    <Ionicons
                      name="person-outline"
                      size={18}
                      color={Colors.textSecondary}
                    />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            {/* Relógio (sem botões duplicados) */}
            <View style={[styles.clockCard, Shadows.medium]}>
              <Text style={styles.clockDate}>{fmtDate(currentTime)}</Text>
              <Text style={styles.clockTime}>{fmtTime(currentTime)}</Text>
            </View>

            {isEmployer && employerNotif && (
              <SectionCard title="Notificações">
                <View style={styles.notifCard}>
                  <View style={styles.notifIconBox}>
                    <Ionicons name="checkmark-circle-outline" size={20} color={Colors.success} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.notifTitle}>{employerNotif.title}</Text>
                    <Text style={styles.notifBody} numberOfLines={3}>
                      {employerNotif.body}
                    </Text>
                  </View>
                </View>
              </SectionCard>
            )}

            {/* Checklist (funcionário) */}
            {!isEmployer && (
              <SectionCard title="Checklist">
                {!canViewChecklist ? (
                  <ScreenState
                    type="error"
                    icon="lock-closed-outline"
                    title="Acesso ao checklist"
                    subtitle="Aguardando aprovação do empregador."
                  />
                ) : (
                  <>
                    <View style={styles.checklistViewToggleRow}>
                      <TouchableOpacity
                        style={[
                          styles.checklistToggleBtn,
                          checklistView === "active" && styles.checklistToggleBtnActive,
                        ]}
                        onPress={() => setChecklistView("active")}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.checklistToggleBtnText}>
                          Pendentes
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.checklistToggleBtn,
                          checklistView === "history" && styles.checklistToggleBtnActive,
                        ]}
                        onPress={() => setChecklistView("history")}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.checklistToggleBtnText}>
                          Histórico
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {checklistLoading ? (
                      <View style={styles.checklistLoadingWrap}>
                        <ActivityIndicator size="small" color={Colors.orange} />
                        <Text style={styles.checklistLoadingText}>Carregando tarefas...</Text>
                      </View>
                    ) : checklistError ? (
                      <ScreenState
                        type="error"
                        icon="alert-circle-outline"
                        title="Falha ao carregar"
                        subtitle={checklistError}
                      />
                    ) : checklistTasks.length === 0 ? (
                      <View style={styles.checklistEmptyWrap}>
                        <Ionicons name="checkmark-done-outline" size={36} color={Colors.gray400} />
                        <Text style={styles.checklistEmptyTitle}>Sem tarefas</Text>
                        <Text style={styles.checklistEmptySubtitle}>
                          O empregador ainda não atribuiu tarefas para você.
                        </Text>
                      </View>
                    ) : visibleChecklistTasks.length === 0 ? (
                      <View style={styles.checklistEmptyWrap}>
                        <Ionicons name="checkmark-done-outline" size={36} color={Colors.gray400} />
                        <Text style={styles.checklistEmptyTitle}>
                          {isHistory ? "Sem histórico" : "Sem pendências"}
                        </Text>
                        <Text style={styles.checklistEmptySubtitle}>
                          {isHistory
                            ? "Você ainda não concluiu tarefas."
                            : "Você já concluiu tudo por aqui."}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.checklistSummaryRow}>
                        <View style={styles.summaryItem}>
                          <Text style={[styles.summaryValue, { color: Colors.success }]}>
                            {checklistCounts.completed}
                          </Text>
                          <Text style={styles.summaryLabel}>Concluído</Text>
                        </View>
                        <View style={styles.summaryDivider} />
                        <View style={styles.summaryItem}>
                          <Text style={[styles.summaryValue, { color: Colors.orange }]}>
                            {checklistCounts.inProgress}
                          </Text>
                          <Text style={styles.summaryLabel}>Em andamento</Text>
                        </View>
                        <View style={styles.summaryDivider} />
                        <View style={styles.summaryItem}>
                          <Text style={[styles.summaryValue, { color: Colors.gray500 }]}>
                            {checklistCounts.notStarted}
                          </Text>
                          <Text style={styles.summaryLabel}>Não iniciado</Text>
                        </View>
                      </View>
                    )}

                    {!!visibleChecklistTasks?.length && !checklistLoading && !checklistError ? (
                      <View style={styles.taskList}>
                        {(visibleChecklistTasks || []).map((t) => {
                          const isCompleted = !!t?.completedAt;
                          const isStarted = !!t?.startedAt;
                          const statusText = isCompleted
                            ? "Concluída"
                            : isStarted
                              ? "Em andamento"
                              : "Não iniciada";
                          const statusColor = isCompleted
                            ? Colors.success
                            : isStarted
                              ? Colors.orange
                              : Colors.gray400;

                          return (
                            <View key={t.id} style={[styles.taskCard, Shadows.small]}>
                              <View style={styles.taskTop}>
                                <Text style={styles.taskDesc} numberOfLines={3}>
                                  {t.description}
                                </Text>
                              </View>

                              <View style={styles.taskBottom}>
                                <View
                                  style={[styles.taskStatusPill, { borderColor: statusColor + "55" }]}
                                >
                                  <Ionicons
                                    name={
                                      isCompleted
                                        ? "checkmark-circle-outline"
                                        : isStarted
                                          ? "play-circle-outline"
                                          : "ellipse-outline"
                                    }
                                    size={16}
                                    color={statusColor}
                                  />
                                  <Text style={[styles.taskStatusText, { color: statusColor }]}>
                                    {statusText}
                                  </Text>
                                </View>

                                {!isCompleted ? (
                                  <TouchableOpacity
                                    style={[
                                      styles.completeBtn,
                                      completingTaskId === t.id && { opacity: 0.65 },
                                    ]}
                                    onPress={() => handleCompleteTask(t)}
                                    disabled={completingTaskId === t.id}
                                    activeOpacity={0.85}
                                  >
                                    <Ionicons name="checkmark" size={18} color={Colors.white} />
                                  </TouchableOpacity>
                                ) : (
                                  <View style={styles.completedBadge}>
                                    <Ionicons name="checkmark-done" size={18} color={Colors.success} />
                                  </View>
                                )}
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    ) : null}
                  </>
                )}
              </SectionCard>
            )}

            {/* Ferramentas */}
            <Text style={styles.sectionTitle}>Ferramentas</Text>
            {isEmployer ? (
              <Card
                icon="location-outline"
                iconColor={Colors.teal}
                title="Local de Trabalho"
                subtitle="Definir onde os funcionários podem bater ponto"
                onPress={() => onGoTo("worklocation")}
              />
            ) : (
              <Card
                icon="time-outline"
                iconColor={Colors.teal}
                title="Banco de Horas"
                subtitle="Saldo diário e horas extras"
                onPress={() => onGoTo("hoursbank")}
              />
            )}

            <View style={{ height: 30 }} />
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  container: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  avatarWrap: { position: "relative" },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  avatarLetter: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFF",
  },
  avatarEditBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.orange,
    justifyContent: "center",
    alignItems: "center",
  },
  headerText: { flex: 1, marginLeft: 14 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  greeting: { fontSize: 13, color: Colors.textSecondary },
  userName: { fontSize: 18, fontWeight: "700", color: Colors.textPrimary },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    backgroundColor: Colors.white,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.small,
    borderWidth: 1,
    borderColor: Colors.gray100,
  },
  clockCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.gray100,
  },
  clockDate: {
    color: Colors.textSecondary,
    fontSize: 13,
    textTransform: "capitalize",
    marginBottom: 2,
  },
  clockTime: {
    color: Colors.textPrimary,
    fontSize: 42,
    fontWeight: "300",
    letterSpacing: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  actionsRow: { flexDirection: "row", gap: 10, marginBottom: Spacing.lg },
  actionBtn: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.gray100,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  actionLabel: { fontSize: 13, fontWeight: "600", color: Colors.textPrimary },
  statsRow: { flexDirection: "row", gap: 8, marginBottom: Spacing.lg },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.gray100,
  },
  statIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  statValue: { fontSize: 20, fontWeight: "800" },
  statLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  infoBox: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray100,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: { flex: 1, fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },

  // Checklist
  checklistViewToggleRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: Spacing.sm,
  },
  checklistToggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gray100,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  checklistToggleBtnActive: {
    borderColor: Colors.orange,
    backgroundColor: Colors.orange + "10",
  },
  checklistToggleBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  checklistToggleBtnActiveText: {
    color: Colors.orange,
  },
  checklistLoadingWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  checklistLoadingText: { fontSize: 12, color: Colors.textSecondary, fontWeight: "600" },
  checklistEmptyWrap: { paddingVertical: 6, alignItems: "center" },
  checklistEmptyTitle: { marginTop: 8, fontSize: 14, fontWeight: "800", color: Colors.textPrimary },
  checklistEmptySubtitle: { marginTop: 4, fontSize: 12, color: Colors.textSecondary, textAlign: "center", lineHeight: 18 },
  checklistSummaryRow: { flexDirection: "row", marginBottom: Spacing.sm, gap: 8, alignItems: "center" },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryDivider: { width: 1, height: 28, backgroundColor: Colors.gray100 },
  summaryValue: { fontSize: 18, fontWeight: "900" },
  summaryLabel: { marginTop: 2, fontSize: 11, color: Colors.textSecondary, textAlign: "center" },
  taskList: { gap: 10 },
  taskCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.gray100,
    padding: Spacing.sm,
  },
  taskTop: { marginBottom: Spacing.xs },
  taskDesc: { fontSize: 13, fontWeight: "700", color: Colors.textPrimary },
  taskBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
  taskStatusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  taskStatusText: { fontSize: 12, fontWeight: "800" },
  completeBtn: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: Colors.teal,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.tealSoft,
  },
  completedBadge: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: Colors.successSoft,
    justifyContent: "center",
    alignItems: "center",
  },
  notifCard: { flexDirection: "row", alignItems: "center", gap: 10 },
  notifIconBox: {
    width: 38,
    height: 38,
    borderRadius: 16,
    backgroundColor: Colors.successSoft,
    borderWidth: 1,
    borderColor: Colors.successSoft,
    justifyContent: "center",
    alignItems: "center",
  },
  notifTitle: { fontSize: 14, fontWeight: "900", color: Colors.textPrimary },
  notifBody: { marginTop: 4, fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },
});
