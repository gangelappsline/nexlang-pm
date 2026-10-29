/**
 * Módulo compartido para gestionar autenticación en microfrontend
 * Todos los proyectos usan las mismas claves y lógica de autenticación
 */

const AUTH_TOKEN_KEY = "translation_user_token";
const AUTH_USER_KEY = "translation_user_data";

/**
 * Obtiene el token del usuario del localStorage
 */
export const getAuthToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
};

/**
 * Guarda el token del usuario en localStorage
 */
export const setAuthToken = (token) => {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }
};

/**
 * Elimina el token del usuario
 */
export const clearAuthToken = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
};

/**
 * Obtiene los datos del usuario del localStorage
 */
export const getAuthUser = () => {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem(AUTH_USER_KEY);
  return data ? JSON.parse(data) : null;
};

/**
 * Guarda los datos del usuario en localStorage
 */
export const setAuthUser = (userData) => {
  if (typeof window === "undefined") return;
  if (userData) {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
  } else {
    localStorage.removeItem(AUTH_USER_KEY);
  }
};

/**
 * Elimina los datos del usuario
 */
export const clearAuthUser = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_USER_KEY);
};

/**
 * Limpia toda la sesión del usuario
 */
export const clearAuthSession = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
};

/**
 * Verifica si el usuario tiene una sesión válida
 */
export const hasAuthSession = () => {
  return Boolean(getAuthToken());
};

/**
 * Hook para escuchar cambios en el localStorage desde otros tabs/ventanas
 */
export const subscribeToAuthChanges = (callback) => {
  if (typeof window === "undefined") return () => {};

  const handleStorageChange = (event) => {
    if (event.key === AUTH_TOKEN_KEY || event.key === AUTH_USER_KEY) {
      callback({
        token: localStorage.getItem(AUTH_TOKEN_KEY),
        user: localStorage.getItem(AUTH_USER_KEY)
          ? JSON.parse(localStorage.getItem(AUTH_USER_KEY))
          : null,
      });
    }
  };

  window.addEventListener("storage", handleStorageChange);

  return () => window.removeEventListener("storage", handleStorageChange);
};
