import axios from "axios";

export const protectedAxios = axios.create({
  baseURL: "http://localhost:3000/api",
  withCredentials: true,
  headers: {
    authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});
