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
let refreshQueue: ((token: string) => void)[] = [];

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const original = error.config;

        if (error.response?.status !== 401 || original._retry) {
            return Promise.reject(error);
        }

        const refreshToken = localStorage.getItem("sizz_refresh_token");
        if (!refreshToken) {
            clearSessionAndRedirect();
            return Promise.reject(error);
        }

        if (isRefreshing) {
            return new Promise((resolve) => {
                refreshQueue.push((newToken) => {
                    original.headers.Authorization = `Bearer ${newToken}`;
                    resolve(api(original));
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

            refreshQueue.forEach((cb) => cb(data.accessToken));
            refreshQueue = [];

            original.headers.Authorization = `Bearer ${data.accessToken}`;
            return api(original);
        } catch {
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