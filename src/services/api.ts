import axios from "axios";
import type { TokenResponse } from "./auth.service";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("sizz_access_token");
  if (
    token &&
    !config.url?.startsWith("/auth/") &&
    config.url !== "/scholarships/public-calls"
  ) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refresh: Promise<TokenResponse> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (
      error.response?.status !== 401 ||
      !original ||
      original._retry ||
      original.url?.startsWith("/auth/") ||
      original.url === "/scholarships/public-calls"
    ) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem("sizz_refresh_token");
    if (!refreshToken) {
      clearSessionAndRedirect();
      return Promise.reject(error);
    }

    original._retry = true;

    try {
      if (!refresh)
        refresh = axios
          .post<TokenResponse>(
            "/api/auth/refresh",
            { refreshToken },
            { headers: { "Content-Type": "application/json" } },
          )
          .then(({ data }) => {
            localStorage.setItem("sizz_access_token", data.accessToken);
            localStorage.setItem("sizz_refresh_token", data.refreshToken);
            return data;
          })
          .finally(() => {
            refresh = null;
          });
      const data = await refresh;

      original.headers.Authorization = `Bearer ${data.accessToken}`;
      return api(original);
    } catch {
      clearSessionAndRedirect();
      return Promise.reject(error);
    }
  },
);

function clearSessionAndRedirect() {
  localStorage.removeItem("sizz_access_token");
  localStorage.removeItem("sizz_refresh_token");
  window.location.href = "/login";
}

export default api;
