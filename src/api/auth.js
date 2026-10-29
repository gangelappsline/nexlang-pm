import { apiFetch } from "./http";

export const fetchCurrentUser = (token) => apiFetch("/auth/me", { token });

export const loginUser = ({ email, password }) =>
  apiFetch("/auth/login", {
    method: "POST",
    body: { email, password },
  });
