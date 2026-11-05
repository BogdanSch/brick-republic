import { createContext, useContext, useMemo, type ReactNode } from "react";
import { jwtDecode } from "jwt-decode";
import type { TokenPayload } from "shared/types";
import useLocalStorage from "../hooks/useLocalStorage";

export type AuthContextType = {
  token: string | null;
  user: TokenPayload | null;
  login: (token: string) => void;
  logout: () => void;
  isAdmin: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken, removeToken] = useLocalStorage<string | null>(
    "token",
    null,
  );

  const user = useMemo<TokenPayload | null>(() => {
    if (!token) return null;
    try {
      return jwtDecode<TokenPayload>(token);
    } catch (e) {
      removeToken();
      return null;
    }
  }, [token, removeToken]);

  const login = (newToken: string) => setToken(newToken);
  const logout = () => removeToken();
  const isAdmin = Boolean(user && user?.role && user.role === "admin");

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
