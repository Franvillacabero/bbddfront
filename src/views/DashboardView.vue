<!-- Template con filtros corregidos - utilizando datos reales de la API -->
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
            <span class="user-role">Administrador</span>
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
      <header class="content-header">
        <div class="header-left">
          <h1 class="page-title">
            {{
              activeSection === "clientes"
                ? "Gestión de Clientes"
                : activeSection === "tipoServicios"
                ? "Gestión de Tipos de Servicio"
                : "Gestión de Registros"
            }}
          </h1>
          <p class="page-subtitle">
            {{
              activeSection === "clientes"
                ? `Total: ${clientes.length} clientes registrados`
                : activeSection === "tipoServicios"
                ? `Total: ${tiposServicios.length} tipos de servicio`
                : `Total: ${registros.length} registros de actividad`
            }}
          </p>
        </div>
        <div class="header-actions">
          <div class="search-container">
            <input
              type="text"
              :placeholder="
                activeSection === 'clientes'
                  ? 'Buscar cliente...'
                  : activeSection === 'tipoServicios'
                  ? 'Buscar tipo de servicio...'
                  : 'Buscar registro...'
              "
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
            @click="
              activeSection === 'clientes'
                ? openClientModal(null)
                : activeSection === 'tipoServicios'
                ? openTipoServicioModal(null)
                : openRegistroModal(null)
            "
            class="create-button"
          >
            <span class="button-icon">+</span>
            <span>{{
              activeSection === "clientes"
                ? "Nuevo Cliente"
                : activeSection === "tipoServicios"
                ? "Nuevo Tipo"
                : "Nuevo Registro"
            }}</span>
          </button>
        </div>
      </header>

      <!-- Dashboard Content -->
      <div class="dashboard-content">
        <!-- Sección de Clientes -->
        <div v-if="activeSection === 'clientes'" class="data-section">
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

          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th class="column-id">ID</th>
                  <th class="column-name">Nombre Empresa</th>
                  <th class="column-date">Fecha Registro</th>
                  <th class="column-actions">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="cliente in filteredClientes"
                  :key="cliente.id_Cliente"
                  class="data-row"
                >
                  <td class="column-id">
                    <span class="id-badge">{{ cliente.id_Cliente }}</span>
                  </td>
                  <td class="column-name">
                    <div class="company-info">
                      <div class="company-avatar">
                        {{ getCompanyInitial(cliente.nombre_Empresa) }}
                      </div>
                      <span class="company-name">{{
                        cliente.nombre_Empresa
                      }}</span>
                    </div>
                  </td>
                  <td class="column-date">
                    <div class="date-info">
                      <span class="date-value">{{
                        formatDate(cliente.fechaRegistro)
                      }}</span>
                      <span class="date-ago">{{
                        getTimeAgo(cliente.fechaRegistro)
                      }}</span>
                    </div>
                  </td>
                  <td class="column-actions">
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
                          confirmDelete(
                            'cliente',
                            cliente.id_Cliente,
                            cliente.nombre_Empresa
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
                <tr v-if="filteredClientes.length === 0" class="empty-row">
                  <td colspan="4" class="empty-message">
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
        </div>

        <!-- Sección de Tipos de Servicio -->
        <div v-if="activeSection === 'tipoServicios'" class="data-section">
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

          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th class="column-id">ID</th>
                  <th class="column-name">Nombre del Servicio</th>
                  <th class="column-actions">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="tipoServicio in filteredTiposServicios"
                  :key="tipoServicio.id_TipoServicio"
                  class="data-row"
                >
                  <td class="column-id">
                    <span class="id-badge">{{
                      tipoServicio.id_TipoServicio
                    }}</span>
                  </td>
                  <td class="column-name">
                    <div class="service-info">
                      <div class="service-avatar">
                        {{ getServiceInitial(tipoServicio.nombre) }}
                      </div>
                      <span class="service-name">{{
                        tipoServicio.nombre
                      }}</span>
                    </div>
                  </td>
                  <td class="column-actions">
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
                            'tipoServicio',
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
                <tr
                  v-if="filteredTiposServicios.length === 0"
                  class="empty-row"
                >
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
                      <p>No se encontraron tipos de servicio</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Sección de Registros -->
        <div v-if="activeSection === 'registros'" class="data-section">
          <div class="data-cards">
            <div class="data-card">
              <div class="card-content">
                <div class="card-icon logs-icon">
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
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                </div>
                <div class="card-info">
                  <h3>Total Registros</h3>
                  <p class="card-value">{{ registros.length }}</p>
                </div>
              </div>
            </div>
            <div class="data-card">
              <div class="card-content">
                <div class="card-icon today-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    width="24"
                    height="24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <rect
                      x="3"
                      y="4"
                      width="18"
                      height="18"
                      rx="2"
                      ry="2"
                    ></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </div>
                <div class="card-info">
                  <h3>Registros Hoy</h3>
                  <p class="card-value">{{ getTodayRegistrosCount() }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="filter-controls">
            <div class="filter-group">
              <label>Filtrar por cliente:</label>
              <select v-model="registroClienteFiltro" class="filter-select">
                <option value="todos">Todos los clientes</option>
                <option
                  v-for="cliente in clientes"
                  :key="cliente.id_Cliente"
                  :value="cliente.id_Cliente"
                >
                  {{ cliente.nombre_Empresa }}
                </option>
              </select>
            </div>
            <div class="filter-group">
              <label>Filtrar por tipo de servicio:</label>
              <select
                v-model="registroTipoServicioFiltro"
                class="filter-select"
              >
                <option value="todos">Todos los tipos</option>
                <option
                  v-for="tipo in tiposServicios"
                  :key="tipo.id_TipoServicio"
                  :value="tipo.id_TipoServicio"
                >
                  {{ tipo.nombre }}
                </option>
              </select>
            </div>
            <div class="filter-group">
              <label>Ordenar por:</label>
              <select v-model="registroOrden" class="filter-select">
                <option value="newest">Más recientes primero</option>
                <option value="oldest">Más antiguos primero</option>
              </select>
            </div>
          </div>

          <div class="table-container">
            <table class="data-table logs-table">
              <thead>
                <tr>
                  <th class="column-id">ID</th>
                  <th class="column-desc">Cliente</th>
                  <th class="column-desc">Servicio</th>
                  <th class="column-user">Usuario</th>
                  <th class="column-desc">Notas</th>
                  <th class="column-date">Fecha</th>
                  <th class="column-actions">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="registro in filteredRegistros"
                  :key="registro.id_Registro"
                  class="data-row"
                >
                  <td class="column-id">
                    <span class="id-badge">{{ registro.id_Registro }}</span>
                  </td>
                  <td class="column-desc">
                    <span class="registro-desc">{{
                      getClienteName(registro.id_Cliente)
                    }}</span>
                  </td>
                  <td class="column-desc">
                    <span class="registro-desc">{{
                      getServicioName(registro.id_TipoServicio)
                    }}</span>
                  </td>
                  <td class="column-user">
                    <div class="user-info-cell">
                      <div class="user-avatar">
                        {{ getUserInitial(registro.usuario) }}
                      </div>
                      <span class="user-name-cell">{{ registro.usuario }}</span>
                    </div>
                  </td>
                  <td class="column-desc">
                    <span class="registro-desc">{{
                      registro.notas || "Sin notas"
                    }}</span>
                  </td>
                  <td class="column-date">
                    <div class="date-info">
                      <span class="date-value">{{
                        formatDate(registro.fechaCreacion)
                      }}</span>
                      <span class="date-ago">{{
                        getTimeAgo(registro.fechaCreacion)
                      }}</span>
                    </div>
                  </td>
                  <td class="column-actions">
                    <div class="action-buttons">
                      <button
                        @click="openRegistroModal(registro)"
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
                            'registro',
                            registro.id_Registro,
                            `Registro #${registro.id_Registro}`
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
                <tr v-if="filteredRegistros.length === 0" class="empty-row">
                  <td colspan="7" class="empty-message">
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
                      <p>No se encontraron registros</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>

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

    <!-- Modal para Registros -->
    <div v-if="showRegistroModal" class="modal-backdrop">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h2>
            {{ isEditingRegistro ? "Editar Registro" : "Crear Nuevo Registro" }}
          </h2>
          <button @click="closeRegistroModal" class="modal-close-button">
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
        <form @submit.prevent="saveRegistro" class="modal-form">
          <div class="form-group">
            <label for="clienteSelect">Cliente</label>
            <select
              id="clienteSelect"
              v-model="currentRegistro.id_Cliente"
              required
              class="form-select"
            >
              <option value="" disabled selected>Seleccione un cliente</option>
              <option
                v-for="cliente in clientes"
                :key="cliente.id_Cliente"
                :value="cliente.id_Cliente"
              >
                {{ cliente.nombre_Empresa }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="servicioSelect">Tipo de Servicio</label>
            <select
              id="servicioSelect"
              v-model="currentRegistro.id_TipoServicio"
              required
              class="form-select"
            >
              <option value="" disabled selected>
                Seleccione un tipo de servicio
              </option>
              <option
                v-for="servicio in tiposServicios"
                :key="servicio.id_TipoServicio"
                :value="servicio.id_TipoServicio"
              >
                {{ servicio.nombre }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="usuario">Usuario</label>
            <input
              id="usuario"
              v-model="currentRegistro.usuario"
              placeholder="Ingrese el usuario"
              required
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label for="password">Contraseña</label>
            <input
              id="password"
              v-model="currentRegistro.contraseña"
              type="password"
              placeholder="Ingrese la contraseña"
              :required="!isEditingRegistro"
              class="form-input"
            />
            <small v-if="isEditingRegistro" class="form-hint"
              >Dejar en blanco para mantener la contraseña actual</small
            >
          </div>

          <div class="form-group">
            <label for="notas">Notas</label>
            <textarea
              id="notas"
              v-model="currentRegistro.notas"
              placeholder="Ingrese notas adicionales"
              class="form-textarea"
              rows="3"
            ></textarea>
          </div>

          <div class="modal-footer">
            <button
              type="button"
              @click="closeRegistroModal"
              class="modal-button cancel-button"
            >
              Cancelar
            </button>
            <button type="submit" class="modal-button save-button">
              {{ isEditingRegistro ? "Actualizar" : "Crear" }}
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
          <button @click="executeDelete" class="modal-button delete-button">
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
// Script con filtros corregidos - usando datos reales de la API
<script>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";

export default {
  setup() {
    const router = useRouter();
    const username = ref(localStorage.getItem("username") || "Admin");

    // Estado para búsqueda
    const searchQuery = ref("");

    // Estado para notificaciones
    const notifications = ref([]);

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

    // Estado para Clientes
    const clientes = ref([]);
    const showClientModal = ref(false);
    const isEditingClient = ref(false);
    const currentCliente = ref({
      id_Cliente: null,
      nombre_Empresa: "",
      fechaRegistro: new Date().toISOString(),
    });

    // Estado para Tipos de Servicio
    const tiposServicios = ref([]);
    const showTipoServicioModal = ref(false);
    const isEditingTipoServicio = ref(false);
    const currentTipoServicio = ref({
      id_TipoServicio: null,
      nombre: "",
    });

    // Estado para Registros
    const registros = ref([]);
    const registroTipoServicioFiltro = ref("todos");
    const registroClienteFiltro = ref("todos");
    const registroOrden = ref("newest");
    const showRegistroModal = ref(false);
    const isEditingRegistro = ref(false);
    const currentRegistro = ref({
      id_Registro: null,
      id_Cliente: "",
      id_TipoServicio: "",
      usuario: "",
      contraseña: "",
      notas: "",
      fechaCreacion: new Date().toISOString(),
    });

    // Estado para modal de confirmación de eliminación
    const showDeleteConfirmModal = ref(false);
    const deleteType = ref("");
    const deleteItemId = ref(null);
    const deleteItemName = ref("");

    // Filtrar clientes según la búsqueda
    const filteredClientes = computed(() => {
      const query = searchQuery.value.toLowerCase().trim();
      if (!query) return clientes.value;

      return clientes.value.filter(
        (cliente) =>
          cliente.nombre_Empresa.toLowerCase().includes(query) ||
          cliente.id_Cliente.toString().includes(query)
      );
    });

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

    // Filtrar registros según búsqueda y filtros
    const filteredRegistros = computed(() => {
      let result = registros.value;

      // Aplicar filtro por tipo de servicio
      if (registroTipoServicioFiltro.value !== "todos") {
        result = result.filter(
          (registro) =>
            registro.id_TipoServicio == registroTipoServicioFiltro.value
        );
      }

      // Aplicar filtro por cliente
      if (registroClienteFiltro.value !== "todos") {
        result = result.filter(
          (registro) => registro.id_Cliente == registroClienteFiltro.value
        );
      }

      // Aplicar búsqueda
      const query = searchQuery.value.toLowerCase().trim();
      if (query) {
        result = result.filter(
          (registro) =>
            (registro.notas && registro.notas.toLowerCase().includes(query)) ||
            (registro.usuario &&
              registro.usuario.toLowerCase().includes(query)) ||
            registro.id_Registro.toString().includes(query) ||
            (getClienteName(registro.id_Cliente) &&
              getClienteName(registro.id_Cliente)
                .toLowerCase()
                .includes(query)) ||
            (getServicioName(registro.id_TipoServicio) &&
              getServicioName(registro.id_TipoServicio)
                .toLowerCase()
                .includes(query))
        );
      }

      // Ordenar por fecha
      result = [...result].sort((a, b) => {
        const dateA = new Date(a.fechaCreacion || 0);
        const dateB = new Date(b.fechaCreacion || 0);

        if (registroOrden.value === "newest") {
          return dateB - dateA;
        } else {
          return dateA - dateB;
        }
      });

      return result;
    });

    // Formatear fecha
    const formatDate = (dateString) => {
      if (!dateString) return "N/A";

      return new Date(dateString).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    };

    // Obtener tiempo transcurrido
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

    // Obtener nombre del cliente según ID
    const getClienteName = (id) => {
      if (!id) return "N/A";
      const cliente = clientes.value.find((c) => c.id_Cliente == id);
      return cliente ? cliente.nombre_Empresa : `Cliente #${id}`;
    };

    // Obtener nombre del servicio según ID
    const getServicioName = (id) => {
      if (!id) return "N/A";
      const servicio = tiposServicios.value.find(
        (s) => s.id_TipoServicio == id
      );
      return servicio ? servicio.nombre : `Servicio #${id}`;
    };

    // Obtener iniciales para avatar de usuario
    const getInitials = () => {
      if (!username.value) return "A";
      return username.value.charAt(0).toUpperCase();
    };

    // Obtener inicial para avatar de empresa
    const getCompanyInitial = (name) => {
      if (!name) return "E";
      return name.charAt(0).toUpperCase();
    };

    // Obtener inicial para avatar de servicio
    const getServiceInitial = (name) => {
      if (!name) return "S";
      return name.charAt(0).toUpperCase();
    };

    // Obtener inicial para avatar de usuario en registros
    const getUserInitial = (name) => {
      if (!name) return "U";
      return name.charAt(0).toUpperCase();
    };

    // Obtener cantidad de clientes registrados en los últimos 30 días
    const getRecentClientsCount = () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      return clientes.value.filter((cliente) => {
        const registrationDate = new Date(cliente.fechaRegistro);
        return registrationDate >= thirtyDaysAgo;
      }).length;
    };

    // Obtener cantidad de registros de hoy
    const getTodayRegistrosCount = () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      return registros.value.filter((registro) => {
        if (!registro.fechaCreacion) return false;
        const registroDate = new Date(registro.fechaCreacion);
        registroDate.setHours(0, 0, 0, 0);
        return registroDate.getTime() === today.getTime();
      }).length;
    };

    // Sistema de notificaciones
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

    // Métodos para Clientes
    const fetchClientes = async () => {
      try {
        const response = await fetch("http://152.228.135.50:5006/api/Cliente", {
          method: "GET",
          headers: { accept: "*/*" },
        });

        if (!response.ok) {
          throw new Error("No se pudieron cargar los clientes");
        }

        clientes.value = await response.json();
        showNotification("Clientes cargados correctamente", "info");
      } catch (error) {
        console.error("Error al cargar clientes:", error);
        showNotification("Error al cargar los clientes", "error");
      }
    };

    const openClientModal = (cliente) => {
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

    const saveCliente = async () => {
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

    const closeClientModal = () => {
      showClientModal.value = false;
    };

    // Métodos para Tipos de Servicio
    const fetchTiposServicios = async () => {
      try {
        const response = await fetch(
          "http://152.228.135.50:5006/api/TipoServicio",
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

    const openTipoServicioModal = (tipoServicio) => {
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

    const saveTipoServicio = async () => {
      try {
        const url = isEditingTipoServicio.value
          ? `http://152.228.135.50:5006/api/TipoServicio/${currentTipoServicio.value.id_TipoServicio}`
          : "http://152.228.135.50:5006/api/TipoServicio";

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

    const closeTipoServicioModal = () => {
      showTipoServicioModal.value = false;
    };

    // Métodos para Registros
    const fetchRegistros = async () => {
      try {
        const response = await fetch(
          "http://152.228.135.50:5006/api/Registro",
          {
            method: "GET",
            headers: { accept: "*/*" },
          }
        );

        if (!response.ok) {
          throw new Error("No se pudieron cargar los registros");
        }

        registros.value = await response.json();
        showNotification("Registros cargados correctamente", "info");
      } catch (error) {
        console.error("Error al cargar registros:", error);
        showNotification("Error al cargar los registros", "error");
      }
    };

    const openRegistroModal = (registro) => {
      if (registro) {
        // Para edición: copiar todos los datos EXCEPTO la contraseña
        currentRegistro.value = {
          ...registro,
          contraseña: "", // Limpiar contraseña para edición
        };
        isEditingRegistro.value = true;
      } else {
        // Para crear: inicializar con valores vacíos
        currentRegistro.value = {
          id_Registro: null,
          id_Cliente: "",
          id_TipoServicio: "",
          usuario: "",
          contraseña: "",
          notas: "",
          fechaCreacion: new Date().toISOString(),
        };
        isEditingRegistro.value = false;
      }
      showRegistroModal.value = true;
    };

    const saveRegistro = async () => {
      try {
        // Si estamos editando y no se proporcionó contraseña, evitamos enviarla
        // para mantener la contraseña existente
        let registroData = { ...currentRegistro.value };

        // Para crear un nuevo registro
        const url = isEditingRegistro.value
          ? `http://152.228.135.50:5006/api/Registro/${currentRegistro.value.id_Registro}`
          : "http://152.228.135.50:5006/api/Registro";

        const method = isEditingRegistro.value ? "PUT" : "POST";

        // Si estamos editando y no se proporcionó contraseña, la eliminamos del objeto
        // para que el backend mantenga la contraseña actual
        if (isEditingRegistro.value && !registroData.contraseña) {
          delete registroData.contraseña;
        }

        // Asegurar que los IDs son números
        registroData.id_Cliente = parseInt(registroData.id_Cliente);
        registroData.id_TipoServicio = parseInt(registroData.id_TipoServicio);

        const response = await fetch(url, {
          method: method,
          headers: {
            "Content-Type": "application/json",
            accept: "*/*",
          },
          body: JSON.stringify(registroData),
        });

        if (!response.ok) {
          throw new Error("Error al guardar el registro");
        }

        await fetchRegistros();
        closeRegistroModal();

        const clienteName = getClienteName(currentRegistro.value.id_Cliente);
        const serviceName = getServicioName(
          currentRegistro.value.id_TipoServicio
        );

        const message = isEditingRegistro.value
          ? `Registro para ${clienteName} (${serviceName}) actualizado con éxito`
          : `Registro para ${clienteName} (${serviceName}) creado con éxito`;

        showNotification(message, "success");
      } catch (error) {
        console.error("Error:", error);
        showNotification(
          "Error al guardar el registro: " + error.message,
          "error"
        );
      }
    };

    const closeRegistroModal = () => {
      showRegistroModal.value = false;
    };

    // Métodos para eliminación
    const confirmDelete = (type, id, name) => {
      deleteType.value = type;
      deleteItemId.value = id;
      deleteItemName.value = name;
      showDeleteConfirmModal.value = true;
    };

    const closeDeleteConfirmModal = () => {
      showDeleteConfirmModal.value = false;
    };

    const executeDelete = async () => {
      if (deleteType.value === "cliente") {
        await deleteCliente(deleteItemId.value);
      } else if (deleteType.value === "tipoServicio") {
        await deleteTipoServicio(deleteItemId.value);
      } else if (deleteType.value === "registro") {
        await deleteRegistro(deleteItemId.value);
      }
      closeDeleteConfirmModal();
    };

    const deleteCliente = async (id) => {
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

    const deleteTipoServicio = async (id) => {
      try {
        const servicioToDelete = tiposServicios.value.find(
          (s) => s.id_TipoServicio === id
        );
        const servicioName = servicioToDelete
          ? servicioToDelete.nombre
          : "desconocido";

        const response = await fetch(
          `http://152.228.135.50:5006/api/TipoServicio/${id}`,
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

    const deleteRegistro = async (id) => {
      try {
        const response = await fetch(
          `http://152.228.135.50:5006/api/Registro/${id}`,
          {
            method: "DELETE",
            headers: { accept: "*/*" },
          }
        );

        if (!response.ok) {
          throw new Error("No se pudo eliminar el registro");
        }

        await fetchRegistros();
        const message = `Registro #${id} eliminado con éxito`;
        showNotification(message, "success");
      } catch (error) {
        console.error("Error al eliminar registro:", error);
        showNotification("Error al eliminar el registro", "error");
      }
    };

    // Método de logout
    const logout = () => {
      localStorage.removeItem("userToken");
      localStorage.removeItem("username");
      router.push("/");
    };

    // Cargar datos al montar el componente
    onMounted(() => {
      fetchClientes();
      fetchTiposServicios();
      fetchRegistros();
    });

    return {
      // Estado
      sections,
      activeSection,
      searchQuery,
      username,
      notifications,

      // Clientes
      clientes,
      filteredClientes,
      showClientModal,
      isEditingClient,
      currentCliente,
      openClientModal,
      saveCliente,
      closeClientModal,

      // Tipos de Servicio
      tiposServicios,
      filteredTiposServicios,
      showTipoServicioModal,
      isEditingTipoServicio,
      currentTipoServicio,
      openTipoServicioModal,
      saveTipoServicio,
      closeTipoServicioModal,

      // Registros
      registros,
      filteredRegistros,
      registroTipoServicioFiltro,
      registroClienteFiltro,
      registroOrden,
      showRegistroModal,
      isEditingRegistro,
      currentRegistro,
      openRegistroModal,
      saveRegistro,
      closeRegistroModal,
      getClienteName,
      getServicioName,

      // Modal de confirmación
      showDeleteConfirmModal,
      deleteItemName,
      closeDeleteConfirmModal,
      confirmDelete,
      executeDelete,

      // Utilidades
      formatDate,
      getTimeAgo,
      getInitials,
      getCompanyInitial,
      getServiceInitial,
      getUserInitial,
      getRecentClientsCount,
      getTodayRegistrosCount,
      showNotification,
      removeNotification,

      // Logout
      logout,
    };
  },
};
</script>
<!-- Estilos Completos con Registros - DashboardView.vue */ -->
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
  margin-bottom: 30px;
}

.data-card {
  background-color: white;
  border-radius: 16px;
  padding: 24px;
  flex: 1;
  min-width: 240px;
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
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
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
  font-size: 16px;
  font-weight: 600;
  color: #6c757d;
  margin-bottom: 8px;
}

.card-value {
  font-size: 32px;
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
  padding: 16px 24px;
  border-bottom: 1px solid #dee2e6;
  font-size: 14px;
}

.data-table tr:last-child td {
  border-bottom: none;
}

.column-id {
  width: 80px;
}

.column-name {
  width: 40%;
}

.column-type {
  width: 120px;
}

.column-desc {
  width: 40%;
}

.column-user {
  width: 150px;
}

.column-date {
  width: 180px;
}

.column-actions {
  width: 140px;
}

.id-badge {
  background-color: #f8f9fa;
  color: #6c757d;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 600;
}

.type-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  text-transform: capitalize;
}

.type-info {
  background-color: rgba(52, 152, 219, 0.1);
  color: #3498db;
}

.type-success {
  background-color: rgba(46, 204, 113, 0.1);
  color: #2ecc71;
}

.type-warning {
  background-color: rgba(243, 156, 18, 0.1);
  color: #f39c12;
}

.type-error {
  background-color: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
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

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: #c1272d;
  box-shadow: 0 0 0 3px rgba(193, 39, 45, 0.1);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
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

  .column-date,
  .column-user {
    display: none;
  }

  .logs-table .column-type {
    width: 80px;
  }

  .logs-table .column-desc {
    width: auto;
  }
}
</style>
