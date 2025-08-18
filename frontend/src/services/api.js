// frontend/src/services/api.js
import axios from "axios";

// ✅ use environment variable (for Vercel) or fallback to localhost for dev
const BASE = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000/api";
const client = axios.create({ baseURL: BASE });

const getAccess = () => localStorage.getItem("access");
const getRefresh = () => localStorage.getItem("refresh");
const setTokens = (access, refresh) => {
  if (access) localStorage.setItem("access", access);
  if (refresh) localStorage.setItem("refresh", refresh);
};
const clearTokens = () => {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  localStorage.removeItem("user");
};

client.interceptors.request.use((config) => {
  const access = getAccess();
  if (access) config.headers.Authorization = `Bearer ${access}`;
  return config;
});

let isRefreshing = false;
let failedQueue = [];
const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token);
  });
  failedQueue = [];
};

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const original = error.config;
    if (!original) return Promise.reject(error);

    if (error.response && error.response.status === 401 && !original._retry) {
      original._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = "Bearer " + token;
          return axios(original);
        });
      }

      isRefreshing = true;
      const refresh = getRefresh();
      if (!refresh) {
        clearTokens();
        isRefreshing = false;
        return Promise.reject(error);
      }

      return new Promise((resolve, reject) => {
        axios
          // ✅ dynamic BASE works in local & deployed
          .post(`${BASE}/auth/token/refresh/`, { refresh })
          .then(({ data }) => {
            const newAccess = data.access;
            setTokens(newAccess, refresh);
            client.defaults.headers.common.Authorization = "Bearer " + newAccess;
            original.headers.Authorization = "Bearer " + newAccess;
            processQueue(null, newAccess);
            resolve(client(original));
          })
          .catch((err) => {
            processQueue(err, null);
            clearTokens();
            reject(err);
          })
          .finally(() => {
            isRefreshing = false;
          });
      });
    }
    return Promise.reject(error);
  }
);

export { client as API, setTokens, clearTokens };
export default client;
