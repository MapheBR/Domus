import { initializeApp } from "firebase/app";
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

// ========== FUNÇÕES DE AUTENTICAÇÃO ==========

// Criar conta
export const registerUser = async (email, password, name, role) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    const user = userCredential.user;

    // Salvar dados extras no Firestore
    await setDoc(doc(db, "users", user.uid), {
      name,
      email,
      role,
      plan: "trial",
      createdAt: serverTimestamp(),
    });

    return { success: true, user };
  } catch (error) {
    let message = "Erro ao criar conta";
    if (error.code === "auth/email-already-in-use")
      message = "Email já cadastrado";
    if (error.code === "auth/weak-password") message = "Senha muito fraca";
    if (error.code === "auth/invalid-email") message = "Email inválido";
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

// ========== FUNÇÕES DE PONTO ==========

// Registrar ponto
export const registerCheckIn = async (userId, type, location) => {
  try {
    const checkInData = {
      userId,
      type, // 'entrada' ou 'saida'
      timestamp: serverTimestamp(),
      localTime: new Date().toISOString(),
      latitude: location?.latitude || null,
      longitude: location?.longitude || null,
    };

    const docRef = await addDoc(collection(db, "checkins"), checkInData);
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: "Erro ao registrar ponto" };
  }
};

// Buscar pontos do usuário
export const getCheckIns = async (userId) => {
  try {
    const q = query(
      collection(db, "checkins"),
      where("userId", "==", userId),
      orderBy("timestamp", "desc"),
    );
    const querySnapshot = await getDocs(q);
    const checkins = [];
    querySnapshot.forEach((doc) => {
      checkins.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: checkins };
  } catch (error) {
    return { success: false, error: "Erro ao buscar pontos" };
  }
};

// ========== FUNÇÕES DE EMPREGADOS ==========

// Adicionar empregado
export const addEmployee = async (employerId, employeeData) => {
  try {
    const data = {
      ...employeeData,
      employerId,
      createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, "employees"), data);
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: "Erro ao adicionar empregado" };
  }
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
    querySnapshot.forEach((doc) => {
      employees.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: employees };
  } catch (error) {
    return { success: false, error: "Erro ao buscar empregados" };
  }
};

export { auth, db };
