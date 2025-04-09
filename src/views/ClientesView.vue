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

    // Estado para Clientes
    const clientes = ref([]);
    const showClientModal = ref(false);
    const isEditingClient = ref(false);
    const currentCliente = ref({
      id_Cliente: null,
      nombre_Empresa: "",
      fechaRegistro: new Date().toISOString(),
    });

    // Estado para modal de confirmación de eliminación
    const showDeleteConfirmModal = ref(false);
    const deleteItemId = ref(null);
    const deleteItemName = ref("");

    // Cargar clientes
    const fetchClientes = async () => {
      try {
        // Si no es admin, solo traer los clientes autorizados
        const clientesAutorizados = JSON.parse(
          localStorage.getItem("clientesAutorizados") || "[]"
        );

        if (!props.isAdmin) {
          const clienteFetches = clientesAutorizados.map(async (clienteId) => {
            const response = await fetch(
              `http://152.228.135.50:5006/api/Cliente/${clienteId}`,
              {
                method: "GET",
                headers: { accept: "*/*" },
              }
            );

            if (!response.ok) {
              throw new Error(`No se pudo cargar el cliente ${clienteId}`);
            }

            return response.json();
          });

          clientes.value = await Promise.all(clienteFetches);
        } else {
          // Si es admin, traer todos los clientes
          const response = await fetch(
            "http://152.228.135.50:5006/api/Cliente",
            {
              method: "GET",
              headers: { accept: "*/*" },
            }
          );

          if (!response.ok) {
            throw new Error("No se pudieron cargar los clientes");
          }

          clientes.value = await response.json();
        }

        showNotification("Clientes cargados correctamente", "info");
      } catch (error) {
        console.error("Error al cargar clientes:", error);
        showNotification("Error al cargar los clientes", "error");
      }
    };

    // Métodos de notificación
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

    // Filtrar clientes según la búsqueda
    const filteredClientes = computed(() => {
      const query = searchQuery.value.toLowerCase().trim();
      const clientesAutorizados = JSON.parse(
        localStorage.getItem("clientesAutorizados") || "[]"
      );

      let resultClientes = props.isAdmin
        ? clientes.value
        : clientes.value.filter((cliente) =>
            clientesAutorizados.includes(cliente.id_Cliente)
          );

      if (!query) return resultClientes;

      return resultClientes.filter(
        (cliente) =>
          cliente.nombre_Empresa.toLowerCase().includes(query) ||
          cliente.id_Cliente.toString().includes(query)
      );
    });

    // Ordenar clientes alfabéticamente
    const sortedClientes = computed(() => {
      return [...clientes.value].sort((a, b) =>
        a.nombre_Empresa.localeCompare(b.nombre_Empresa)
      );
    });

    // Contar clientes recientes
    const getRecentClientsCount = () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      return clientes.value.filter((cliente) => {
        const registrationDate = new Date(cliente.fechaRegistro);
        return registrationDate >= thirtyDaysAgo;
      }).length;
    };

    // Método para formatear fecha
    const formatDate = (dateString) => {
      if (!dateString) return "N/A";

      return new Date(dateString).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    };

    // Método para obtener tiempo transcurrido
    const getTimeAgo = (dateString) => {
      if (!dateString) return "N/A";

      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return "Hoy";
      if (diffDays === 1) return "Ayer";
      if (diffDays < 30) return `Hace ${diffDays} días`;

      const diffMonths = Math.floor(diffDays / 30);
      if (diffMonths === 1) return "Hace 1 mes";
      if (diffMonths < 12) return `Hace ${diffMonths} meses`;

      const diffYears = Math.floor(diffMonths / 12);
      if (diffYears === 1) return "Hace 1 año";
      return `Hace ${diffYears} años`;
    };

    // Método para obtener iniciales de la empresa
    const getCompanyInitial = (name) => {
      if (!name) return "E";
      return name.charAt(0).toUpperCase();
    };

    // Método para abrir modal de Cliente
    const openClientModal = (cliente) => {
      // Solo admin puede abrir modal de clientes
      if (!props.isAdmin) {
        showNotification("No tienes permisos para esta acción", "error");
        return;
      }

      if (cliente) {
        currentCliente.value = { ...cliente };
        isEditingClient.value = true;
      } else {
        currentCliente.value = {
          id_Cliente: null,
          nombre_Empresa: "",
          fechaRegistro: new Date().toISOString(),
        };
        isEditingClient.value = false;
      }
      showClientModal.value = true;
    };

    // Guardar Cliente
    const saveCliente = async () => {
      // Solo admin puede crear/editar clientes
      if (!props.isAdmin) {
        showNotification("No tienes permisos para esta acción", "error");
        return;
      }

      try {
        const url = isEditingClient.value
          ? `http://152.228.135.50:5006/api/Cliente/${currentCliente.value.id_Cliente}`
          : "http://152.228.135.50:5006/api/Cliente";

        const method = isEditingClient.value ? "PUT" : "POST";

        const clienteData = isEditingClient.value
          ? currentCliente.value
          : {
              nombre_Empresa: currentCliente.value.nombre_Empresa,
              fechaRegistro: new Date().toISOString(),
            };

        const response = await fetch(url, {
          method: method,
          headers: {
            "Content-Type": "application/json",
            accept: "*/*",
          },
          body: JSON.stringify(clienteData),
        });

        if (!response.ok) {
          throw new Error("Error al guardar el cliente");
        }

        await fetchClientes();
        closeClientModal();

        const message = isEditingClient.value
          ? `Cliente "${clienteData.nombre_Empresa}" actualizado con éxito`
          : `Cliente "${clienteData.nombre_Empresa}" creado con éxito`;

        showNotification(message, "success");
      } catch (error) {
        console.error("Error:", error);
        showNotification("Error al guardar el cliente", "error");
      }
    };

    // Método para cerrar modal de Cliente
    const closeClientModal = () => {
      showClientModal.value = false;
    };

    // Eliminar Cliente
    const deleteCliente = async (id) => {
      // Solo admin puede eliminar clientes
      if (!props.isAdmin) {
        showNotification("No tienes permisos para esta acción", "error");
        return;
      }

      try {
        const clienteToDelete = clientes.value.find((c) => c.id_Cliente === id);
        const clienteName = clienteToDelete
          ? clienteToDelete.nombre_Empresa
          : "desconocido";

        const response = await fetch(
          `http://152.228.135.50:5006/api/Cliente/${id}`,
          {
            method: "DELETE",
            headers: { accept: "*/*" },
          }
        );

        if (!response.ok) {
          throw new Error("No se pudo eliminar el cliente");
        }

        await fetchClientes();
        const message = `Cliente "${clienteName}" eliminado con éxito`;
        showNotification(message, "success");
      } catch (error) {
        console.error("Error al eliminar cliente:", error);
        showNotification("Error al eliminar el cliente", "error");
      }
    };

    // Método de confirmación de eliminación
    const confirmDelete = (id, name) => {
      // Solo admin puede confirmar eliminación
      if (!props.isAdmin) {
        showNotification("No tienes permisos para esta acción", "error");
        return;
      }

      deleteItemId.value = id;
      deleteItemName.value = name;
      showDeleteConfirmModal.value = true;
    };

    const closeDeleteConfirmModal = () => {
      showDeleteConfirmModal.value = false;
    };

    // Cargar clientes al montar el componente
    onMounted(() => {
      fetchClientes();
    });

    return {
      // Estado
      searchQuery,
      clientes,
      filteredClientes,
      sortedClientes,
      showClientModal,
      isEditingClient,
      currentCliente,
      showDeleteConfirmModal,
      deleteItemName,
      notifications,

      // Métodos
      openClientModal,
      saveCliente,
      closeClientModal,
      deleteCliente,
      confirmDelete,
      closeDeleteConfirmModal,
      fetchClientes,
      showNotification,
      removeNotification,

      // Utilidades
      formatDate,
      getTimeAgo,
      getCompanyInitial,
      getRecentClientsCount,
    };
  },
};
</script>

<template>
  <div class="data-section">
    <div class="data-cards">
      <div class="data-card">
        <div class="card-content">
          <div class="card-icon clients-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 00-3-3.87"></path>
              <path d="M16 3.13a4 4 0 010 7.75"></path>
            </svg>
          </div>
          <div class="card-info">
            <h3>Total Clientes</h3>
            <p class="card-value">{{ clientes.length }}</p>
          </div>
        </div>
      </div>
      <div class="data-card">
        <div class="card-content">
          <div class="card-icon recent-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 6v6l4 2"></path>
            </svg>
          </div>
          <div class="card-info">
            <h3>Clientes Recientes</h3>
            <p class="card-value">{{ getRecentClientsCount() }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="content-header">
      <div class="header-left">
        <h1 class="page-title">Gestión de Clientes</h1>
        <p class="page-subtitle">
          Total: {{ clientes.length }} clientes registrados
        </p>
      </div>
      <div class="header-actions">
        <div class="search-container">
          <input
            type="text"
            placeholder="Buscar cliente..."
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
        <button
          v-if="isAdmin"
          @click="openClientModal(null)"
          class="create-button"
        >
          <span class="button-icon">+</span>
          <span>Nuevo Cliente</span>
        </button>
      </div>
    </div>

    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th class="column-name">Nombre Empresa</th>
            <th class="column-date">Fecha Registro</th>
            <th v-if="isAdmin" class="column-actions">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="cliente in filteredClientes"
            :key="cliente.id_Cliente"
            class="data-row"
          >
            <td class="column-name">
              <div class="company-info">
                <div class="company-avatar">
                  {{ getCompanyInitial(cliente.nombre_Empresa) }}
                </div>
                <span class="company-name">{{ cliente.nombre_Empresa }}</span>
              </div>
            </td>
            <td class="column-date">
              <div class="date-info">
                <span class="date-value">
                  {{ formatDate(cliente.fechaRegistro) }}
                </span>
                <span class="date-ago">
                  {{ getTimeAgo(cliente.fechaRegistro) }}
                </span>
              </div>
            </td>
            <td v-if="isAdmin" class="column-actions">
              <div class="action-buttons">
                <button
                  @click="openClientModal(cliente)"
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
                  @click="
                    confirmDelete(cliente.id_Cliente, cliente.nombre_Empresa)
                  "
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
          <tr v-if="filteredClientes.length === 0" class="empty-row">
            <td :colspan="isAdmin ? 3 : 2" class="empty-message">
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
                <p>No se encontraron clientes</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal para Clientes -->
    <div v-if="showClientModal" class="modal-backdrop">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h2>
            {{ isEditingClient ? "Editar Cliente" : "Crear Nuevo Cliente" }}
          </h2>
          <button @click="closeClientModal" class="modal-close-button">
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
        <form @submit.prevent="saveCliente" class="modal-form">
          <div class="form-group">
            <label for="nombreEmpresa">Nombre de la Empresa</label>
            <input
              id="nombreEmpresa"
              v-model="currentCliente.nombre_Empresa"
              placeholder="Ingrese el nombre de la empresa"
              required
              class="form-input"
            />
          </div>

          <div class="modal-footer">
            <button
              type="button"
              @click="closeClientModal"
              class="modal-button cancel-button"
            >
              Cancelar
            </button>
            <button type="submit" class="modal-button save-button">
              {{ isEditingClient ? "Actualizar" : "Crear" }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal de Confirmación para Eliminar -->
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
            ¿Estás seguro de que deseas eliminar
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
            @click="deleteCliente(deleteItemId)"
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
</template>

<style scoped>
/* You can add any component-specific styles here if needed */
/* Most styles should already be in the main layout's CSS */

/* Notifications Container */
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

/* Animations */
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
</style>
