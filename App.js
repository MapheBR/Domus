import React, { useState, useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { AuthProvider, useAuth } from "./src/contexts/AuthContext";
import { Colors } from "./src/theme/colors";

// Screens
import WelcomeScreen from "./src/screens/auth/WelcomeScreen";
import LoginScreen from "./src/screens/auth/LoginScreen";
import RegisterScreen from "./src/screens/auth/RegisterScreen";
import HomeScreen from "./src/screens/main/HomeScreen";
import CalculatorScreen from "./src/screens/main/CalculatorScreen";
import PlansScreen from "./src/screens/main/PlansScreen";
import CheckInScreen from "./src/screens/main/CheckInScreen";

function AppContent() {
  const { user, loading, logout } = useAuth();
  const [screen, setScreen] = useState("welcome");

  // Se ainda está carregando, mostra loading
  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.orange} />
      </View>
    );
  }

  // Se está logado
  if (user) {
    if (screen === "calculator") {
      return <CalculatorScreen onBack={() => setScreen("home")} />;
    }
    if (screen === "plans") {
      return <PlansScreen onBack={() => setScreen("home")} />;
    }
    if (screen === "checkin") {
      return <CheckInScreen onBack={() => setScreen("home")} />;
    }
    return <HomeScreen onLogout={logout} onGoTo={(dest) => setScreen(dest)} />;
  }

  // Se não está logado
  if (screen === "login") {
    return (
      <LoginScreen
        onLogin={() => setScreen("home")}
        onGoToRegister={() => setScreen("welcome")}
      />
    );
  }

  if (screen === "register") {
    return (
      <RegisterScreen
        onRegister={() => setScreen("home")}
        onGoToLogin={() => setScreen("login")}
      />
    );
  }

  return (
    <WelcomeScreen
      onGoToLogin={() => setScreen("login")}
      onGoToRegister={() => setScreen("register")}
    />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.white,
  },
});
