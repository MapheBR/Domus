import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../contexts/AuthContext";
import { Colors } from "../theme/colors";
import { getEmployees, isEmployeePendingApproval } from "../config/firebase";
import HomeScreen from "../screens/main/HomeScreen";
import CheckInScreen from "../screens/main/CheckInScreen";
import EmployeesScreen from "../screens/main/EmployeesScreen";
import EmployeeDetailScreen from "../screens/main/EmployeeDetailScreen";
import RecordsScreen from "../screens/main/RecordsScreen";
import ReportsScreen from "../screens/main/ReportsScreen";
import HoursBankScreen from "../screens/main/HoursBankScreen";
import CalculatorScreen from "../screens/main/CalculatorScreen";
import WorkLocationScreen from "../screens/main/WorkLocationScreen";
import ProfileScreen from "../screens/main/ProfileScreen";
import PlansScreen from "../screens/main/PlansScreen";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function ApprovalPendingScreen() {
  const { refreshUserData, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshUserData();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View style={styles.pendingWrap}>
      <Ionicons name="hourglass-outline" size={56} color={Colors.warning} />
      <Text style={styles.pendingTitle}>Aguardando aprovação</Text>
      <Text style={styles.pendingSubtitle}>
        Seu cadastro ainda não foi aprovado pelo empregador. Aguarde a liberação para
        utilizar o sistema.
      </Text>
      <TouchableOpacity
        style={styles.pendingBtn}
        onPress={handleRefresh}
        disabled={refreshing}
        activeOpacity={0.85}
      >
        {refreshing ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={styles.pendingBtnText}>Atualizar status</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity style={styles.pendingLink} onPress={() => logout()} activeOpacity={0.7}>
        <Text style={styles.pendingLinkText}>Sair da conta</Text>
      </TouchableOpacity>
    </View>
  );
}

function LinkRejectedScreen() {
  const { logout } = useAuth();
  return (
    <View style={styles.pendingWrap}>
      <Ionicons name="close-circle-outline" size={56} color={Colors.error} />
      <Text style={styles.pendingTitle}>Vínculo não aprovado</Text>
      <Text style={styles.pendingSubtitle}>
        O empregador recusou ou encerrou o vínculo com sua conta. Você não pode registrar
        ponto até um novo cadastro ser aprovado.
      </Text>
      <TouchableOpacity style={styles.pendingLink} onPress={() => logout()} activeOpacity={0.7}>
        <Text style={styles.pendingLinkText}>Sair da conta</Text>
      </TouchableOpacity>
    </View>
  );
}

function DashboardRoute({ navigation }) {
  const { logout, userData } = useAuth();
  const isEmployer = userData?.role === "employer";
  const routeMap = useMemo(
    () => ({
      checkin: "Ponto",
      records: "Registros",
      reports: "Relatorios",
      hoursbank: "BancoHoras",
      calculator: "Calculadora",
      employees: "Equipe",
      worklocation: "WorkLocation",
    }),
    [],
  );

  return (
    <HomeScreen
      onLogout={logout}
      onOpenProfile={() => navigation.getParent()?.navigate("Profile")}
      onGoTo={(dest) => {
        const target = routeMap[dest];
        if (!target) return;
        if (dest === "worklocation") {
          navigation.getParent()?.navigate("WorkLocation");
          return;
        }
        if (dest === "hoursbank") {
          navigation.getParent()?.navigate("BancoHoras");
          return;
        }
        if (!isEmployer && dest === "checkin") {
          navigation.navigate("Ponto");
          return;
        }
        navigation.navigate(target);
      }}
    />
  );
}

function TeamStack() {
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedEmployeeMode, setSelectedEmployeeMode] = useState("assignTask");
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TeamList">
        {({ navigation, route }) => (
          <EmployeesScreen
            initialTab={route?.params?.initialTab || "list"}
            onBack={() => navigation.getParent()?.navigate("Inicio")}
            onOpenEmployee={(employee, { mode } = {}) => {
              setSelectedEmployee(employee);
              setSelectedEmployeeMode(mode || "assignTask");
              navigation.navigate("TeamDetail");
            }}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="TeamDetail">
        {({ navigation }) => (
          <EmployeeDetailScreen
            employee={selectedEmployee}
            initialMode={selectedEmployeeMode}
            onBack={() => navigation.goBack()}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

function MainTabs() {
  const { user, userData } = useAuth();
  const isEmployer = userData?.role === "employer";
  const isPendingEmployee =
    userData?.role === "employee" && userData?.approvalStatus === "pending";
  const isRejectedEmployee =
    userData?.role === "employee" && userData?.approvalStatus === "rejected";
  const [pendingCount, setPendingCount] = useState(0);

  const refreshEmployerPendingBadge = useCallback(async () => {
    if (!isEmployer || !user?.uid) {
      setPendingCount(0);
      return;
    }
    const result = await getEmployees(user.uid);
    if (!result.success) {
      setPendingCount(0);
      return;
    }
    const count = (result.data || []).filter(isEmployeePendingApproval).length;
    setPendingCount(count);
  }, [isEmployer, user?.uid]);

  useEffect(() => {
    refreshEmployerPendingBadge();
  }, [refreshEmployerPendingBadge]);

  const employerTabFocus = useMemo(
    () => ({
      focus: () => {
        refreshEmployerPendingBadge();
      },
    }),
    [refreshEmployerPendingBadge],
  );

  if (isRejectedEmployee) {
    return <LinkRejectedScreen />;
  }

  if (isPendingEmployee) {
    return <ApprovalPendingScreen />;
  }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.orange,
        tabBarInactiveTintColor: Colors.gray400,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.gray100,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarIcon: ({ color, size }) => {
          const iconMap = {
            Inicio: "home-outline",
            Ponto: "finger-print-outline",
            Equipe: "people-outline",
            Registros: "time-outline",
            BancoHoras: "calendar-outline",
          };
          return <Ionicons name={iconMap[route.name]} size={size} color={color} />;
        },
        tabBarBadge:
          route.name === "Equipe" && pendingCount > 0 ? String(pendingCount) : undefined,
        tabBarBadgeStyle: {
          backgroundColor: Colors.error,
          color: Colors.white,
          fontSize: 10,
          minWidth: 16,
          height: 16,
        },
      })}
    >
      <Tab.Screen
        name="Inicio"
        component={DashboardRoute}
        listeners={isEmployer ? employerTabFocus : undefined}
      />
      {!isEmployer && (
        <Tab.Screen name="Ponto">
          {({ navigation }) => (
            <CheckInScreen onBack={() => navigation.navigate("Inicio")} />
          )}
        </Tab.Screen>
      )}
      {isEmployer ? (
        <Tab.Screen
          name="Equipe"
          component={TeamStack}
          listeners={employerTabFocus}
        />
      ) : (
        null
      )}
      <Tab.Screen name="Registros">
        {({ navigation }) => (
          <RecordsScreen onBack={() => navigation.navigate("Inicio")} />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="BancoHoras">
        {({ navigation }) => (
          <HoursBankScreen onBack={() => navigation.goBack()} />
        )}
      </Stack.Screen>
      <Stack.Screen name="WorkLocation">
        {({ navigation }) => (
          <WorkLocationScreen onBack={() => navigation.goBack()} />
        )}
      </Stack.Screen>
      <Stack.Screen name="Profile">
        {({ navigation }) => <ProfileScreen navigation={navigation} />}
      </Stack.Screen>
      <Stack.Screen name="Relatorios">
        {({ navigation }) => (
          <ReportsScreen onBack={() => navigation.goBack()} />
        )}
      </Stack.Screen>
      <Stack.Screen name="Calculadora">
        {({ navigation }) => (
          <CalculatorScreen onBack={() => navigation.goBack()} />
        )}
      </Stack.Screen>
      <Stack.Screen name="Plans">
        {({ navigation }) => (
          <PlansScreen onBack={() => navigation.goBack()} />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  pendingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: Colors.background,
  },
  pendingTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  pendingSubtitle: {
    marginTop: 8,
    fontSize: 14,
    textAlign: "center",
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  pendingBtn: {
    marginTop: 24,
    backgroundColor: Colors.orange,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 200,
    alignItems: "center",
  },
  pendingBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  pendingLink: {
    marginTop: 20,
    paddingVertical: 8,
  },
  pendingLinkText: {
    fontSize: 15,
    color: Colors.teal,
    fontWeight: "600",
  },
});
