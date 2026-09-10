// File: AuthContext.tsx
// Session after login (user) or skip (guest).

import { createContext, ReactNode, useContext, useMemo, useState } from "react";

export type AuthUser = {
  name: string;
  email: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  skip: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [skipped, setSkipped] = useState(false);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: skipped ? null : user,
      login: (next) => {
        setSkipped(false);
        setUser(next);
      },
      skip: () => {
        setUser(null);
        setSkipped(true);
      },
    }),
    [skipped, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
