const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const buildUrl = (path) => {
  const normalizedBase = API_BASE_URL.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
};

export const apiFetch = async (path, { method = "GET", body, token } = {}) => {
  const headers = {
    Accept: "application/json",
  };

  if (body) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(buildUrl(path), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = new Error("Request failed");
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

/**
 * Upload file using multipart/form-data
 * @param {string} path - API path
 * @param {FormData} formData - Form data with file
 * @param {string} token - Auth token
 * @param {Function} onProgress - Progress callback (optional)
 * @returns {Promise<Object>}
 */
export const apiUploadFile = async (path, formData, token, onProgress = null) => {
  const headers = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    if (onProgress) {
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          onProgress(percentComplete);
        }
      });
    }

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (e) {
          resolve(null);
        }
      } else {
        const error = new Error("Upload failed");
        error.status = xhr.status;
        reject(error);
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Network error"));
    });

    xhr.open("POST", buildUrl(path));

    Object.keys(headers).forEach((key) => {
      xhr.setRequestHeader(key, headers[key]);
    });

    xhr.send(formData);
  });
};
