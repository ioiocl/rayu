import { API_BASE_URL } from "../config.js";

export function createHttpAuthApi() {
  async function signup({ email, password, nickname }) {
    const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password, nickname }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Error al registrarse");
    }

    return data.user;
  }

  async function login({ email, password }) {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Error al iniciar sesión");
    }

    return data.user;
  }

  async function logout() {
    const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Error al cerrar sesión");
    }

    return data;
  }

  async function getCurrentUser() {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      credentials: "include",
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.user;
  }

  async function checkNicknameAvailable(nickname) {
    const response = await fetch(`${API_BASE_URL}/api/auth/check-nickname/${encodeURIComponent(nickname)}`, {
      credentials: "include",
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Error al verificar nickname");
    }

    return data.available;
  }

  return {
    signup,
    login,
    logout,
    getCurrentUser,
    checkNicknameAvailable,
  };
}
