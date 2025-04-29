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

    // Estado para Tipos de Servicio
    const tiposServicios = ref([]);
    const showTipoServicioModal = ref(false);
    const isEditingTipoServicio = ref(false);
    const currentTipoServicio = ref({
      id_TipoServicio: null,
      nombre: "",
    });

    // Referencias para el desplazamiento horizontal
    const tableContainer = ref(null);
    const isDragging = ref(false);
    const startX = ref(0);
    const scrollLeft = ref(0);

    // Métodos para el desplazamiento horizontal
    const handleMouseDown = (e) => {
      isDragging.value = true;
      startX.value = e.pageX - tableContainer.value.offsetLeft;
      scrollLeft.value = tableContainer.value.scrollLeft;
      tableContainer.value.style.cursor = "grabbing";
    };

    const handleMouseLeave = () => {
      isDragging.value = false;
      tableContainer.value.style.cursor = "grab";
    };

    const handleMouseUp = () => {
      isDragging.value = false;
      tableContainer.value.style.cursor = "grab";
    };

    const handleMouseMove = (e) => {
      if (!isDragging.value) return;
      e.preventDefault();
      const x = e.pageX - tableContainer.value.offsetLeft;
      const walk = (x - startX.value) * 1.5; // Multiplicador para ajustar velocidad
      tableContainer.value.scrollLeft = scrollLeft.value - walk;
    };

    // Estado para modal de confirmación de eliminación
    const showDeleteConfirmModal = ref(false);
    const deleteItemId = ref(null);
    const deleteItemName = ref("");

    // Notificaciones
    const notifications = ref([]);

    // Cargar tipos de servicio
    const fetchTiposServicios = async () => {
      try {
        const response = await fetch(
          "https://152.228.135.50/api/TipoServicio",
          {
            method: "GET",
            headers: { accept: "*/*" },
          }
        );

        if (!response.ok) {
          throw new Error("No se pudieron cargar los tipos de servicio");
        }

        tiposServicios.value = await response.json();
        showNotification("Tipos de servicio cargados correctamente", "info");
      } catch (error) {
        console.error("Error al cargar tipos de servicio:", error);
        showNotification("Error al cargar los tipos de servicio", "error");
      }
    };

    // Método de notificación
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

    // Filtrar tipos de servicio según la búsqueda
    const filteredTiposServicios = computed(() => {
      const query = searchQuery.value.toLowerCase().trim();
      if (!query) return tiposServicios.value;

      return tiposServicios.value.filter(
        (tipo) =>
          tipo.nombre.toLowerCase().includes(query) ||
          tipo.id_TipoServicio.toString().includes(query)
      );
    });

    // Ordenar tipos de servicio alfabéticamente
    const sortedTiposServicios = computed(() => {
      return [...tiposServicios.value].sort((a, b) =>
        a.nombre.localeCompare(b.nombre)
      );
    });

    // Método para obtener iniciales de servicio
    const getServiceInitial = (name) => {
      if (!name) return "S";
      return name.charAt(0).toUpperCase();
    };

    // Método para abrir modal de Tipo de Servicio
    const openTipoServicioModal = (tipoServicio) => {
      // Solo admin puede abrir modal de tipos de servicio
      if (!props.isAdmin) {
        showNotification("No tienes permisos para esta acción", "error");
        return;
      }

      if (tipoServicio) {
        currentTipoServicio.value = { ...tipoServicio };
        isEditingTipoServicio.value = true;
      } else {
        currentTipoServicio.value = {
          id_TipoServicio: null,
          nombre: "",
        };
        isEditingTipoServicio.value = false;
      }
      showTipoServicioModal.value = true;
    };

    // Guardar Tipo de Servicio
    const saveTipoServicio = async () => {
      // Solo admin puede crear/editar tipos de servicio
      if (!props.isAdmin) {
        showNotification("No tienes permisos para esta acción", "error");
        return;
      }

      try {
        const url = isEditingTipoServicio.value
          ? `https://152.228.135.50/api/TipoServicio/${currentTipoServicio.value.id_TipoServicio}`
          : "https://152.228.135.50/api/TipoServicio";

        const method = isEditingTipoServicio.value ? "PUT" : "POST";

        const response = await fetch(url, {
          method: method,
          headers: {
            "Content-Type": "application/json",
            accept: "*/*",
          },
          body: JSON.stringify(currentTipoServicio.value),
        });

        if (!response.ok) {
          throw new Error("Error al guardar el tipo de servicio");
        }

        await fetchTiposServicios();
        closeTipoServicioModal();

        const message = isEditingTipoServicio.value
          ? `Tipo de servicio "${currentTipoServicio.value.nombre}" actualizado con éxito`
          : `Tipo de servicio "${currentTipoServicio.value.nombre}" creado con éxito`;

        showNotification(message, "success");
      } catch (error) {
        console.error("Error:", error);
        showNotification("Error al guardar el tipo de servicio", "error");
      }
    };

    // Método para cerrar modal de Tipo de Servicio
    const closeTipoServicioModal = () => {
      showTipoServicioModal.value = false;
    };

    // Eliminar Tipo de Servicio
    const deleteTipoServicio = async (id) => {
      // Solo admin puede eliminar tipos de servicio
      if (!props.isAdmin) {
        showNotification("No tienes permisos para esta acción", "error");
        return;
      }

      try {
        const servicioToDelete = tiposServicios.value.find(
          (s) => s.id_TipoServicio === id
        );
        const servicioName = servicioToDelete
          ? servicioToDelete.nombre
          : "desconocido";

        const response = await fetch(
          `https://152.228.135.50/api/TipoServicio/${id}`,
          {
            method: "DELETE",
            headers: { accept: "*/*" },
          }
        );

        if (!response.ok) {
          throw new Error("No se pudo eliminar el tipo de servicio");
        }

        await fetchTiposServicios();
        const message = `Tipo de servicio "${servicioName}" eliminado con éxito`;
        showNotification(message, "success");
      } catch (error) {
        console.error("Error al eliminar tipo de servicio:", error);
        showNotification("Error al eliminar el tipo de servicio", "error");
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

    // Cargar tipos de servicio al montar el componente
    onMounted(() => {
      fetchTiposServicios();
    });

    return {
      // Estado
      searchQuery,
      tiposServicios,
      filteredTiposServicios,
      sortedTiposServicios,
      showTipoServicioModal,
      isEditingTipoServicio,
      currentTipoServicio,
      showDeleteConfirmModal,
      deleteItemName,
      notifications,
      tableContainer,
      isDragging,

      // Métodos para el desplazamiento
      handleMouseDown,
      handleMouseLeave,
      handleMouseUp,
      handleMouseMove,

      // Métodos
      openTipoServicioModal,
      saveTipoServicio,
      closeTipoServicioModal,
      deleteTipoServicio,
      confirmDelete,
      closeDeleteConfirmModal,
      fetchTiposServicios,
      showNotification,
      removeNotification,

      // Utilidades
      getServiceInitial,
    };
  },
};
</script>

<template>
  <div class="data-section">
    <div class="data-cards">
      <div class="data-card">
        <div class="card-content">
          <div class="card-icon services-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
              ></path>
              <path d="M14 2v6h6"></path>
              <path d="M16 13H8"></path>
              <path d="M16 17H8"></path>
              <path d="M10 9H8"></path>
            </svg>
          </div>
          <div class="card-info">
            <h3>Total Servicios</h3>
            <p class="card-value">{{ tiposServicios.length }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="content-header">
      <div class="header-left">
        <h1 class="page-title">Gestión de Tipos de Servicio</h1>
        <p class="page-subtitle">
          Total: {{ tiposServicios.length }} tipos de servicio
        </p>
      </div>
      <div class="header-actions">
        <div class="search-container">
          <input
            type="text"
            placeholder="Buscar tipo de servicio..."
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
          @click="openTipoServicioModal(null)"
          class="create-button"
        >
          <span class="button-icon">+</span>
          <span>Nuevo Tipo</span>
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
            <th class="column-name">Nombre del Servicio</th>
            <th v-if="isAdmin" class="column-actions">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="tipoServicio in filteredTiposServicios"
            :key="tipoServicio.id_TipoServicio"
            class="data-row"
          >
            <td class="column-name">
              <div class="service-info">
                <div class="service-avatar">
                  {{ getServiceInitial(tipoServicio.nombre) }}
                </div>
                <span class="service-name">{{ tipoServicio.nombre }}</span>
              </div>
            </td>
            <td v-if="isAdmin" class="column-actions">
              <div class="action-buttons">
                <button
                  @click="openTipoServicioModal(tipoServicio)"
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
                    confirmDelete(
                      tipoServicio.id_TipoServicio,
                      tipoServicio.nombre
                    )
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
          <tr v-if="filteredTiposServicios.length === 0" class="empty-row">
            <td :colspan="isAdmin ? 2 : 1" class="empty-message">
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
                <p>No se encontraron tipos de servicio</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal para Tipos de Servicio -->
    <div v-if="showTipoServicioModal" class="modal-backdrop">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h2>
            {{
              isEditingTipoServicio
                ? "Editar Tipo de Servicio"
                : "Crear Nuevo Tipo de Servicio"
            }}
          </h2>
          <button @click="closeTipoServicioModal" class="modal-close-button">
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
        <form @submit.prevent="saveTipoServicio" class="modal-form">
          <div class="form-group">
            <label for="nombreServicio">Nombre del Servicio</label>
            <input
              id="nombreServicio"
              v-model="currentTipoServicio.nombre"
              placeholder="Ingrese el nombre del servicio"
              required
              class="form-input"
            />
          </div>

          <div class="modal-footer">
            <button
              type="button"
              @click="closeTipoServicioModal"
              class="modal-button cancel-button"
            >
              Cancelar
            </button>
            <button type="submit" class="modal-button save-button">
              {{ isEditingTipoServicio ? "Actualizar" : "Crear" }}
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
            @click="deleteTipoServicio(deleteItemId)"
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
/* Estilos para el contenedor arrastrable */
.draggable {
  cursor: grab;
  overflow-x: auto;
  user-select: none;
  max-height: 70vh;
  overflow-y: auto;
}

.draggable:active {
  cursor: grabbing;
}

/* Ajuste en la tabla para mantener fijo el encabezado */
.table-container {
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  margin-bottom: 30px;
  position: relative;
}

.data-table {
  width: 100%;
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
  font-size: 14px;
  text-align: left;
  padding: 16px 24px;
  border-bottom: 1px solid #dee2e6;
}

.data-table td {
  padding: 16px 24px;
  border-bottom: 1px solid #dee2e6;
  font-size: 14px;
}

.data-table tr:last-child td {
  border-bottom: none;
}

.data-row {
  transition: all 0.3s ease;
}

.data-row:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

/* Estilos para servicio */
.service-info {
  display: flex;
  align-items: center;
}

.service-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: rgba(155, 89, 182, 0.1);
  color: #9b59b6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-right: 12px;
}

.service-name {
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

.services-icon {
  background-color: rgba(155, 89, 182, 0.1);
  color: #9b59b6;
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

/* Estilos para modales */
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
}

@media (max-width: 576px) {
  .service-avatar {
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
