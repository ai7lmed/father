"use client";

/* ============================================================
 * ALDIRXON — Auth context (جلسة حقيقية عبر Supabase)
 * ------------------------------------------------------------
 * الجلسة تُدار بكوكيز HttpOnly عبر @supabase/ssr (middleware).
 * هذا الـ Provider يقرأ الجلسة من الخادم فقط — لا localStorage.
 * ============================================================ */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type AccountView = {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  createdAt?: string | null;
};

type AuthContextValue = {
  customer: AccountView | null;
  ready: boolean;
  isAdmin: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<AccountView | null>(null);
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const json = (await res.json()) as {
        user: { id: string; email: string | null; phone: string | null; name: string | null } | null;
        customer: { created_at?: string } | null;
        isAdmin?: boolean;
      };
      if (json.user) {
        setCustomer({
          id: json.user.id,
          name: json.user.name,
          email: json.user.email,
          phone: json.user.phone,
          createdAt: json.customer?.created_at ?? null,
        });
        setIsAdmin(Boolean(json.isAdmin));
      } else {
        setCustomer(null);
        setIsAdmin(false);
      }
    } catch {
      setCustomer(null);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const signOut = useCallback(async () => {
    try {
      await fetch("/api/auth/signout", { method: "POST" });
    } finally {
      setCustomer(null);
      window.location.href = "/";
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ customer, ready, isAdmin, refresh, signOut }),
    [customer, ready, isAdmin, refresh, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
