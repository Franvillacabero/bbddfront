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
      notas: "", // Añadimos el campo de notas
    });

    // Referencias para el desplazamiento horizontal
    const tableContainer = ref(null);
    const isDragging = ref(false);
    const startX = ref(0);
    const scrollLeft = ref(0);

    // Métodos para el desplazamiento horizontal
    const handleMouseDown = (e) => {
      if (tableContainer.value) {
        isDragging.value = true;
        startX.value = e.pageX - tableContainer.value.offsetLeft;
        scrollLeft.value = tableContainer.value.scrollLeft;
        tableContainer.value.style.cursor = "grabbing";
      }
    };

    const handleMouseLeave = () => {
      isDragging.value = false;
      if (tableContainer.value) {
        tableContainer.value.style.cursor = "grab";
      }
    };

    const handleMouseUp = () => {
      isDragging.value = false;
      if (tableContainer.value) {
        tableContainer.value.style.cursor = "grab";
      }
    };

    const handleMouseMove = (e) => {
      if (!isDragging.value) return;
      e.preventDefault();
      if (tableContainer.value) {
        const x = e.pageX - tableContainer.value.offsetLeft;
        const walk = (x - startX.value) * 1.5; // Multiplicador para ajustar velocidad
        tableContainer.value.scrollLeft = scrollLeft.value - walk;
      }
    };

    // Estado para modal de confirmación de eliminación
    const showDeleteConfirmModal = ref(false);
    const deleteItemId = ref(null);
    const deleteItemName = ref("");

    // Estado para modal de visualización de notas
    const showNotesModal = ref(false);
    const viewingNotes = ref({
      clienteName: "",
      notes: "",
    });

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
              `https://152.228.135.50/api/Cliente/${clienteId}`,
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
          const response = await fetch("https://152.228.135.50/api/Cliente", {
            method: "GET",
            headers: { accept: "*/*" },
          });

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
    // Modificación en la función computada de filteredClientes en ClientesView.vue
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

      if (query) {
        resultClientes = resultClientes.filter(
          (cliente) =>
            cliente.nombre_Empresa.toLowerCase().includes(query) ||
            cliente.id_Cliente.toString().includes(query) ||
            (cliente.notas && cliente.notas.toLowerCase().includes(query))
        );
      }

      // Ordenar alfabéticamente por nombre de empresa
      return [...resultClientes].sort((a, b) =>
        a.nombre_Empresa.localeCompare(b.nombre_Empresa)
      );
    });

    // Ordenar clientes alfabéticamente
    const sortedClientes = computed(() => {
      return [...clientes.value].sort((a, b) =>
        a.nombre_Empresa.localeCompare(b.nombre_Empresa)
      );
    });

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
          notas: "", // Inicializamos el campo de notas
        };
        isEditingClient.value = false;
      }
      showClientModal.value = true;
    };

    // Método para abrir modal de visualización de notas
    const openNotesModal = (cliente) => {
      viewingNotes.value = {
        clienteName: cliente.nombre_Empresa,
        notes: cliente.notas || "Sin notas",
      };
      showNotesModal.value = true;
    };

    // Método para cerrar modal de visualización de notas
    const closeNotesModal = () => {
      showNotesModal.value = false;
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
          ? `https://152.228.135.50/api/Cliente/${currentCliente.value.id_Cliente}`
          : "https://152.228.135.50/api/Cliente";

        const method = isEditingClient.value ? "PUT" : "POST";

        const clienteData = isEditingClient.value
          ? currentCliente.value
          : {
              nombre_Empresa: currentCliente.value.nombre_Empresa,
              fechaRegistro: new Date().toISOString(),
              notas: currentCliente.value.notas || "", // Incluimos las notas
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
    const deleteCliente = async () => {
      // Solo admin puede eliminar clientes
      if (!props.isAdmin) {
        showNotification("No tienes permisos para esta acción", "error");
        return;
      }

      try {
        // Obtenemos explícitamente el ID del estado reactivo
        const id = deleteItemId.value;

        if (!id) {
          throw new Error("ID de cliente no válido");
        }

        console.log("Eliminando cliente con ID:", id);

        const clienteToDelete = clientes.value.find((c) => c.id_Cliente === id);
        const clienteName = clienteToDelete
          ? clienteToDelete.nombre_Empresa
          : "desconocido";

        const response = await fetch(
          `https://152.228.135.50/api/Cliente/${id}`,
          {
            method: "DELETE",
            headers: { accept: "*/*" },
          }
        );

        if (!response.ok) {
          throw new Error("No se pudo eliminar el cliente");
        }

        await fetchClientes();
        closeDeleteConfirmModal();
        showNotification(
          `Cliente "${clienteName}" eliminado con éxito`,
          "success"
        );
      } catch (error) {
        console.error("Error al eliminar cliente:", error);
        showNotification(
          `Error al eliminar el cliente: ${error.message}`,
          "error"
        );
      }
    };
    // Método de confirmación de eliminación
    const confirmDelete = (id, name) => {
      // Solo admin puede confirmar eliminación
      if (!props.isAdmin) {
        showNotification("No tienes permisos para esta acción", "error");
        return;
      }

      // Asegurarse de que el ID es un número
      deleteItemId.value = parseInt(id);
      deleteItemName.value = name;
      showDeleteConfirmModal.value = true;
    };

    const closeDeleteConfirmModal = () => {
      showDeleteConfirmModal.value = false;
    };

    // Verificar si un cliente tiene notas
    const hasNotes = (cliente) => {
      return cliente.notas && cliente.notas.trim() !== "";
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
      showNotesModal,
      viewingNotes,
      tableContainer,
      isDragging,

      // Métodos para el desplazamiento
      handleMouseDown,
      handleMouseLeave,
      handleMouseUp,
      handleMouseMove,

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
      openNotesModal,
      closeNotesModal,
      hasNotes,

      // Utilidades
      formatDate,
      getTimeAgo,
      getCompanyInitial,
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
    </div>

    <div class="content-header">
  <div class="header-left">
    <h1 class="page-title">Gestión de Clientes</h1>
    <!-- Eliminamos la línea redundante del total -->
  </div>
  <div class="header-actions">
    <div class="total-clients-card">
      <div class="card-content">
        <div class="card-icon clients-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="20"
            height="20"
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

    <div
      ref="tableContainer"
      class="table-container draggable"
      @mousedown="handleMouseDown"
      @mouseleave="handleMouseLeave"
      @mouseup="handleMouseUp"
      @mousemove="handleMouseMove"
    >
      <table class="data-table">
        <thead>
          <tr>
            <th class="column-name">Nombre Empresa</th>
            <th class="column-date">Fecha Registro</th>
            <th class="column-notes">Notas</th>
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
            <td class="column-notes">
              <div class="notes-cell">
                <span class="notes-preview">
                  {{
                    cliente.notas
                      ? cliente.notas.substring(0, 60) +
                        (cliente.notas.length > 60 ? "..." : "")
                      : "Sin notas"
                  }}
                </span>
                <button
                  v-if="hasNotes(cliente)"
                  @click="openNotesModal(cliente)"
                  class="view-notes-button"
                  title="Ver notas completas"
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
                      d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                    ></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </button>
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
            <td :colspan="isAdmin ? 4 : 3" class="empty-message">
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

          <div class="form-group">
            <label for="notas">Notas</label>
            <textarea
              id="notas"
              v-model="currentCliente.notas"
              placeholder="Ingrese notas sobre el cliente"
              class="form-textarea"
              rows="3"
              maxlength="100"
            ></textarea>
            <small class="form-hint">Máximo 100 caracteres</small>
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

    <!-- Modal para Ver Notas -->
    <div v-if="showNotesModal" class="modal-backdrop">
      <div class="modal-container notes-modal" @click.stop>
        <div class="modal-header">
          <h2>Notas de {{ viewingNotes.clienteName }}</h2>
          <button @click="closeNotesModal" class="modal-close-button">
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
          <div class="notes-content">
            {{ viewingNotes.notes }}
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeNotesModal" class="modal-button cancel-button">
            Cerrar
          </button>
        </div>
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
          <button @click="deleteCliente" class="modal-button delete-button">
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
/* Estilos para las notificaciones */
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

/* Estilos para el contenedor arrastrable */
.draggable {
  cursor: grab;
  user-select: none;
}

.draggable:active {
  cursor: grabbing;
}

/* Estilos para la celda de notas y botón de visualización */
.notes-cell {
  display: flex;
  align-items: center;
  position: relative;
}

.notes-preview {
  flex-grow: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-right: 8px;
  color: #555;
  max-width: 380px;
  padding-right: 15px;
  text-align: left;
}

.view-notes-button {
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.view-notes-button:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: #c1272d;
}

/* Modal de notas */
.notes-modal {
  max-width: 600px;
}

.notes-content {
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-wrap: break-word;
  background-color: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  font-size: 15px;
  line-height: 1.5;
  min-height: 100px;
  max-width: 100%;
  color: #333;
  overflow-x: hidden;
}

/* Mejorar el estilo del modal para asegurar que el contenido largo no lo desborde */
.modal-body {
  overflow-x: hidden;
  word-break: break-word;
}

/* Estilos para el encabezado mejorado */
.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #2c3e50;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* Estilo de la tarjeta de Total Clientes */
.total-clients-card {
  display: flex;
  align-items: center;
  background-color: white;
  border-radius: 10px;
  padding: 8px 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  min-width: 150px;
}

.total-clients-card .card-content {
  display: flex;
  align-items: center;
  width: 100%;
}

.total-clients-card .card-icon {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  background-color: rgba(52, 152, 219, 0.1);
  color: #3498db;
}

.total-clients-card .card-info {
  flex-grow: 1;
}

.total-clients-card h3 {
  font-size: 12px;
  font-weight: 600;
  color: #6c757d;
  margin: 0 0 2px 0;
}

.total-clients-card .card-value {
  font-size: 18px;
  font-weight: 700;
  color: #2c3e50;
  margin: 0;
}

/* Estilos para la búsqueda */
.search-container {
  position: relative;
}

.search-input {
  background-color: #fff;
  border: 1px solid #dee2e6;
  border-radius: 50px;
  padding: 8px 16px 8px 36px;
  width: 220px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #c1272d;
  box-shadow: 0 0 0 3px rgba(193, 39, 45, 0.1);
  width: 250px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
}

/* Estilo para el botón de creación */
.create-button {
  display: flex;
  align-items: center;
  background-color: #c1272d;
  color: white;
  border: none;
  border-radius: 50px;
  padding: 8px 16px;
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
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Tabla más compacta */
.table-container {
  background-color: white;
  border-radius: 12px; /* Reducido de 16px */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px; /* Reducido de 30px */
  position: relative;
  overflow-x: auto;
  max-height: 65vh; /* Ajustado para acomodar más contenido sin scroll */
  overflow-y: auto;
}

/* Asegurarse de que la tabla tenga un ancho mínimo */
.data-table {
  width: 100%;
  min-width: 800px; /* Asegura que la tabla sea suficientemente ancha para forzar el scroll */
  border-collapse: separate;
  border-spacing: 0;
}

.data-table thead {
  position: sticky;
  top: 0;
  z-index: 1;
  background-color: #f8f9fa;
}

.data-table th {
  background-color: #f8f9fa;
  color: #6c757d;
  font-weight: 600;
  font-size: 13px; /* Reducido de 14px */
  text-align: left;
  padding: 12px 20px; /* Reducido de 16px 24px */
  border-bottom: 1px solid #dee2e6;
}

.data-row {
  transition: all 0.3s ease;
}

.data-row:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.data-table td {
  padding: 10px 20px; /* Reducido de 16px 24px */
  border-bottom: 1px solid #dee2e6;
  font-size: 13px; /* Reducido de 14px */
}

.data-table tr:last-child td {
  border-bottom: none;
}

/* Ajustar anchos de columnas */
.column-name {
  width: 30%;
}

.column-date {
  width: 20%;
}

.column-notes {
  width: 35%;
}

.column-actions {
  width: 15%;
}

/* Ajustar espacio entre filas */
.data-table tr {
  transition: background-color 0.2s ease;
}

.data-table tr:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

/* Company info más compacto */
.company-info {
  display: flex;
  align-items: center;
}

.company-avatar {
  width: 32px; /* Reducido de 36px */
  height: 32px; /* Reducido de 36px */
  border-radius: 50%;
  background-color: rgba(193, 39, 45, 0.1);
  color: #c1272d;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-right: 12px;
  font-size: 14px; /* Reducido */
}

.company-name {
  font-weight: 600;
}

/* Date info */
.date-info {
  display: flex;
  flex-direction: column;
}

.date-value {
  font-weight: 600;
}

.date-ago {
  font-size: 12px;
  color: #6c757d;
}

/* Estilos para acciones */
.action-buttons {
  display: flex;
  gap: 8px;
}

.action-button {
  border: none;
  background: none;
  width: 32px; /* Reducido de 36px */
  height: 32px; /* Reducido de 36px */
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

/* Reducir el espacio de la fila vacía */
.empty-row {
  height: 160px; /* Reducido de 200px */
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

/* Modals */
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
}

.modal-header h2 {
  font-size: 20px;
  color: #2c3e50;
}

.modal-close-button {
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
  transition: all 0.3s ease;
}

.modal-close-button:hover {
  color: #e74c3c;
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
  padding: 12px 16px;
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
  margin-top: 24px;
  margin: 15px;
}

.modal-button {
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  border: none;
  transition: all 0.3s ease;
}

.cancel-button {
  background-color: #e9ecef;
  color: #333;
}

.cancel-button:hover {
  background-color: #343a40;
  color: white;
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

.delete-warning-icon {
  color: #e74c3c;
  margin-bottom: 16px;
}

.delete-warning {
  color: #e74c3c;
  font-size: 14px;
  margin-top: 8px;
}

/* Ajustar espacio entre elementos */
.data-section {
  margin-bottom: 20px; /* Reducido de 40px */
}

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

/* Responsive */
@media (max-width: 1024px) {
  .header-actions {
    flex-wrap: wrap;
  }
}

@media (max-width: 768px) {
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
    flex-wrap: wrap;
  }
  
  .total-clients-card {
    order: -1;
    margin-bottom: 10px;
  }
  
  .search-container {
    flex-grow: 1;
  }
  
  .search-input {
    width: 100%;
  }
}

@media (max-width: 576px) {
  .column-notes {
    display: none;
  }

  .company-avatar {
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