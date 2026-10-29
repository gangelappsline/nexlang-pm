import { apiFetch } from "./http";
import { getAuthToken } from "../utils/auth-storage";

/**
 * Fetch all projects
 * @returns {Promise<Array>} List of projects
 */
export const getProjects = async () => {
  const token = getAuthToken();
  return apiFetch("/projects", { token });
};

/**
 * Create a new project
 * @param {Object} projectData - Project data
 * @returns {Promise<Object>} Created project
 */
export const createProject = async (projectData) => {
  const token = getAuthToken();
  return apiFetch("/projects", {
    method: "POST",
    body: projectData,
    token,
  });
};

/**
 * Update a project
 * @param {number|string} id - Project ID
 * @param {Object} projectData - Updated project data
 * @returns {Promise<Object>} Updated project
 */
export const updateProject = async (id, projectData) => {
  const token = getAuthToken();
  return apiFetch(`/projects/${id}`, {
    method: "PUT",
    body: projectData,
    token,
  });
};

/**
 * Delete a project
 * @param {number|string} id - Project ID
 * @returns {Promise<void>}
 */
export const deleteProject = async (id) => {
  const token = getAuthToken();
  return apiFetch(`/projects/${id}`, {
    method: "DELETE",
    token,
  });
};
