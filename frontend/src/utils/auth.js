import api from "./api";

export const loginUser = async (credentials) => {
  const res = await api.post("/auth/login", credentials);
  localStorage.setItem("token", res.data.token);
  return res.data.user;
};

export const logoutUser = () => {
  localStorage.removeItem("token");
};
