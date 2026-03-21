import { initializeApp } from "firebase/app";
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
  createUserWithEmailAndPassword,
  deleteUser,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  getDocs,
  deleteDoc,
  addDoc,
  query,
  where,
  limit,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";

// 🔥 Credenciais do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyB7EGp7LZmXosM1Bm7UOpK_jyR3NKNSUPg",
  authDomain: "domus-app-b8990.firebaseapp.com",
  projectId: "domus-app-b8990",
  storageBucket: "domus-app-b8990.firebasestorage.app",
  messagingSenderId: "929577094479",
  appId: "1:929577094479:web:85ec058816142eafff893a",
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Auth com persistência
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (error) {
  auth = getAuth(app);
}

// Firestore
const db = getFirestore(app);

// Storage
const storage = getStorage(app);

const toDateValue = (item) => {
  if (item?.localTime) return new Date(item.localTime);
  if (item?.timestamp?.toDate) return item.timestamp.toDate();
  return new Date(0);
};

const sortByDateDesc = (a, b) => toDateValue(b) - toDateValue(a);

// ========== FUNÇÕES DE AUTENTICAÇÃO ==========

// Criar conta
export const registerUser = async (
  email,
  password,
  name,
  role,
  employerEmail = "",
) => {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedEmployerEmail = employerEmail.trim().toLowerCase();
    let employerId = null;
    let approvalStatus = "approved";
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      normalizedEmail,
      password,
    );
    const user = userCredential.user;

    if (role === "employee") {
      if (!normalizedEmployerEmail) {
        await deleteUser(user);
        return { success: false, error: "Informe o email do empregador" };
      }

      const employerQuery = query(
        collection(db, "users"),
        where("role", "==", "employer"),
        where("email", "==", normalizedEmployerEmail),
        limit(1),
      );
      const employerSnapshot = await getDocs(employerQuery);
      if (employerSnapshot.empty) {
        await deleteUser(user);
        return { success: false, error: "Empregador não encontrado" };
      }

      employerId = employerSnapshot.docs[0].id;
      approvalStatus = "pending";
    }

    const baseUserData = {
      name,
      email: normalizedEmail,
      role,
      employerId,
      employerEmail: normalizedEmployerEmail || null,
      approvalStatus,
      plan: "trial",
      createdAt: serverTimestamp(),
    };

    // Salvar dados extras no Firestore
    await setDoc(doc(db, "users", user.uid), baseUserData);

    try {
      await updateProfile(user, { displayName: name });
    } catch {
      /* nome continua no Firestore */
    }

    // Se for empregado, garante cadastro também na lista de funcionários do empregador
    if (role === "employee") {
      const employeeQuery = query(
        collection(db, "employees"),
        where("employerId", "==", employerId),
        where("email", "==", normalizedEmail),
        limit(1),
      );
      const employeeSnapshot = await getDocs(employeeQuery);
      if (employeeSnapshot.empty) {
        await addDoc(collection(db, "employees"), {
          employerId,
          employerEmail: normalizedEmployerEmail,
          userId: user.uid,
          name,
          email: normalizedEmail,
          role: "Funcionário",
          salary: 0,
          status: "pending",
          approvalStatus: "pending",
          registrationSource: "self",
          hoursThisMonth: 0,
          overtimeThisMonth: 0,
          photoUrl: null,
          photoBase64: null,
          createdAt: serverTimestamp(),
        });
      } else {
        // Atualiza o funcionário existente com o userId para vincular registros de ponto
        await updateDoc(employeeSnapshot.docs[0].ref, {
          userId: user.uid,
          approvalStatus: "pending",
          status: "pending",
          registrationSource: "self",
        });
      }
    }

    return { success: true, user };
  } catch (error) {
    let message = "Erro ao criar conta";
    if (error.code === "auth/email-already-in-use")
      message = "Email já cadastrado";
    if (error.code === "auth/weak-password") message = "Senha muito fraca";
    if (error.code === "auth/invalid-email") message = "Email inválido";
    if (error.code === "permission-denied")
      message = "Sem permissão no banco. Verifique regras do Firestore.";
    return { success: false, error: message };
  }
};

// Login
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );
    return { success: true, user: userCredential.user };
  } catch (error) {
    let message = "Erro ao fazer login";
    if (error.code === "auth/user-not-found")
      message = "Usuário não encontrado";
    if (error.code === "auth/wrong-password") message = "Senha incorreta";
    if (error.code === "auth/invalid-email") message = "Email inválido";
    if (error.code === "auth/invalid-credential")
      message = "Email ou senha incorretos";
    if (error.code === "auth/too-many-requests")
      message = "Muitas tentativas. Tente novamente em alguns minutos.";
    return { success: false, error: message };
  }
};

// Logout
export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: "Erro ao sair" };
  }
};

// Observar mudanças de autenticação
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// Buscar dados do usuário
export const getUserData = async (uid) => {
  try {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { success: true, data: docSnap.data() };
    }
    return { success: false, error: "Usuário não encontrado" };
  } catch (error) {
    return { success: false, error: "Erro ao buscar dados" };
  }
};

/** Atualiza quando nome/foto/etc. mudam no Firestore (foto aparece sem recarregar o app). */
export const subscribeUserData = (uid, onResult) => {
  const docRef = doc(db, "users", uid);
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) onResult({ success: true, data: snap.data() });
      else onResult({ success: false, error: "Usuário não encontrado" });
    },
    () => {
      onResult({ success: false, error: "Erro ao escutar dados" });
    },
  );
};

/** Converte Blob em base64. Em alguns builds do RN `blob.arrayBuffer` não existe. */
const blobToBase64FromBlob = async (blob) => {
  let buffer;

  if (blob && typeof blob.arrayBuffer === "function") {
    try {
      buffer = await blob.arrayBuffer();
    } catch {
      buffer = null;
    }
  }

  if (!buffer && typeof Response !== "undefined" && blob) {
    try {
      buffer = await new Response(blob).arrayBuffer();
    } catch {
      buffer = null;
    }
  }

  if (buffer && typeof btoa !== "undefined") {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i += 1) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  if (typeof FileReader !== "undefined" && blob) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        if (typeof result === "string") {
          resolve(result.split(",")[1] || "");
        } else {
          resolve("");
        }
      };
      reader.onerror = () => resolve("");
      reader.readAsDataURL(blob);
    });
  }

  return "";
};

// Limite seguro para campo no Firestore (~1MB doc; base64 infla ~33%)
const MAX_BASE64_CHARS = 700000;

// Upload foto de perfil (usa Firestore como fallback quando Storage não está disponível)
export const uploadProfilePhoto = async (uid, imageUri) => {
  try {
    // fetch(uri) funciona com file:// no Expo/RN; XMLHttpRequest costuma falhar.
    const response = await fetch(imageUri);
    if (!response.ok) {
      return {
        success: false,
        error: "Não foi possível abrir a imagem. Tente outra foto.",
      };
    }
    const blob = await response.blob();
    if (!blob || blob.size === 0) {
      return { success: false, error: "Imagem inválida ou vazia." };
    }

    try {
      const ext =
        imageUri.split(".").pop()?.split("?")[0]?.toLowerCase() || "jpg";
      const safeExt = ["jpg", "jpeg", "png", "webp"].includes(ext) ? ext : "jpg";
      const storageRef = ref(storage, `profiles/${uid}/photo.${safeExt}`);
      await uploadBytes(storageRef, blob);
      const photoUrl = await getDownloadURL(storageRef);
      await updateDoc(doc(db, "users", uid), {
        photoUrl,
        photoBase64: null,
      });
      await syncEmployeePhoto(uid, { photoUrl, photoBase64: null });
      if (blob.close) blob.close();
      return { success: true, photoUrl };
    } catch (storageError) {
      let base64 = await blobToBase64FromBlob(blob);
      if (blob.close) blob.close();
      if (!base64 && imageUri) {
        try {
          base64 = await FileSystem.readAsStringAsync(imageUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
        } catch {
          /* ignore */
        }
      }
      if (base64 && base64.length <= MAX_BASE64_CHARS) {
        await updateDoc(doc(db, "users", uid), {
          photoBase64: base64,
          photoUrl: null,
        });
        await syncEmployeePhoto(uid, { photoBase64: base64, photoUrl: null });
        return { success: true, photoUrl: `data:image/jpeg;base64,${base64}` };
      }
      return {
        success: false,
        error:
          storageError?.message ||
          "Imagem muito grande para salvar sem o armazenamento em nuvem. Use uma foto menor.",
      };
    }
  } catch (error) {
    return {
      success: false,
      error:
        error?.message ||
        "Erro ao enviar foto. Verifique sua conexão e tente de novo.",
    };
  }
};

// ========== FUNÇÕES DE PONTO ==========

// Registrar ponto
export const registerCheckIn = async (userId, type, location, metadata = {}) => {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.exists() ? userSnap.data() : null;
    if (userData?.role === "employee") {
      if (userData?.approvalStatus === "pending") {
        return {
          success: false,
          error:
            "Seu cadastro ainda não foi aprovado pelo empregador. Aguarde a liberação para utilizar o sistema.",
        };
      }
      if (userData?.approvalStatus === "rejected") {
        return {
          success: false,
          error:
            "Seu vínculo com o empregador foi recusado. Entre em contato com o empregador ou crie nova solicitação.",
        };
      }
      if (!userData?.employerId) {
        return {
          success: false,
          error:
            "Não há empregador vinculado à sua conta. Peça ao empregador para aprovar seu cadastro.",
        };
      }
    }

    const checkInData = {
      userId,
      type, // 'entrada' ou 'saida'
      employerId: metadata.employerId || null,
      employeeName: metadata.employeeName || null,
      timestamp: serverTimestamp(),
      localTime: new Date().toISOString(),
      latitude: location?.latitude || null,
      longitude: location?.longitude || null,
    };

    const docRef = await addDoc(collection(db, "checkins"), checkInData);
    return { success: true, id: docRef.id };
  } catch (error) {
    if (error.code === "permission-denied") {
      return {
        success: false,
        error:
          "Sem permissão para registrar o ponto. Verifique se seu vínculo com o empregador está ativo.",
      };
    }
    return {
      success: false,
      error: error.message || "Erro ao registrar ponto",
    };
  }
};

// Buscar pontos do usuário
export const getCheckIns = async (userId) => {
  try {
    const q = query(collection(db, "checkins"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    const checkins = [];
    querySnapshot.forEach((doc) => {
      checkins.push({ id: doc.id, ...doc.data() });
    });
    checkins.sort(sortByDateDesc);
    return { success: true, data: checkins };
  } catch (error) {
    if (error.code === "permission-denied") {
      return { success: false, error: "Sem permissão para ver os registros" };
    }
    return { success: false, error: "Erro ao buscar pontos" };
  }
};

// Buscar último ponto do usuário
export const getLastCheckIn = async (userId) => {
  try {
    const q = query(collection(db, "checkins"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return { success: true, data: null };
    }
    const data = querySnapshot.docs
      .map((item) => ({ id: item.id, ...item.data() }))
      .sort(sortByDateDesc);
    return { success: true, data: data[0] || null };
  } catch (error) {
    return { success: false, error: "Erro ao buscar último ponto" };
  }
};

// ========== LOCAL DE TRABALHO (empregador) ==========

export const saveWorkLocation = async (employerId, data) => {
  try {
    const docRef = doc(db, "users", employerId);
    await setDoc(
      docRef,
      {
        workLocation: {
          lat: data.lat,
          lng: data.lng,
          address: data.address || null,
          radius: data.radius ?? 100,
          updatedAt: serverTimestamp(),
        },
      },
      { merge: true },
    );
    return { success: true };
  } catch (error) {
    return { success: false, error: "Erro ao salvar local de trabalho" };
  }
};

export const getWorkLocation = async (employerId) => {
  try {
    const docRef = doc(db, "users", employerId);
    const docSnap = await getDoc(docRef);
    const data = docSnap.data();
    return { success: true, data: data?.workLocation || null };
  } catch (error) {
    return { success: false, error: "Erro ao buscar local de trabalho" };
  }
};

// Registrar tentativa de ponto fora da área (auditoria)
export const logCheckInAttempt = async (userId, metadata) => {
  try {
    await addDoc(collection(db, "checkinAttempts"), {
      userId,
      ...metadata,
      timestamp: serverTimestamp(),
      localTime: new Date().toISOString(),
    });
    return { success: true };
  } catch (error) {
    return { success: false };
  }
};

// Buscar tentativas fora da área (para o empregador)
export const getCheckInAttempts = async (employerId, limitCount = 20) => {
  try {
    const q = query(
      collection(db, "checkinAttempts"),
      where("employerId", "==", employerId),
      limit(limitCount),
    );
    const snapshot = await getDocs(q);
    const attempts = [];
    snapshot.forEach((d) => attempts.push({ id: d.id, ...d.data() }));
    attempts.sort((a, b) => {
      const da = a.localTime ? new Date(a.localTime) : new Date(0);
      const db = b.localTime ? new Date(b.localTime) : new Date(0);
      return db - da;
    });
    return { success: true, data: attempts };
  } catch (error) {
    return { success: false, data: [], error: error.message };
  }
};

// Buscar pontos de todos os empregados do empregador
export const getEmployerCheckIns = async (employerId) => {
  try {
    const q = query(
      collection(db, "checkins"),
      where("employerId", "==", employerId),
    );
    const querySnapshot = await getDocs(q);
    const checkins = [];
    querySnapshot.forEach((doc) => {
      checkins.push({ id: doc.id, ...doc.data() });
    });
    checkins.sort(sortByDateDesc);
    return { success: true, data: checkins };
  } catch (error) {
    if (error.code === "permission-denied") {
      return { success: false, error: "Sem permissão para ver registros da equipe" };
    }
    return { success: false, error: "Erro ao buscar registros da equipe" };
  }
};

// ========== FUNÇÕES DE EMPREGADOS ==========

// Adicionar empregado
export const addEmployee = async (employerId, employeeData) => {
  try {
    const normalizedEmail = (employeeData.email || "").trim().toLowerCase();
    if (normalizedEmail) {
      const existingQuery = query(
        collection(db, "employees"),
        where("employerId", "==", employerId),
        where("email", "==", normalizedEmail),
        limit(1),
      );
      const existingSnapshot = await getDocs(existingQuery);
      if (!existingSnapshot.empty) {
        return { success: false, error: "Funcionário já cadastrado para este empregador" };
      }
    }

    const data = {
      ...employeeData,
      email: normalizedEmail || null,
      employerId,
      approvalStatus: employeeData.approvalStatus ?? "approved",
      createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, "employees"), data);
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: "Erro ao adicionar empregado" };
  }
};

/** Une perfil do /users com a linha em /employees sem marcar como aprovado por engano. */
const mergeApprovalFromEmployeeAndUser = (employee, linkedData) => {
  const u = linkedData?.approvalStatus;
  const e = employee?.approvalStatus;
  if (u === "pending" || e === "pending") return "pending";
  if (u === "rejected" || e === "rejected") return "rejected";
  if (u === "approved" || e === "approved") return "approved";
  if (employee?.status === "pending") return "pending";
  return "approved";
};

const mergeEmployeeWithLinkedUser = (employee, linkedData, linkedUid) => {
  const approvalStatus = mergeApprovalFromEmployeeAndUser(employee, linkedData);
  return {
    ...employee,
    userId: employee.userId || linkedUid,
    name: employee.name || linkedData.name || "Funcionário",
    email: employee.email || linkedData.email || null,
    photoUrl: linkedData.photoUrl || employee.photoUrl || null,
    photoBase64: linkedData.photoBase64 || employee.photoBase64 || null,
    approvalStatus,
    status:
      approvalStatus === "pending"
        ? "pending"
        : approvalStatus === "rejected"
          ? "inactive"
          : employee.status || "active",
  };
};

/** Pedido de vínculo pendente (cadastro pelo app ou legado só com status). */
export const isEmployeePendingApproval = (item) => {
  if (!item) return false;
  if (item.approvalStatus === "pending") return true;
  if (item.approvalStatus === "approved" || item.approvalStatus === "rejected") return false;
  return item.status === "pending";
};

// Buscar empregados
export const getEmployees = async (employerId) => {
  try {
    const q = query(
      collection(db, "employees"),
      where("employerId", "==", employerId),
    );
    const querySnapshot = await getDocs(q);
    const employees = [];
    querySnapshot.forEach((docSnap) => {
      employees.push({ id: docSnap.id, ...docSnap.data() });
    });

    const enriched = await Promise.all(
      employees.map(async (employee) => {
        try {
          if (employee.userId) {
            const linkedUser = await getDoc(doc(db, "users", employee.userId));
            if (!linkedUser.exists()) return employee;
            return mergeEmployeeWithLinkedUser(employee, linkedUser.data(), linkedUser.id);
          }
          return employee;
        } catch {
          return employee;
        }
      }),
    );
    return { success: true, data: enriched };
  } catch (error) {
    if (error.code === "permission-denied") {
      return {
        success: false,
        error: "Sem permissão para listar a equipe. Verifique o login e as regras do Firestore.",
      };
    }
    return {
      success: false,
      error: error.message || "Erro ao buscar empregados",
    };
  }
};

const syncEmployeePhoto = async (uid, photoData) => {
  try {
    const userSnap = await getDoc(doc(db, "users", uid));
    if (!userSnap.exists()) return;
    const userData = userSnap.data();
    const employeeQueries = [
      query(collection(db, "employees"), where("userId", "==", uid), limit(5)),
    ];
    if (userData?.email) {
      employeeQueries.push(
        query(collection(db, "employees"), where("email", "==", userData.email), limit(5)),
      );
    }

    for (const q of employeeQueries) {
      try {
        const snap = await getDocs(q);
        for (const employeeDoc of snap.docs) {
          try {
            await updateDoc(employeeDoc.ref, photoData);
          } catch {
            /* regras do Firestore podem bloquear; foto já está em users */
          }
        }
      } catch {
        /* query sem permissão ou vazia */
      }
    }
  } catch {
    /* não falha o upload da foto no perfil */
  }
};

export const updateEmployeeApproval = async (employeeId, approved) => {
  try {
    const employeeRef = doc(db, "employees", employeeId);
    const employeeSnap = await getDoc(employeeRef);
    
    if (!employeeSnap.exists()) {
      return { success: false, error: "Funcionário não encontrado" };
    }

    const employeeData = employeeSnap.data();
    const approvalStatus = approved ? "approved" : "rejected";

    // ✅ Buscar dados do usuário vinculado (se existir)
    let linkedUserData = null;
    if (employeeData.userId) {
      const userSnap = await getDoc(doc(db, "users", employeeData.userId));
      if (userSnap.exists()) {
        linkedUserData = userSnap.data();
      }
    }

    // ✅ Objeto base - SEM campos undefined
    const employeeUpdate = {
      approvalStatus,
      status: approved ? "active" : "inactive",
      reviewedAt: serverTimestamp(),
    };

    // ✅ Adicionar campos SOMENTE se forem definidos (não undefined)
    if (approved && linkedUserData) {
      // Nome
      const name = linkedUserData.name || employeeData.name;
      if (name !== undefined && name !== null) {
        employeeUpdate.name = name;
      }

      // Email
      const email = linkedUserData.email || employeeData.email;
      if (email !== undefined && email !== null) {
        employeeUpdate.email = email;
      }

      // Foto URL (pode ser null, mas NÃO undefined)
      employeeUpdate.photoUrl = 
        linkedUserData.photoUrl ?? employeeData.photoUrl ?? null;

      // Foto Base64 (pode ser null, mas NÃO undefined)
      employeeUpdate.photoBase64 = 
        linkedUserData.photoBase64 ?? employeeData.photoBase64 ?? null;

      // Role (sempre tem fallback)
      employeeUpdate.role = employeeData.role || "Funcionário";
    }

    // ✅ PROTEÇÃO FINAL: Remove qualquer campo undefined
    Object.keys(employeeUpdate).forEach((key) => {
      if (employeeUpdate[key] === undefined) {
        delete employeeUpdate[key];
      }
    });

    // ✅ Atualizar documento do funcionário
    await updateDoc(employeeRef, employeeUpdate);

    // ✅ Atualizar documento do usuário (se existir vínculo)
    if (employeeData.userId) {
      const userUpdate = {
        approvalStatus,
        employerId: approved ? (employeeData.employerId || null) : null,
        employerEmail: approved ? (employeeData.employerEmail || null) : null,
      };

      // ✅ Mesma proteção contra undefined
      Object.keys(userUpdate).forEach((key) => {
        if (userUpdate[key] === undefined) {
          delete userUpdate[key];
        }
      });

      await updateDoc(doc(db, "users", employeeData.userId), userUpdate);
    }

    return { success: true };
  } catch (error) {
    // ✅ Log detalhado para debug
    console.error("❌ Erro ao aprovar vínculo:", {
      code: error.code,
      message: error.message,
      employeeId,
      approved,
    });

    return { 
      success: false, 
      error: error.message || "Erro ao atualizar aprovação do funcionário" 
    };
  }
};

/**
 * Atualiza dados básicos do funcionário (cargo/função + salário).
 * Usado pela área do empregador.
 */
export const updateEmployeeRoleAndSalary = async (employeeId, { role, salary }) => {
  try {
    if (!employeeId) return { success: false, error: "employeeId obrigatório" };

    const nextRole = (role || "").trim();
    const nextSalary = Number(salary);

    const employeeUpdate = {};
    if (nextRole) employeeUpdate.role = nextRole;
    employeeUpdate.salary = Number.isFinite(nextSalary) ? nextSalary : 0;

    await updateDoc(doc(db, "employees", employeeId), employeeUpdate);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error?.message || "Erro ao atualizar funcionário",
    };
  }
};

// ========== CHECKLIST (Tarefas por funcionário) ==========

const checklistTaskStatusFromDoc = (task) => {
  if (!task) return "not_started";
  if (task.completedAt) return "completed";
  if (task.startedAt) return "in_progress";
  return "not_started";
};

/**
 * Atualiza `startedAt` para tarefas ainda não iniciadas.
 * Usado para diferenciar "não iniciado" vs "em andamento".
 */
export const markChecklistTasksStarted = async (taskIds) => {
  try {
    const ids = (taskIds || []).filter(Boolean);
    if (ids.length === 0) return { success: true, updated: 0 };

    await Promise.all(
      ids.map(async (taskId) => {
        await updateDoc(doc(db, "checklistTasks", taskId), {
          startedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }),
    );

    return { success: true, updated: ids.length };
  } catch (error) {
    return {
      success: false,
      error: error?.message || "Erro ao iniciar tarefas do checklist",
    };
  }
};

/**
 * Marca uma tarefa como concluída (somente concluído; sem desmarcar).
 */
export const completeChecklistTask = async (taskId) => {
  try {
    if (!taskId) return { success: false, error: "Tarefa inválida" };
    await updateDoc(doc(db, "checklistTasks", taskId), {
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error?.message || "Erro ao concluir tarefa",
    };
  }
};

/**
 * Cria uma tarefa no checklist para um funcionário.
 * Campos de status ficam nulos até o funcionário "iniciar" e "concluir".
 */
export const addChecklistTask = async ({
  employerId,
  employeeId,
  employeeUserId,
  description,
}) => {
  try {
    if (!employerId) return { success: false, error: "employerId obrigatório" };
    if (!employeeId) return { success: false, error: "employeeId obrigatório" };
    if (!employeeUserId)
      return { success: false, error: "Este funcionário não está vinculado à conta" };
    const desc = (description || "").trim();
    if (!desc) return { success: false, error: "Informe a descrição da tarefa" };

    const docRef = await addDoc(collection(db, "checklistTasks"), {
      employerId,
      employeeId,
      employeeUserId,
      description: desc,
      startedAt: null,
      completedAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { success: true, id: docRef.id };
  } catch (error) {
    return {
      success: false,
      error: error?.message || "Erro ao criar tarefa",
    };
  }
};

/**
 * Edita apenas a descrição da tarefa (não mexe em startedAt/completedAt).
 */
export const updateChecklistTaskDescription = async ({ taskId, description }) => {
  try {
    if (!taskId) return { success: false, error: "taskId obrigatório" };
    const desc = (description || "").trim();
    if (!desc) return { success: false, error: "Informe a descrição" };

    await updateDoc(doc(db, "checklistTasks", taskId), {
      description: desc,
      updatedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error?.message || "Erro ao atualizar descrição",
    };
  }
};

export const deleteChecklistTask = async ({ taskId }) => {
  try {
    if (!taskId) return { success: false, error: "taskId obrigatório" };
    await deleteDoc(doc(db, "checklistTasks", taskId));
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error?.message || "Erro ao remover tarefa",
    };
  }
};

/**
 * Listener em tempo real do checklist para o funcionário.
 */
export const subscribeEmployeeChecklistTasks = (employeeUserId, onResult) => {
  if (!employeeUserId) {
    onResult({ success: false, error: "employeeUserId ausente" });
    return () => {};
  }

  const q = query(
    collection(db, "checklistTasks"),
    where("employeeUserId", "==", employeeUserId),
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const tasks = [];
      snapshot.forEach((docSnap) => {
        tasks.push({ id: docSnap.id, ...docSnap.data() });
      });

      // Ordena: não iniciadas -> em andamento -> concluídas (mantendo ordem por createdAt quando disponível)
      tasks.sort((a, b) => {
        const sa = checklistTaskStatusFromDoc(a);
        const sb = checklistTaskStatusFromDoc(b);
        const rank = { not_started: 0, in_progress: 1, completed: 2 };
        const d = rank[sa] - rank[sb];
        if (d !== 0) return d;
        const ca = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const cb = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return cb - ca;
      });

      onResult({ success: true, data: tasks });
    },
    (error) => {
      onResult({ success: false, error: error?.message || "Erro ao acompanhar checklist" });
    },
  );
};

/**
 * Listener em tempo real do checklist para o empregador (todas tarefas do empregador).
 */
export const subscribeEmployerChecklistTasks = (employerId, onResult) => {
  if (!employerId) {
    onResult({ success: false, error: "employerId ausente" });
    return () => {};
  }

  const q = query(collection(db, "checklistTasks"), where("employerId", "==", employerId));
  return onSnapshot(
    q,
    (snapshot) => {
      const tasks = [];
      snapshot.forEach((docSnap) => {
        tasks.push({ id: docSnap.id, ...docSnap.data() });
      });
      onResult({ success: true, data: tasks });
    },
    (error) => {
      onResult({ success: false, error: error?.message || "Erro ao acompanhar checklist" });
    },
  );
};

/**
 * Listener em tempo real do checklist de 1 funcionário específico (por employeeId).
 */
export const subscribeChecklistTasksByEmployeeId = (employeeId, onResult) => {
  if (!employeeId) {
    onResult({ success: false, error: "employeeId ausente" });
    return () => {};
  }

  const q = query(collection(db, "checklistTasks"), where("employeeId", "==", employeeId));
  return onSnapshot(
    q,
    (snapshot) => {
      const tasks = [];
      snapshot.forEach((docSnap) => {
        tasks.push({ id: docSnap.id, ...docSnap.data() });
      });
      onResult({ success: true, data: tasks });
    },
    (error) => {
      onResult({ success: false, error: error?.message || "Erro ao acompanhar checklist" });
    },
  );
};

export { auth, db };
