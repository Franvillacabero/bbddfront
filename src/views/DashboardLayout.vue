<template>
  <div class="dashboard-layout">
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
        <button
          v-for="(section, index) in sections"
          :key="index"
          @click="activeSection = section.id"
          :class="{ active: activeSection === section.id }"
          class="menu-item"
        >
          <span class="menu-icon" v-html="section.icon"></span>
          <span class="menu-text">{{ section.label }}</span>
        </button>
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
        <component :is="Component" />
      </router-view>
    </main>
  </div>
</template>

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
    label: "Registros",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"></path>
            <line x1="12" y1="5" x2="12" y2="12"></line>
            <line x1="12" y1="12" x2="16.5" y2="16.5"></line>
          </svg>`,
  },
];
const activeSection = ref(sections[0].id);

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

<style scoped>
/* Aquí van los estilos del layout */
.dashboard-layout {
  display: flex;
  min-height: 100vh;
  background-color: #f8f9fa;
}

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

.main-content {
  flex-grow: 1;
  margin-left: 280px;
  padding: 30px;
}
</style>
