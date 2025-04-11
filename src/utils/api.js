// Guarda este archivo como src/utils/api.js

// Función para hacer llamadas a la API con el token incluido
export const apiCall = async (url, options = {}) => {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // Añadir token de autenticación si existe
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const fetchOptions = {
    ...options,
    headers,
  };

  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    // Si recibimos un error 401 (no autorizado), redirigir al login
    if (response.status === 401) {
      // Limpiar localStorage y redirigir al login
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      localStorage.removeItem("esAdmin");
      localStorage.removeItem("clientesAutorizados");

      window.location.href = "/login";
      throw new Error("Sesión expirada. Por favor, inicia sesión nuevamente.");
    }

    // Para otros errores, lanzar una excepción con el mensaje del servidor
    const errorData = await response.json();
    throw new Error(errorData.mensaje || "Error en la solicitud");
  }

  return await response.json();
};
