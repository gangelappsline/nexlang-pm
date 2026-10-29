import { apiFetch } from "./http";
import { getAuthToken } from "../utils/auth-storage";

/**
 * Get all users
 * @returns {Promise<Array>} List of users
 */
export const getUsers = async () => {
  const token = getAuthToken();
  return apiFetch("/users", { token });
};

/**
 * Get user by ID
 * @param {number|string} id - User ID
 * @returns {Promise<Object>} User data
 */
export const getUserById = async (id) => {
  const token = getAuthToken();
  return apiFetch(`/users/${id}`, { token });
};
