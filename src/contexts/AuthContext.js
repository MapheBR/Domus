import React, { createContext, useState, useEffect, useContext } from "react";
import {
  onAuthChange,
  loginUser,
  registerUser,
  logoutUser,
  getUserData,
} from "../config/firebase";

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const result = await getUserData(firebaseUser.uid);
        if (result.success) {
          setUserData(result.data);
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    const result = await loginUser(email, password);
    return result;
  };

  const register = async (email, password, name, role) => {
    const result = await registerUser(email, password, name, role);
    return result;
  };

  const logout = async () => {
    const result = await logoutUser();
    return result;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
