<script>
import { ref, computed, onMounted } from "vue";

export default {
  props: {
    isAdmin: {
      type: Boolean,
      required: true,
    },
  },
  setup(props) {
    // Estado para búsqueda
    const searchQuery = ref("");
    // Estado para búsqueda de clientes dentro del modal
    const clienteSearchQuery = ref("");

    // Estado para Usuarios
    const usuarios = ref([]);
    const showUsuarioModal = ref(false);
    const isEditingUsuario = ref(false);
    const currentUsuario = ref({
      id_Usuario: null,
      nombre: "",
      contraseña: "",
      esAdmin: false,
      clientes: [],
    });

    // Estado para modal de confirmación de eliminación
    const showDeleteConfirmModal = ref(false);
    const deleteItemId = ref(null);
    const deleteItemName = ref("");

    // Estado para clientes disponibles (para asignar permisos)
    const clientesDisponibles = ref([]);

    // Cargar usuarios usando el endpoint específico no-admins
    const fetchUsuarios = async () => {
      try {
        // Solo admin puede ver la lista de usuarios
        if (!props.isAdmin) {
          showNotification("No tienes permisos para esta acción", "error");
          return;
        }

        // Usar el endpoint específico para usuarios no administradores
        const response = await fetch(
          "https://152.228.135.50/api/Usuario/no-admins",
          {
            method: "GET",
            headers: { accept: "*/*" },
          }
        );

        if (!response.ok) {
          throw new Error("No se pudieron cargar los usuarios");
        }

        usuarios.value = await response.json();
        showNotification("Usuarios cargados correctamente", "info");
      } catch (error) {
        console.error("Error al cargar usuarios:", error);
        showNotification("Error al cargar los usuarios", "error");
      }
    };

    // Cargar clientes disponibles
    const fetchClientesDisponibles = async () => {
      try {
        const response = await fetch("https://152.228.135.50/api/Cliente", {
          method: "GET",
          headers: { accept: "*/*" },
        });

        if (!response.ok) {
          throw new Error("No se pudieron cargar los clientes");
        }

        clientesDisponibles.value = await response.json();
      } catch (error) {
        console.error("Error al cargar clientes:", error);
        showNotification("Error al cargar los clientes disponibles", "error");
      }
    };

    // Ordenar y filtrar clientes alfabéticamente según la búsqueda
    const sortedAndFilteredClientes = computed(() => {
      const query = clienteSearchQuery.value.toLowerCase().trim();
      let filteredClientes = clientesDisponibles.value;

      if (query) {
        filteredClientes = filteredClientes.filter((cliente) =>
          cliente.nombre_Empresa.toLowerCase().includes(query)
        );
      }

      return [...filteredClientes].sort((a, b) =>
        a.nombre_Empresa.localeCompare(b.nombre_Empresa)
      );
    });

    // Notificaciones
    const notifications = ref([]);
    const showNotification = (message, type = "info") => {
      const notification = {
        message,
        type,
        id: Date.now(),
      };

      notifications.value.push(notification);

      // Auto-remove after 5 seconds
      setTimeout(() => {
        removeNotification(
          notifications.value.findIndex((n) => n.id === notification.id)
        );
      }, 5000);
    };

    const removeNotification = (index) => {
      if (index !== -1) {
        notifications.value.splice(index, 1);
      }
    };

    // Filtrar usuarios según la búsqueda
    const filteredUsuarios = computed(() => {
      const query = searchQuery.value.toLowerCase().trim();

      if (!query) return usuarios.value;

      return usuarios.value.filter(
        (usuario) =>
          usuario.nombre.toLowerCase().includes(query) ||
          (usuario.id_Usuario && usuario.id_Usuario.toString().includes(query))
      );
    });

    // Método para obtener iniciales del usuario
    const getUserInitial = (name) => {
      if (!name) return "U";
      return name.charAt(0).toUpperCase();
    };

    // Método para obtener nombre de cliente
    const getClienteName = (id) => {
      if (!id) return "N/A";
      const cliente = clientesDisponibles.value.find((c) => c.id_Cliente == id);
      return cliente ? cliente.nombre_Empresa : `Cliente #${id}`;
    };

    // Método para abrir modal de Usuario
    const openUsuarioModal = (usuario) => {
      // Solo admin puede abrir modal de usuarios
      if (!props.isAdmin) {
        showNotification("No tienes permisos para esta acción", "error");
        return;
      }

      // Cargar los clientes disponibles
      fetchClientesDisponibles();

      // Resetear búsqueda de clientes
      clienteSearchQuery.value = "";

      if (usuario) {
        // Para edición, clonar el usuario pero resetear contraseña
        currentUsuario.value = {
          ...usuario,
          contraseña: "", // Resetear contraseña para edición
          // Asegurar que clientes sea un array
          clientes: Array.isArray(usuario.clientes)
            ? [...usuario.clientes]
            : [],
        };
        isEditingUsuario.value = true;
      } else {
        // Para crear nuevo usuario
        currentUsuario.value = {
          id_Usuario: null,
          nombre: "",
          contraseña: "",
          esAdmin: false,
          clientes: [],
        };
        isEditingUsuario.value = false;
      }
      showUsuarioModal.value = true;
    };

    // Guardar Usuario
    const saveUsuario = async () => {
      // Solo admin puede crear/editar usuarios
      if (!props.isAdmin) {
        showNotification("No tienes permisos para esta acción", "error");
        return;
      }

      try {
        // Validación básica
        if (!currentUsuario.value.nombre.trim()) {
          showNotification("El nombre de usuario es obligatorio", "error");
          return;
        }

        // Si es nuevo usuario, la contraseña es obligatoria
        if (!isEditingUsuario.value && !currentUsuario.value.contraseña) {
          showNotification(
            "La contraseña es obligatoria para nuevos usuarios",
            "error"
          );
          return;
        }

        const url = isEditingUsuario.value
          ? `https://152.228.135.50/api/Usuario/${currentUsuario.value.id_Usuario}`
          : "https://152.228.135.50/api/Usuario";

        const method = isEditingUsuario.value ? "PUT" : "POST";

        // Preparar datos para enviar
        const usuarioData = { ...currentUsuario.value };

        // Asegurar estructura correcta según el controlador
        usuarioData.id_Usuario = usuarioData.id_Usuario || 0; // Para creación, usar 0 en lugar de null

        // Si estamos editando y no hay contraseña, no enviarla
        if (isEditingUsuario.value && !usuarioData.contraseña) {
          // Obtener la contraseña actual del usuario existente
          const userResponse = await fetch(
            `https://152.228.135.50/api/Usuario/${usuarioData.id_Usuario}`,
            {
              method: "GET",
              headers: { accept: "*/*" },
            }
          );

          if (userResponse.ok) {
            const existingUser = await userResponse.json();
            usuarioData.contraseña = existingUser.contraseña;
          } else {
            throw new Error(
              "No se pudo obtener la información del usuario para actualizar"
            );
          }
        }

        // Asegurar que esAdmin sea false (solo creamos usuarios no admin)
        usuarioData.esAdmin = false;

        // Asegurar que el campo se llame correctamente según el controlador
        usuarioData.clientes = usuarioData.clientes || [];

        const response = await fetch(url, {
          method: method,
          headers: {
            "Content-Type": "application/json",
            accept: "*/*",
          },
          body: JSON.stringify(usuarioData),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Error al guardar el usuario: ${errorText}`);
        }

        await fetchUsuarios();
        closeUsuarioModal();

        const message = isEditingUsuario.value
          ? `Usuario "${usuarioData.nombre}" actualizado con éxito`
          : `Usuario "${usuarioData.nombre}" creado con éxito`;

        showNotification(message, "success");
      } catch (error) {
        console.error("Error:", error);
        showNotification(
          "Error al guardar el usuario: " + error.message,
          "error"
        );
      }
    };

    // Cerrar modal de Usuario
    const closeUsuarioModal = () => {
      showUsuarioModal.value = false;
      clienteSearchQuery.value = ""; // Limpiar búsqueda al cerrar
    };

    // Método de confirmación de eliminación
    const confirmDelete = (id, name) => {
      // Solo admin puede confirmar eliminación
      if (!props.isAdmin) {
        showNotification("No tienes permisos para esta acción", "error");
        return;
      }

      // Asegurarnos que el ID sea numérico y válido
      if (id === undefined || id === null) {
        showNotification("ID de usuario no válido", "error");
        return;
      }

      console.log(
        `Confirmando eliminación de usuario con ID: ${id}, Nombre: ${name}`
      );

      // Convertir a entero en caso de que venga como string
      deleteItemId.value = parseInt(id, 10);
      deleteItemName.value = name || "Desconocido";
      showDeleteConfirmModal.value = true;
    };

    // Eliminar Usuario
    const deleteUsuario = async () => {
      // Solo admin puede eliminar usuarios
      if (!props.isAdmin) {
        showNotification("No tienes permisos para esta acción", "error");
        return;
      }

      // Validar que tenemos un ID válido antes de proceder
      if (!deleteItemId.value) {
        showNotification("ID de usuario no válido para eliminar", "error");
        closeDeleteConfirmModal();
        return;
      }

      try {
        console.log(
          `Intentando eliminar usuario con ID: ${deleteItemId.value}`
        );

        const response = await fetch(
          `https://152.228.135.50/api/Usuario/${deleteItemId.value}`,
          {
            method: "DELETE",
            headers: { accept: "*/*" },
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`No se pudo eliminar el usuario: ${errorText}`);
        }

        await fetchUsuarios();
        closeDeleteConfirmModal();

        const message = `Usuario eliminado con éxito`;
        showNotification(message, "success");
      } catch (error) {
        console.error("Error al eliminar usuario:", error);
        showNotification(
          "Error al eliminar el usuario: " + error.message,
          "error"
        );
      }
    };

    const closeDeleteConfirmModal = () => {
      showDeleteConfirmModal.value = false;
    };

    // Manejar selección de clientes
    const toggleClientSelection = (clienteId) => {
      if (!currentUsuario.value.clientes) {
        currentUsuario.value.clientes = [];
      }

      const index = currentUsuario.value.clientes.indexOf(clienteId);
      if (index === -1) {
        currentUsuario.value.clientes.push(clienteId);
      } else {
        currentUsuario.value.clientes.splice(index, 1);
      }
    };

    const isClientSelected = (clienteId) => {
      return (
        currentUsuario.value.clientes &&
        currentUsuario.value.clientes.includes(clienteId)
      );
    };

    // Generar contraseña segura
    const generateSecurePassword = () => {
      const length = 12;
      const uppercaseChars = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // Sin I y O para evitar confusión
      const lowercaseChars = "abcdefghijkmnpqrstuvwxyz"; // Sin l y o para evitar confusión
      const numberChars = "23456789"; // Sin 0 y 1 para evitar confusión

      // Removidos los símbolos especiales ya que pueden ser difíciles de ingresar
      const allChars = uppercaseChars + lowercaseChars + numberChars;

      // Asegurar que hay varios caracteres de cada categoría
      let password = "";

      // Añadir 2 mayúsculas
      for (let i = 0; i < 2; i++) {
        password += uppercaseChars.charAt(
          Math.floor(Math.random() * uppercaseChars.length)
        );
      }

      // Añadir 2 números
      for (let i = 0; i < 2; i++) {
        password += numberChars.charAt(
          Math.floor(Math.random() * numberChars.length)
        );
      }

      // Completar la contraseña hasta la longitud deseada con minúsculas principalmente
      for (let i = password.length; i < length; i++) {
        password += lowercaseChars.charAt(
          Math.floor(Math.random() * lowercaseChars.length)
        );
      }

      // Mezclar los caracteres para evitar un patrón predecible
      password = password
        .split("")
        .sort(() => 0.5 - Math.random())
        .join("");

      // Actualizar el estado
      currentUsuario.value.contraseña = password;

      // Mostrar notificación
      showNotification("Contraseña segura generada", "success");
    };

    // Cargar usuarios al montar el componente
    onMounted(() => {
      if (props.isAdmin) {
        fetchUsuarios();
        fetchClientesDisponibles();
      }
    });

    return {
      // Estado
      searchQuery,
      clienteSearchQuery,
      usuarios,
      filteredUsuarios,
      showUsuarioModal,
      isEditingUsuario,
      currentUsuario,
      showDeleteConfirmModal,
      deleteItemName,
      notifications,
      clientesDisponibles,
      sortedAndFilteredClientes,

      // Métodos
      openUsuarioModal,
      saveUsuario,
      closeUsuarioModal,
      deleteUsuario,
      confirmDelete,
      closeDeleteConfirmModal,
      fetchUsuarios,
      showNotification,
      removeNotification,
      toggleClientSelection,
      isClientSelected,
      generateSecurePassword,

      // Utilidades
      getUserInitial,
      getClienteName,
    };
  },
};
</script>

<template>
  <div v-if="isAdmin" class="data-section">
    <div class="data-cards">
      <div class="data-card">
        <div class="card-content">
          <div class="card-icon users-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <div class="card-info">
            <h3>Total Usuarios</h3>
            <p class="card-value">{{ usuarios.length }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="content-header">
      <div class="header-left">
        <h1 class="page-title">Gestión de Usuarios</h1>
        <p class="page-subtitle">
          Total: {{ usuarios.length }} usuarios registrados
        </p>
      </div>
      <div class="header-actions">
        <div class="search-container">
          <input
            type="text"
            placeholder="Buscar usuario..."
            v-model="searchQuery"
            class="search-input"
          />
          <span class="search-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <path d="M21 21l-4.35-4.35"></path>
            </svg>
          </span>
        </div>
        <button @click="openUsuarioModal(null)" class="create-button">
          <span class="button-icon">+</span>
          <span>Nuevo Usuario</span>
        </button>
      </div>
    </div>

    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th class="column-name">Nombre de Usuario</th>
            <th class="column-clients">Clientes Asignados</th>
            <th class="column-actions">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="usuario in filteredUsuarios"
            :key="usuario.id_Usuario"
            class="data-row"
          >
            <td class="column-name">
              <div class="user-info">
                <div class="user-avatar">
                  {{ getUserInitial(usuario.nombre) }}
                </div>
                <span class="user-name">{{ usuario.nombre }}</span>
              </div>
            </td>
            <td class="column-clients">
              <div class="clients-list">
                <div
                  v-if="usuario.clientes && usuario.clientes.length > 0"
                  class="client-tags"
                >
                  <span
                    v-for="clienteId in usuario.clientes"
                    :key="clienteId"
                    class="client-tag"
                  >
                    {{ getClienteName(clienteId) }}
                  </span>
                </div>
                <span v-else class="no-clients">Sin clientes asignados</span>
              </div>
            </td>
            <td class="column-actions">
              <div class="action-buttons">
                <button
                  @click="openUsuarioModal(usuario)"
                  class="action-button edit-button"
                  title="Editar"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
                    ></path>
                    <path
                      d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
                    ></path>
                  </svg>
                </button>
                <button
                  @click="confirmDelete(usuario.id_Usuario, usuario.nombre)"
                  class="action-button delete-button"
                  title="Eliminar"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M3 6h18"></path>
                    <path
                      d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"
                    ></path>
                  </svg>
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="filteredUsuarios.length === 0" class="empty-row">
            <td colspan="3" class="empty-message">
              <div class="empty-content">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="48"
                  height="48"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1"
                >
                  <path
                    d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"
                  ></path>
                  <path d="M13 2v7h7"></path>
                </svg>
                <p>No se encontraron usuarios</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal para crear/editar usuario -->
    <div v-if="showUsuarioModal" class="modal-backdrop">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h2>
            {{ isEditingUsuario ? "Editar Usuario" : "Crear Nuevo Usuario" }}
          </h2>
          <button @click="closeUsuarioModal" class="modal-close-button">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M18 6L6 18"></path>
              <path d="M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <form @submit.prevent="saveUsuario" class="modal-form">
          <div class="form-group">
            <label for="nombreUsuario">Nombre de Usuario</label>
            <input
              id="nombreUsuario"
              v-model="currentUsuario.nombre"
              placeholder="Ingrese el nombre del usuario"
              required
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label for="password">Contraseña</label>
            <div class="password-input-group">
              <input
                id="password"
                v-model="currentUsuario.contraseña"
                type="text"
                placeholder="Ingrese la contraseña"
                :required="!isEditingUsuario"
                class="form-input password-input"
              />
              <button
                type="button"
                @click="generateSecurePassword"
                class="generate-password-button"
                title="Generar contraseña segura"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M19 7l-7 5-7-5"></path>
                  <path d="M19 12l-7 5-7-5"></path>
                </svg>
              </button>
            </div>
            <small v-if="isEditingUsuario" class="form-hint"
              >Dejar en blanco para mantener la contraseña actual</small
            >
          </div>

          <div class="form-group">
            <label>Clientes Asignados</label>
            <div class="client-search-container">
              <input
                type="text"
                v-model="clienteSearchQuery"
                placeholder="Buscar cliente..."
                class="form-input client-search-input"
              />
              <span class="client-search-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="M21 21l-4.35-4.35"></path>
                </svg>
              </span>
            </div>
            <div class="clients-selection">
              <p
                v-if="sortedAndFilteredClientes.length === 0"
                class="no-clients-message"
              >
                No hay clientes disponibles para asignar
              </p>
              <div v-else class="clients-grid">
                <div
                  v-for="cliente in sortedAndFilteredClientes"
                  :key="cliente.id_Cliente"
                  class="client-checkbox-wrapper"
                >
                  <div class="checkbox-container">
                    <input
                      type="checkbox"
                      :id="`cliente-${cliente.id_Cliente}`"
                      :checked="isClientSelected(cliente.id_Cliente)"
                      @change="toggleClientSelection(cliente.id_Cliente)"
                      class="custom-checkbox"
                    />
                    <label
                      :for="`cliente-${cliente.id_Cliente}`"
                      class="checkbox-label"
                    ></label>
                  </div>
                  <label
                    :for="`cliente-${cliente.id_Cliente}`"
                    class="client-name-label"
                  >
                    {{ cliente.nombre_Empresa }}
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button
              type="button"
              @click="closeUsuarioModal"
              class="modal-button cancel-button"
            >
              Cancelar
            </button>
            <button type="submit" class="modal-button save-button">
              {{ isEditingUsuario ? "Actualizar" : "Crear" }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal de confirmación para eliminar usuario -->
    <div v-if="showDeleteConfirmModal" class="modal-backdrop">
      <div class="modal-container delete-confirm-modal" @click.stop>
        <div class="modal-header delete-header">
          <h2>Confirmar Eliminación</h2>
          <button @click="closeDeleteConfirmModal" class="modal-close-button">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M18 6L6 18"></path>
              <path d="M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="delete-warning-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="48"
              height="48"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              ></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <p>
            ¿Estás seguro de que deseas eliminar al usuario
            <strong>{{ deleteItemName }}</strong
            >?
          </p>
          <p class="delete-warning">Esta acción no se puede deshacer.</p>
        </div>
        <div class="modal-footer">
          <button
            @click="closeDeleteConfirmModal"
            class="modal-button cancel-button"
          >
            Cancelar
          </button>
          <button
            @click="deleteUsuario(deleteItemId)"
            class="modal-button delete-button"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>

    <!-- Sistema de notificaciones -->
    <div class="notifications-container">
      <div
        v-for="(notification, index) in notifications"
        :key="index"
        :class="['notification', `notification-${notification.type}`]"
      >
        <div class="notification-icon">
          <svg
            v-if="notification.type === 'success'"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14"></path>
            <path d="M22 4L12 14.01l-3-3"></path>
          </svg>
          <svg
            v-else-if="notification.type === 'error'"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <div class="notification-content">
          <p>{{ notification.message }}</p>
        </div>
        <button class="notification-close" @click="removeNotification(index)">
          ×
        </button>
      </div>
    </div>
  </div>
  <div v-else class="unauthorized-message">
    <div class="unauthorized-content">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="64"
        height="64"
        fill="none"
        stroke="currentColor"
        stroke-width="1"
      >
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0110 0v4"></path>
        <circle cx="12" cy="16" r="1"></circle>
      </svg>
      <h2>Acceso Restringido</h2>
      <p>No tienes permiso para ver esta sección.</p>
    </div>
  </div>
</template>

<style scoped>
/* Estilos para la vista de usuarios */
.users-icon {
  background-color: rgba(142, 68, 173, 0.1);
  color: #8e44ad;
}

.column-clients {
  width: 50%;
}

.clients-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.client-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.client-tag {
  background-color: rgba(193, 39, 45, 0.1);
  color: #c1272d;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 12px;
  white-space: nowrap;
}

.no-clients {
  color: #6c757d;
  font-size: 14px;
  font-style: italic;
}

/* Selección de clientes en el formulario */
.clients-selection {
  margin-top: 10px;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 16px;
  max-height: 200px; /* Ajustado para que no sea tan alto */
  overflow-y: auto;
}

/* Buscador de clientes dentro del modal */
.client-search-container {
  position: relative;
  margin-bottom: 10px;
}

.client-search-input {
  padding-left: 38px; /* Aumentado para que no se cruce con el texto */
  font-size: 14px;
}

.client-search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
  z-index: 2; /* Asegurar que esté por encima del texto */
  pointer-events: none; /* Permitir clics a través del icono */
}

.clients-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 8px; /* Reducido para hacer más compacta la vista */
}

.client-checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  padding: 4px;
  border-radius: 4px;
}

.client-checkbox-wrapper:hover {
  background-color: rgba(193, 39, 45, 0.05);
}

.client-name-label {
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 160px; /* Limitar ancho para nombres largos */
}

.no-clients-message {
  color: #6c757d;
  text-align: center;
  padding: 10px;
}

/* Estilos para pantalla de acceso no autorizado */
.unauthorized-message {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 60vh;
}

.unauthorized-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 40px;
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.unauthorized-content svg {
  color: #c1272d;
  margin-bottom: 20px;
}

.unauthorized-content h2 {
  color: #2c3e50;
  margin-bottom: 10px;
}

.unauthorized-content p {
  color: #6c757d;
}

/* Estilos para la tabla */
.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  background-color: #f8f9fa;
  color: #6c757d;
  font-weight: 600;
  font-size: 14px;
  text-align: left;
  padding: 16px 24px;
  border-bottom: 1px solid #dee2e6;
}

.data-row {
  transition: all 0.3s ease;
}

.data-row:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.data-table td {
  padding: 16px 24px;
  border-bottom: 1px solid #dee2e6;
  font-size: 14px;
}

.data-table tr:last-child td {
  border-bottom: none;
}

/* Estilos para usuario */
.user-info {
  display: flex;
  align-items: center;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: rgba(142, 68, 173, 0.1);
  color: #8e44ad;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-right: 12px;
}

.user-name {
  font-weight: 600;
}

/* Estilos para tarjetas de datos */
.data-cards {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
}

.data-card {
  background-color: white;
  border-radius: 12px;
  padding: 16px;
  flex: 1;
  min-width: 220px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.data-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.card-content {
  display: flex;
  align-items: center;
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 14px;
}

.card-info {
  flex-grow: 1;
}

.card-info h3 {
  font-size: 14px;
  font-weight: 600;
  color: #6c757d;
  margin-bottom: 4px;
}

.card-value {
  font-size: 24px;
  font-weight: 700;
  color: #2c3e50;
}

/* Estilos para el header */
.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.header-left {
  max-width: 60%;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 8px;
}

.page-subtitle {
  color: #6c757d;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 16px;
}

.search-container {
  position: relative;
}

.search-input {
  background-color: #fff;
  border: 1px solid #dee2e6;
  border-radius: 50px;
  padding: 10px 20px 10px 40px;
  width: 260px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #c1272d;
  box-shadow: 0 0 0 3px rgba(193, 39, 45, 0.1);
  width: 300px;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
}

.create-button {
  display: flex;
  align-items: center;
  background-color: #c1272d;
  color: white;
  border: none;
  border-radius: 50px;
  padding: 10px 20px;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
}

.create-button:hover {
  background-color: #a01218;
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.button-icon {
  margin-right: 8px;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Estilos para el contenedor de la tabla */
.table-container {
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  margin-bottom: 30px;
}

/* Estilos para acciones */
.action-buttons {
  display: flex;
  gap: 8px;
}

.action-button {
  border: none;
  background: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6c757d;
  transition: all 0.3s ease;
}

.action-button:hover {
  transform: translateY(-2px);
}

.edit-button:hover {
  background-color: rgba(52, 152, 219, 0.1);
  color: #3498db;
}

.delete-button:hover {
  background-color: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
}

/* Estilos para fila vacía */
.empty-row {
  height: 200px;
}

.empty-message {
  text-align: center;
}

.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #6c757d;
  padding: 40px 0;
}

.empty-content svg {
  opacity: 0.4;
  margin-bottom: 16px;
}

/* Estilos para el generador de contraseñas */
.password-input-group {
  display: flex;
  align-items: center;
  position: relative;
}

.password-input {
  flex-grow: 1;
  padding-right: 45px; /* Espacio para el botón */
}

.generate-password-button {
  position: absolute;
  right: 10px;
  border: none;
  background-color: transparent;
  color: #6c757d;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border-radius: 4px;
  transition: all 0.3s ease;
  height: 36px;
  width: 36px;
}

.generate-password-button:hover {
  background-color: rgba(193, 39, 45, 0.1);
  color: #c1272d;
}

.generate-password-button svg {
  width: 18px;
  height: 18px;
}

/* Modal */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

.modal-container {
  background-color: white;
  border-radius: 16px;
  width: 500px;
  max-width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
  animation: slideUp 0.3s ease;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #dee2e6;
  position: sticky; /* Mantener el encabezado visible al hacer scroll */
  top: 0;
  background: white;
  z-index: 5;
}

.modal-header h2 {
  font-size: 20px;
  color: #2c3e50;
  margin: 0;
}

.modal-close-button {
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.modal-close-button:hover {
  color: #e74c3c;
  background-color: rgba(231, 76, 60, 0.1);
}

.modal-form {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  font-size: 14px;
  color: #2c3e50;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 12px 32px;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #c1272d;
  box-shadow: 0 0 0 3px rgba(193, 39, 45, 0.1);
}

.form-textarea {
  min-height: 100px;
  resize: vertical;
}

.form-hint {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: #6c757d;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 15px 24px;
  border-top: 1px solid #f5f5f5;
  position: sticky; /* Mantener el footer visible al hacer scroll */
  bottom: 0;
  background: white;
  z-index: 5;
}

.modal-button {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  border: none;
  transition: all 0.3s ease;
  cursor: pointer;
}

.cancel-button {
  background-color: #e9ecef;
  color: #333;
}

.cancel-button:hover {
  background-color: #dee2e6;
}

.save-button {
  background-color: #c1272d;
  color: white;
}

.save-button:hover {
  background-color: #a01218;
}

.delete-button {
  background-color: #e74c3c;
  color: white;
}

.delete-button:hover {
  background-color: #c0392b;
}

/* Modal de confirmación de eliminación */
.delete-confirm-modal {
  width: 400px;
}

.delete-header {
  color: #e74c3c;
}

.modal-body {
  padding: 24px;
  text-align: center;
}

.delete-warning-icon {
  color: #e74c3c;
  margin-bottom: 16px;
}

.delete-warning {
  color: #e74c3c;
  font-size: 14px;
  margin-top: 8px;
}

/* Estilo para checkboxes */
.checkbox-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.custom-checkbox {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.checkbox-label {
  position: relative;
  cursor: pointer;
  width: 18px;
  height: 18px;
  background-color: #fff;
  border: 2px solid #dee2e6;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.custom-checkbox:checked + .checkbox-label {
  background-color: #c1272d;
  border-color: #c1272d;
}

.custom-checkbox:checked + .checkbox-label:after {
  content: "";
  position: absolute;
  left: 5px;
  top: 2px;
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.custom-checkbox:focus + .checkbox-label {
  box-shadow: 0 0 0 3px rgba(193, 39, 45, 0.1);
}

/* Sistema de notificaciones */
.notifications-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 350px;
}

.notification {
  display: flex;
  align-items: center;
  padding: 16px;
  border-radius: 8px;
  color: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  animation: slideInRight 0.3s ease;
}

.notification-success {
  background-color: #2ecc71;
}

.notification-error {
  background-color: #e74c3c;
}

.notification-info {
  background-color: #3498db;
}

.notification-warning {
  background-color: #f39c12;
}

.notification-icon {
  margin-right: 16px;
}

.notification-content {
  flex-grow: 1;
}

.notification-close {
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  opacity: 0.7;
  cursor: pointer;
}

.notification-close:hover {
  opacity: 1;
}

/* Animaciones */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Responsive */
@media (max-width: 1024px) {
  .header-actions {
    flex-wrap: wrap;
  }

  .search-input {
    width: 200px;
  }
}

@media (max-width: 768px) {
  .clients-grid {
    grid-template-columns: 1fr;
  }

  .content-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .header-left {
    max-width: 100%;
  }

  .header-actions {
    width: 100%;
    justify-content: space-between;
  }

  .data-card {
    flex-basis: 100%;
  }

  .modal-container {
    width: 95%;
    max-height: 85vh;
  }

  .client-name-label {
    max-width: 220px;
  }
}

@media (max-width: 576px) {
  .column-clients {
    display: none;
  }

  .user-avatar {
    width: 30px;
    height: 30px;
    font-size: 12px;
  }

  .data-table td,
  .data-table th {
    padding: 12px 8px;
  }
}
</style>
