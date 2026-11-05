import axios from "axios";

export const protectedAxios = axios.create({
  baseURL: "http://localhost:3000/api",
  withCredentials: true,
});

protectedAxios.interceptors.request.use(
  (config) => {
    const rawToken = localStorage.getItem("token");

    if (rawToken) {
      try {
        const parsedToken = JSON.parse(rawToken);
        config.headers.Authorization = `Bearer ${parsedToken}`;
      } catch (error) {
        console.error("Failed to parse token from localStorage", error);
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);
