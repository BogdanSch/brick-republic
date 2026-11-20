import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { jwtDecode } from "jwt-decode";
import type { TokenPayload } from "shared/types";
import useLocalStorage from "../hooks/useLocalStorage";

export type AuthContextType = {
  token: string | null;
  user: TokenPayload | null;
  sessionExpired: boolean;
  login: (token: string) => void;
  logout: () => void;
  isAdmin: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AUTH_LOGOUT_EVENT = "auth:logout";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken, removeToken] = useLocalStorage<string | null>(
    "token",
    null,
  );
  const [sessionExpired, setSessionExpired] = useState(false);

  const user = useMemo<TokenPayload | null>(() => {
    if (!token) return null;
    try {
      return jwtDecode<TokenPayload>(token);
    } catch (e) {
      removeToken();
      return null;
    }
  }, [token, removeToken]);

  const login = (newToken: string) => {
    setSessionExpired(false);
    setToken(newToken);
  };
  const logout = () => removeToken();
  const isAdmin = Boolean(user && user?.role && user.role === "admin");

  useEffect(() => {
    const handleAuthLogout = () => {
      logout();
      setSessionExpired(true);
    };

    window.addEventListener(AUTH_LOGOUT_EVENT, handleAuthLogout);
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, handleAuthLogout);
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{ token, user, sessionExpired, login, logout, isAdmin }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
