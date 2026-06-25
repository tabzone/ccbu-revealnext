"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { usePathname } from "next/navigation";

import {
  getCurrentUser,
  fetchUserAttributes,
  fetchAuthSession,
  signIn,
  signOut,
} from "aws-amplify/auth";
import { initAmplify } from "./amplifyConfig";


const AuthContext = createContext(null);

const PUBLIC_ROUTES = [
  "/login",
  "/forgot-password",
];

export function AuthProvider({ children }) {
  const pathname = usePathname();

  const [user, setUser] = useState(null);
  const [loading, setLoading] =
    useState(true);

  const buildUser = async () => {
    try {
      const currentUser =
        await getCurrentUser();

      const attributes =
        await fetchUserAttributes();

      const session =
        await fetchAuthSession();

      const groups =
        session?.tokens?.accessToken?.payload?.[
        "cognito:groups"
        ] || [];

      let role = "user";

      if (groups.includes("Admins")) {
        role = "admin";
      } else if (
        groups.includes("Retailers")
      ) {
        role = "retailer";
      }

      return {
        username:
          currentUser.username,

        email:
          attributes.email || "",

        given_name:
          attributes.given_name || "",

        family_name:
          attributes.family_name || "",

        role,
      };
    } catch (error) {
      console.log(
        "No authenticated user"
      );
      return null;
    }
  };

  useEffect(() => {
    initAmplify();

    const loadUser = async () => {
      const userData = await buildUser();
      setUser(userData);
      setLoading(false);
    };

    loadUser();
  }, [pathname]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        await fetchAuthSession({
          forceRefresh: true,
        });
      } catch (err) {
        console.error(
          "Session refresh failed",
          err
        );

        try {
          await signOut();
        } catch { }

        setUser(null);
      }
    }, 10 * 60 * 1000); // every 10 minutes

    return () => clearInterval(interval);
  }, []);

  const login = async ({
    username,
    password,
  }) => {
    await signIn({
      username,
      password,
    });

    const userData =
      await buildUser();

    setUser(userData);

    return userData;
  };

  const logout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error(error);
    }

    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,

        isAdmin:
          user?.role === "admin",

        isRetailer:
          user?.role ===
          "retailer",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}