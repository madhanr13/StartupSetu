/**
 * Authentication context and provider.
 *
 * Wraps the entire application to provide authentication state.
 * On mount, validates any stored token against the backend.
 *
 * Usage:
 *   const { user, isAuthenticated, login, logout } = useAuth();
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User, AuthState } from "@/types";
import {
  login as authLogin,
  logout as authLogout,
  getCurrentUser,
  hasStoredToken,
} from "@/services/auth";

// ── Context Type ────────────────────────────────────────────────────────────

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// ── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = user !== null && token !== null;

  // On mount: check for existing token and validate it
  useEffect(() => {
    async function validateSession() {
      if (!hasStoredToken()) {
        setIsLoading(false);
        return;
      }

      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          setToken(localStorage.getItem("auth_token"));
        }
      } catch {
        // Token invalid — already cleared by getCurrentUser
      } finally {
        setIsLoading(false);
      }
    }

    validateSession();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const response = await authLogin(email, password);
      setUser(response.user);
      setToken(response.access_token);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Login failed. Please try again.";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await authLogout();
    setUser(null);
    setToken(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      token,
      isAuthenticated,
      isLoading,
      error,
      login,
      logout,
      clearError,
    }),
    [user, token, isAuthenticated, isLoading, error, login, logout, clearError]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

// ── Hook ────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
