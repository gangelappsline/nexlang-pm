import { apiFetch, apiUploadFile } from "./http";
import { getAuthToken } from "../utils/auth-storage";

/**
 * Get all tasks for a project
 * @param {number|string} projectId - Project ID
 * @param {Object} filters - Optional filters (users, priority, status, startDate, endDate)
 * @returns {Promise<Array>} List of tasks
 */
export const getTasks = async (projectId, filters = {}) => {
  const token = getAuthToken();
  
  // Build query parameters
  const queryParams = new URLSearchParams();
  
  if (filters.users && filters.users.length > 0) {
    filters.users.forEach(userId => queryParams.append('user_id[]', userId));
  }
  
  if (filters.priority) {
    queryParams.append('priority', filters.priority);
  }
  
  if (filters.status) {
    queryParams.append('status', filters.status);
  }
  
  if (filters.startDate) {
    queryParams.append('start_date', filters.startDate);
  }
  
  if (filters.endDate) {
    queryParams.append('end_date', filters.endDate);
  }
  
  const queryString = queryParams.toString();
  const url = queryString 
    ? `/projects/${projectId}/tasks?${queryString}`
    : `/projects/${projectId}/tasks`;
  
  return apiFetch(url, { token });
};

/**
 * Create a new task
 * @param {number|string} projectId - Project ID
 * @param {Object} taskData - Task data
 * @returns {Promise<Object>} Created task
 */
export const createTask = async (projectId, taskData) => {
  const token = getAuthToken();
  return apiFetch(`/projects/${projectId}/tasks`, {
    method: "POST",
    body: taskData,
    token,
  });
};

/**
 * Update a task
 * @param {number|string} projectId - Project ID
 * @param {number|string} taskId - Task ID
 * @param {Object} taskData - Updated task data
 * @returns {Promise<Object>} Updated task
 */
export const updateTask = async (projectId, taskId, taskData) => {
  const token = getAuthToken();
  return apiFetch(`/projects/${projectId}/tasks/${taskId}`, {
    method: "PUT",
    body: taskData,
    token,
  });
};

/**
 * Delete a task
 * @param {number|string} projectId - Project ID
 * @param {number|string} taskId - Task ID
 * @returns {Promise<void>}
 */
export const deleteTask = async (projectId, taskId) => {
  const token = getAuthToken();
  return apiFetch(`/projects/${projectId}/tasks/${taskId}`, {
    method: "DELETE",
    token,
  });
};

/**
 * Upload an attachment to a task
 * @param {number|string} projectId - Project ID
 * @param {number|string} taskId - Task ID
 * @param {File} file - File to upload
 * @param {Function} onProgress - Progress callback (optional)
 * @returns {Promise<Object>} Uploaded attachment
 */
export const uploadTaskAttachment = async (projectId, taskId, file, onProgress = null) => {
  const token = getAuthToken();
  const formData = new FormData();
  formData.append('file', file);
  
  return apiUploadFile(
    `/projects/${projectId}/tasks/${taskId}/attachments`,
    formData,
    token,
    onProgress
  );
};

/**
 * Get secure download link for a task attachment
 * @param {number|string} projectId - Project ID
 * @param {number|string} taskId - Task ID
 * @param {number|string} attachmentId - Attachment ID
 * @returns {Promise<Object>} Object containing download URL
 */
export const downloadTaskAttachment = async (projectId, taskId, attachmentId) => {
  const token = getAuthToken();
  return apiFetch(
    `/projects/${projectId}/tasks/${taskId}/attachments/${attachmentId}/download`,
    { token }
  );
};

/**
 * Get all comments for a task
 * @param {number|string} projectId - Project ID
 * @param {number|string} taskId - Task ID
 * @returns {Promise<Array>} List of comments
 */
export const getTaskComments = async (projectId, taskId) => {
  const token = getAuthToken();
  return apiFetch(`/projects/${projectId}/tasks/${taskId}/comments`, { token });
};

/**
 * Create a new comment on a task
 * @param {number|string} projectId - Project ID
 * @param {number|string} taskId - Task ID
 * @param {Object} commentData - Comment data
 * @returns {Promise<Object>} Created comment
 */
export const createTaskComment = async (projectId, taskId, commentData) => {
  const token = getAuthToken();
  return apiFetch(`/projects/${projectId}/tasks/${taskId}/comments`, {
    method: "POST",
    body: commentData,
    token,
  });
};

/**
 * Update a comment
 * @param {number|string} projectId - Project ID
 * @param {number|string} taskId - Task ID
 * @param {number|string} commentId - Comment ID
 * @param {Object} commentData - Updated comment data
 * @returns {Promise<Object>} Updated comment
 */
export const updateTaskComment = async (projectId, taskId, commentId, commentData) => {
  const token = getAuthToken();
  return apiFetch(`/projects/${projectId}/tasks/${taskId}/comments/${commentId}`, {
    method: "PUT",
    body: commentData,
    token,
  });
};

/**
 * Delete a comment
 * @param {number|string} projectId - Project ID
 * @param {number|string} taskId - Task ID
 * @param {number|string} commentId - Comment ID
 * @returns {Promise<void>}
 */
export const deleteTaskComment = async (projectId, taskId, commentId) => {
  const token = getAuthToken();
  return apiFetch(`/projects/${projectId}/tasks/${taskId}/comments/${commentId}`, {
    method: "DELETE",
    token,
  });
};
