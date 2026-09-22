"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api, getToken, setToken } from "@/lib/api";

export type AuthUser = {
  id: string;
  role: "candidate" | "employer" | "admin";
  name: string;
  mobile: string;
  email: string;
  profile: {
    name: string;
    mobile: string;
    email: string;
    pincode: string;
    city: string;
    radius: string;
    category: string;
    employmentType: string;
    shift: string;
    vehicle: string;
    licence: string;
    dob: string;
  };
};

type AuthContextValue = {
  user: AuthUser | null;
  ready: boolean;
  token: string | null;
  requestOtp: (input: {
    mobile?: string;
    email?: string;
    role: "candidate" | "employer" | "admin";
  }) => Promise<void>;
  verifyOtp: (input: {
    mobile?: string;
    email?: string;
    otp: string;
    role: "candidate" | "employer" | "admin";
  }) => Promise<AuthUser>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateProfile: (profile: Partial<AuthUser["profile"]>) => Promise<AuthUser>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const refreshUser = useCallback(async () => {
    const t = getToken();
    if (!t) {
      setUser(null);
      setTokenState(null);
      return;
    }
    try {
      const data = await api<{ user: AuthUser }>("/auth/me");
      setUser(data.user);
      setTokenState(t);
    } catch {
      setToken(null);
      setUser(null);
      setTokenState(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setReady(true));
  }, [refreshUser]);

  async function requestOtp(input: {
    mobile?: string;
    email?: string;
    role: "candidate" | "employer" | "admin";
  }) {
    await api("/auth/request-otp", {
      method: "POST",
      body: JSON.stringify(input),
      auth: false,
    });
  }

  async function verifyOtp(input: {
    mobile?: string;
    email?: string;
    otp: string;
    role: "candidate" | "employer" | "admin";
  }) {
    const data = await api<{ token: string; user: AuthUser }>(
      "/auth/verify-otp",
      {
        method: "POST",
        body: JSON.stringify(input),
        auth: false,
      },
    );
    setToken(data.token);
    setTokenState(data.token);
    setUser(data.user);
    return data.user;
  }

  function logout() {
    setToken(null);
    setTokenState(null);
    setUser(null);
  }

  async function updateProfile(profile: Partial<AuthUser["profile"]>) {
    const data = await api<{ user: AuthUser }>("/candidates/me/profile", {
      method: "PATCH",
      body: JSON.stringify(profile),
    });
    setUser(data.user);
    return data.user;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        ready,
        token,
        requestOtp,
        verifyOtp,
        logout,
        refreshUser,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("AuthProvider required");
  return ctx;
}
