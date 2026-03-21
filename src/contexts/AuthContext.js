import React, { createContext, useState, useEffect, useContext } from "react";
import {
  onAuthChange,
  loginUser,
  registerUser,
  logoutUser,
  getUserData,
  subscribeUserData,
} from "../config/firebase";

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubFirestore = null;

    const unsubscribe = onAuthChange((firebaseUser) => {
      if (unsubFirestore) {
        unsubFirestore();
        unsubFirestore = null;
      }

      if (firebaseUser) {
        setUser(firebaseUser);
        setLoading(true);
        unsubFirestore = subscribeUserData(firebaseUser.uid, (result) => {
          if (result.success) {
            setUserData(result.data);
          } else {
            setUserData(null);
          }
          setLoading(false);
        });
      } else {
        setUser(null);
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubFirestore) unsubFirestore();
    };
  }, []);

  const login = async (email, password) => {
    const result = await loginUser(email, password);
    return result;
  };

  const register = async (email, password, name, role, employerEmail) => {
    const result = await registerUser(
      email,
      password,
      name,
      role,
      employerEmail,
    );
    return result;
  };

  const logout = async () => {
    const result = await logoutUser();
    return result;
  };

  const refreshUserData = async () => {
    if (!user?.uid) return;
    const result = await getUserData(user.uid);
    if (result.success) setUserData(result.data);
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
        refreshUserData,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
