import axios from "axios";

const api = axios.create({
    baseURL: "/api",
    headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("sizz_access_token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

let isRefreshing = false;
let refreshQueue: { resolve: (token: string) => void; reject: (err: unknown) => void }[] = [];

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const original = error.config;

        if (error.response?.status !== 401 || original._retry) {
            return Promise.reject(error);
        }

        // Tarea 6: los 401 de /auth/login son errores de credenciales, no de sesión.
        // El componente Login ya muestra el mensaje; no debemos recargar la página.
        if (original.url?.includes("/auth/login")) {
            return Promise.reject(error);
        }

        const refreshToken = localStorage.getItem("sizz_refresh_token");
        if (!refreshToken) {
            clearSessionAndRedirect();
            return Promise.reject(error);
        }

        // Tarea 4+5: encolar con resolve Y reject, y marcar _retry antes de reintentar.
        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                refreshQueue.push({
                    resolve: (newToken) => {
                        original._retry = true;
                        original.headers.Authorization = `Bearer ${newToken}`;
                        resolve(api(original));
                    },
                    reject,
                });
            });
        }

        original._retry = true;
        isRefreshing = true;

        try {
            const { data } = await axios.post(
                "/api/auth/refresh",
                { refreshToken },
                { headers: { "Content-Type": "application/json" } }
            );

            localStorage.setItem("sizz_access_token", data.accessToken);
            localStorage.setItem("sizz_refresh_token", data.refreshToken);

            refreshQueue.forEach(({ resolve }) => resolve(data.accessToken));
            refreshQueue = [];

            original.headers.Authorization = `Bearer ${data.accessToken}`;
            return api(original);
        } catch (refreshError) {
            // Tarea 4: rechazar todas las solicitudes en cola antes de vaciarla.
            refreshQueue.forEach(({ reject }) => reject(refreshError));
            refreshQueue = [];
            clearSessionAndRedirect();
            return Promise.reject(error);
        } finally {
            isRefreshing = false;
        }
    }
);

function clearSessionAndRedirect() {
    localStorage.removeItem("sizz_access_token");
    localStorage.removeItem("sizz_refresh_token");
    window.location.href = "/login";
}

export default api;