import axios from "axios";
import { router } from "../main";
import { AUTH_LOGOUT_EVENT } from "../contexts/AuthContext";

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

protectedAxios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT));
      router.navigate({
        to: "/auth/login",
        replace: true,
      });
    }
    return Promise.reject(error);
  },
);
