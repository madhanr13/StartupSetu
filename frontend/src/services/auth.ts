/**
 * Authentication API service.
 *
 * Handles login, logout, and token management.
 * All auth logic is here — NOT inside React components.
 */

import { apiRequest } from "@/services/api";
import type { User } from "@/types";

const TOKEN_KEY = "auth_token";

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

/**
 * Authenticate with email and password.
 * Stores the JWT in localStorage on success.
 */
export async function login(
  email: string,
  password: string
): Promise<LoginResponse> {
  const response = await apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: { email, password },
  });
  localStorage.setItem(TOKEN_KEY, response.access_token);
  return response;
}

/**
 * Clear the stored JWT and notify the backend (for audit trail).
 */
export async function logout(): Promise<void> {
  try {
    await apiRequest("/auth/logout", { method: "POST" });
  } catch {
    // Logout should succeed even if backend is unreachable
  }
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Get the current authenticated user from the stored token.
 * Returns null if no token or token is invalid.
 */
export async function getCurrentUser(): Promise<User | null> {
  const token = getStoredToken();
  if (!token) return null;

  try {
    return await apiRequest<User>("/auth/me");
  } catch {
    // Token is invalid or expired — clear it
    localStorage.removeItem(TOKEN_KEY);
    return null;
  }
}

/**
 * Get the stored JWT token (if any).
 */
export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Check if a token exists in localStorage.
 */
export function hasStoredToken(): boolean {
  return localStorage.getItem(TOKEN_KEY) !== null;
}
