<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const username = ref(localStorage.getItem("username") || "Admin");
const isAdmin = localStorage.getItem("esAdmin") === "true";

// Secciones del menú
const sections = [
  {
    id: "clientes",
    route: "/dashboard/clientes",
    label: "Clientes",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 00-3-3.87"></path>
            <path d="M16 3.13a4 4 0 010 7.75"></path>
          </svg>`,
  },
  {
    id: "tipoServicios",
    route: "/dashboard/tipos-servicio",
    label: "Tipos de Servicio",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path>
            <path d="M14 2v6h6"></path>
            <path d="M16 13H8"></path>
            <path d="M16 17H8"></path>
            <path d="M10 9H8"></path>
          </svg>`,
  },
  {
    id: "registros",
    route: "/dashboard/registros",
    label: "Registros",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"></path>
            <line x1="12" y1="5" x2="12" y2="12"></line>
            <line x1="12" y1="12" x2="16.5" y2="16.5"></line>
          </svg>`,
  },
  {
    id: "usuarios",
    route: "/dashboard/usuarios",
    label: "Usuarios",
    adminOnly: true,
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>`,
  },
];

// Método de logout
const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  localStorage.removeItem("esAdmin");
  localStorage.removeItem("clientesAutorizados");
  router.push("/");
};

// Método para obtener iniciales
const getInitials = () => {
  if (!username.value) return "A";
  return username.value.charAt(0).toUpperCase();
};
</script>

<template>
  <div class="dashboard-container">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo-container">
          <span class="logo-text">Netymedia</span>
        </div>
        <div class="user-info">
          <div class="avatar">{{ getInitials() }}</div>
          <div class="user-details">
            <span class="user-name">{{ username }}</span>
            <span class="user-role">
              {{ isAdmin ? "Administrador" : "Usuario" }}
            </span>
          </div>
        </div>
      </div>

      <nav class="sidebar-menu">
        <router-link
          v-for="section in sections.filter((s) => !s.adminOnly || isAdmin)"
          :key="section.id"
          :to="section.route"
          class="menu-item"
          active-class="active"
        >
          <span class="menu-icon" v-html="section.icon"></span>
          <span class="menu-text">{{ section.label }}</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <button @click="logout" class="logout-button">
          <span class="logout-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"></path>
              <path d="M16 17l5-5-5-5"></path>
              <path d="M21 12H9"></path>
            </svg>
          </span>
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>

    <!-- Main Content Area -->
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <component :is="Component" :is-admin="isAdmin" />
      </router-view>
    </main>
  </div>
</template>

<style scoped>
/* Estilos Generales */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* Layout Principal */
.dashboard-container {
  display: flex;
  min-height: 100vh;
  background-color: #f8f9fa;
}

/* Sidebar */
.sidebar {
  width: 280px;
  background: linear-gradient(180deg, #c1272d 0%, #a01218 100%);
  color: white;
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 10;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.sidebar-header {
  padding: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo-container {
  margin-bottom: 24px;
  text-align: center;
}

.logo-text {
  font-size: 24px;
  font-weight: bold;
  letter-spacing: 1px;
}

.user-info {
  display: flex;
  align-items: center;
  padding: 8px 0;
}

.avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 18px;
  margin-right: 12px;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 600;
  font-size: 14px;
}

.user-role {
  font-size: 12px;
  opacity: 0.8;
}

.sidebar-menu {
  flex-grow: 1;
  padding: 24px 0;
  overflow-y: auto;
}

.menu-item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 14px 24px;
  background: transparent;
  border: none;
  color: white;
  text-align: left;
  font-size: 14px;
  transition: all 0.3s ease;
}

.menu-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.menu-item.active {
  background-color: rgba(255, 255, 255, 0.2);
  font-weight: bold;
  position: relative;
}

.menu-item.active::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background-color: white;
}

.menu-icon {
  margin-right: 12px;
  display: inline-flex;
  align-items: center;
  color: inherit;
}

.sidebar-footer {
  padding: 20px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.logout-button {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  background-color: rgba(0, 0, 0, 0.2);
  color: white;
  border: none;
  font-size: 14px;
  transition: all 0.3s ease;
}

.logout-button:hover {
  background-color: rgba(0, 0, 0, 0.3);
}

.logout-icon {
  margin-right: 12px;
  display: flex;
  align-items: center;
}

/* Main Content */
.main-content {
  flex: a;
  padding: 30px;
  margin-left: 280px;
  width: calc(100% - 280px);
}

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

/* Dashboard Content */
.dashboard-content {
  margin-top: 30px;
}

.data-section {
  margin-bottom: 40px;
}

/* Filter Controls */
.filter-controls {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  background-color: white;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-group label {
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
}

.filter-select {
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid #dee2e6;
  font-size: 14px;
  color: #2c3e50;
  background-color: #fff;
  min-width: 180px;
}

.filter-select:focus {
  outline: none;
  border-color: #c1272d;
  box-shadow: 0 0 0 3px rgba(193, 39, 45, 0.1);
}

/* Data Cards */
.data-cards {
  display: flex;
  gap: 24px;
  margin-bottom: 24px; /* Reducido de 30px */
}

.data-card {
  background-color: white;
  border-radius: 12px; /* Reducido de 16px */
  padding: 16px; /* Reducido de 24px */
  flex: 1;
  min-width: 220px; /* Reducido de 240px */
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
  width: 48px; /* Reducido de 60px */
  height: 48px; /* Reducido de 60px */
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 14px; /* Reducido de 16px */
}

.clients-icon {
  background-color: rgba(52, 152, 219, 0.1);
  color: #3498db;
}

.recent-icon {
  background-color: rgba(46, 204, 113, 0.1);
  color: #2ecc71;
}

.services-icon {
  background-color: rgba(155, 89, 182, 0.1);
  color: #9b59b6;
}

.logs-icon {
  background-color: rgba(243, 156, 18, 0.1);
  color: #f39c12;
}

.today-icon {
  background-color: rgba(26, 188, 156, 0.1);
  color: #1abc9c;
}

.card-info {
  flex-grow: 1;
}

.card-info h3 {
  font-size: 14px; /* Reducido de 16px */
  font-weight: 600;
  color: #6c757d;
  margin-bottom: 4px; /* Reducido de 8px */
}

.card-value {
  font-size: 24px; /* Reducido de 32px */
  font-weight: 700;
  color: #2c3e50;
}

/* Table Container */
.table-container {
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

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
  padding: 16px 0px;
  border-bottom: 1px solid #dee2e6;
  font-size: 14px;
}

.data-table tr:last-child td {
  border-bottom: none;
}

/* Anchos de columnas */
.column-name {
  width: 40%;
}

.column-client {
  width: 18%;
}

.column-service {
  width: 18%;
}

.column-user {
  width: 15%;
}

.column-password {
  width: 15%;
}

.column-notes {
  width: 20%;
}

.column-date {
  width: 14%;
}

.column-actions {
  width: 100px;
}

/* Celda de contraseña */
.password-cell {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
}

.password-value {
  flex-grow: 1;
  font-family: monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
}

.password-actions {
  display: flex;
  align-items: center;
}

.copy-button,
.visibility-button {
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
  padding: 4px;
  margin-left: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.copy-button:hover,
.visibility-button:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: #c1272d;
}

.company-info,
.service-info,
.user-info-cell {
  display: flex;
  align-items: center;
}

.company-avatar,
.service-avatar,
.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: rgba(193, 39, 45, 0.1);
  color: #c1272d;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-right: 12px;
}

.company-name,
.service-name,
.user-name-cell {
  font-weight: 600;
}

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

/* Delete Confirmation Modal */
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

/* Notification System */
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

/* Responsive adjustments */
@media (max-width: 1024px) {
  .sidebar {
    width: 240px;
  }

  .main-content {
    margin-left: 240px;
    width: calc(100% - 240px);
  }

  .data-cards {
    flex-wrap: wrap;
  }

  .data-card {
    flex-basis: 48%;
  }
}

@media (max-width: 768px) {
  .sidebar {
    width: 70px;
  }

  .logo-text,
  .user-details,
  .menu-text {
    display: none;
  }

  .sidebar-header {
    padding: 16px 0;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .logo-container {
    margin-bottom: 16px;
  }

  .user-info {
    justify-content: center;
    padding: 0;
  }

  .avatar {
    margin-right: 0;
  }

  .menu-item {
    padding: 16px 0;
    justify-content: center;
  }

  .menu-icon {
    margin-right: 0;
  }

  .logout-button span:not(.logout-icon) {
    display: none;
  }

  .logout-button {
    justify-content: center;
    padding: 12px 0;
    min-width: 30px;
  }

  .logout-icon {
    margin-right: 0;
  }

  .main-content {
    margin-left: 70px;
    width: calc(100% - 70px);
    padding: 20px;
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

  .search-input {
    width: 180px;
  }

  .search-input:focus {
    width: 200px;
  }

  .data-card {
    flex-basis: 100%;
  }

  .filter-controls {
    flex-direction: column;
    gap: 10px;
  }

  /* Asegurar que notas y fecha sean visibles */
  .column-date,
  .column-notes {
    display: table-cell !important;
  }
}

/* Ajustes para pantallas muy pequeñas */
@media (max-width: 576px) {
  /* Aquí puedes decidir ocultar algunas columnas menos importantes si es necesario */
  .column-notes {
    display: none !important;
  }
}

/* Estilos para los botones de exportar y copiar */
.action-buttons-container {
  display: flex;
  gap: 10px;
  margin-left: auto;
}

.action-button-main {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #fff;
}

.action-button-main svg {
  margin-right: 8px;
}

.export-button {
  background-color: #27ae60;
}

.export-button:hover {
  background-color: #219653;
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.copy-all-button {
  background-color: #3498db;
}

.copy-all-button:hover {
  background-color: #2980b9;
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.selected-count {
  margin-left: 5px;
  font-size: 12px;
  opacity: 0.9;
}

/* Estilos para los checkboxes */
.column-checkbox {
  width: 40px;
  text-align: center;
}

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

/* Resaltar filas seleccionadas */
.row-selected {
  background-color: rgba(193, 39, 45, 0.05);
}

.row-selected:hover {
  background-color: rgba(193, 39, 45, 0.08);
}

/* Ajustes para responsive */
@media (max-width: 1024px) {
  .filter-controls {
    flex-wrap: wrap;
  }

  .action-buttons-container {
    margin-top: 10px;
    margin-left: 0;
    width: 100%;
    justify-content: flex-end;
  }
}

@media (max-width: 768px) {
  .action-button-main {
    padding: 8px 12px;
  }

  .action-button-main span:not(.selected-count) {
    display: none;
  }

  .action-button-main svg {
    margin-right: 0;
  }
}

/* Estilos para la celda de usuario */
.user-info-cell {
  display: flex;
  align-items: center;
  position: relative;
}

.user-name-cell {
  font-weight: 600;
  flex-grow: 1;
}

.user-info-cell .copy-button {
  visibility: hidden;
  opacity: 0;
  transition: visibility 0s, opacity 0.2s linear;
}

.user-info-cell:hover .copy-button {
  visibility: visible;
  opacity: 1;
}
</style>
