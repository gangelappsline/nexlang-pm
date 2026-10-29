import { useEffect } from "react";
import { getAuthToken, setAuthUser, clearAuthToken } from "./auth-storage";

/**
 * Hook personalizado para gestionar autenticación
 * Valida el token con la API y maneja errores de sesión expirada
 */
export const useAuthSession = (fetchCurrentUser) => {
  const token = getAuthToken();

  const {
    data: currentUser,
    isLoading,
    isError,
    error,
  } = fetchCurrentUser(token);

  // Cuando los datos del usuario se cargan exitosamente, guardarlos en localStorage
  useEffect(() => {
    if (currentUser) {
      setAuthUser(currentUser);
    }
  }, [currentUser]);

  // Si el token es inválido (401), limpiar la sesión
  useEffect(() => {
    if (isError && error?.status === 401) {
      clearAuthToken();
    }
  }, [error, isError]);

  return {
    token,
    currentUser,
    isLoading,
    isError,
    error,
    isAuthenticated: Boolean(token && currentUser && !isError),
  };
};
