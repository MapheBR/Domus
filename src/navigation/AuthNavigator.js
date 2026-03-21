import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import WelcomeScreen from "../screens/auth/WelcomeScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";

const Stack = createStackNavigator();

export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome">
        {({ navigation }) => (
          <WelcomeScreen
            onGoToLogin={() => navigation.navigate("Login")}
            onGoToRegister={() => navigation.navigate("Register")}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Login">
        {({ navigation }) => (
          <LoginScreen
            onGoToRegister={() => navigation.navigate("Register")}
            onLogin={() => navigation.replace("Welcome")}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Register">
        {({ navigation }) => (
          <RegisterScreen
            onGoToLogin={() => navigation.navigate("Login")}
            onRegister={() => navigation.replace("Welcome")}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
