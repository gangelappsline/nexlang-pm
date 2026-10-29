import { apiFetch, apiUploadFile } from "../api/http";
import { getAuthToken } from "../utils/auth-storage";

/**
 * Get resources (files and folders)
 * @param {number|string} projectId - Project ID
 * @param {string|null} parentId - Parent folder ID
 * @returns {Promise<Array>}
 */
export const getResources = async (projectId, parentId = null) => {
  const token = getAuthToken();
  const url = parentId 
    ? `/projects/${projectId}/resources?parent_id=${parentId}` 
    : `/projects/${projectId}/resources`;
  return apiFetch(url, { token });
};

/**
 * Create a new folder
 * @param {number|string} projectId - Project ID
 * @param {Object} data - { name, parent_id }
 * @returns {Promise<Object>}
 */
export const createFolder = async (projectId, data) => {
  const token = getAuthToken();
  return apiFetch(`/projects/${projectId}/resources/folder`, {
    method: "POST",
    body: data,
    token,
  });
};

/**
 * Create a new file
 * @param {number|string} projectId - Project ID
 * @param {Object} data - { name, file_type, content, parent_id }
 * @returns {Promise<Object>}
 */
export const createFile = async (projectId, data) => {
  const token = getAuthToken();
  return apiFetch(`/projects/${projectId}/resources/new-file`, {
    method: "POST",
    body: data,
    token,
  });
};

/**
 * Upload file
 * @param {number|string} projectId - Project ID
 * @param {File} file - File object
 * @param {string|null} parentId - Parent folder ID
 * @returns {Promise<Object>}
 */
export const uploadFile = async (projectId, file, parentId = null) => {
  const token = getAuthToken();
  const formData = new FormData();
  formData.append("file", file);
  if (parentId) {
    formData.append("parent_id", parentId);
  }

  return apiUploadFile(`/projects/${projectId}/resources/file`, formData, token);
};

/**
 * Update resource (rename, move, update content)
 * @param {number|string} projectId - Project ID
 * @param {string} id - Resource ID
 * @param {Object} data - Updated data
 * @returns {Promise<Object>}
 */
export const updateResource = async (projectId, id, data) => {
  const token = getAuthToken();
  return apiFetch(`/projects/${projectId}/resources/${id}`, {
    method: "PUT",
    body: data,
    token,
  });
};

/**
 * Delete resource
 * @param {number|string} projectId - Project ID
 * @param {string} id - Resource ID
 * @returns {Promise<void>}
 */
export const deleteResource = async (projectId, id) => {
  const token = getAuthToken();
  return apiFetch(`/projects/${projectId}/resources/${id}`, {
    method: "DELETE",
    token,
  });
};

/**
 * Download file
 * @param {number|string} projectId - Project ID
 * @param {string} id - Resource ID
 * @returns {Promise<Blob>}
 */
export const downloadFile = async (projectId, id) => {
  const token = getAuthToken();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
  const normalizedBase = API_BASE_URL.replace(/\/$/, "");
  const url = `${normalizedBase}/projects/${projectId}/resources/${id}/download`;
  
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to download file");
  }

  return response.blob();
};

/**
 * Get file content for editing
 * @param {number|string} projectId - Project ID
 * @param {string} id - Resource ID
 * @returns {Promise<Object>}
 */
export const getFileContent = async (projectId, id) => {
  const token = getAuthToken();
  return apiFetch(`/projects/${projectId}/resources/${id}/content`, { token });
};
