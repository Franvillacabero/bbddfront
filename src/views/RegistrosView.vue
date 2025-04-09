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
    // Importaciones para Excel y copia
    const importXLSX = () => import("xlsx");

    // Estados
    const searchQuery = ref("");
    const registros = ref([]);
    const registrosDesencriptados = ref([]);
    const registroTipoServicioFiltro = ref("todos");
    const registroClienteFiltro = ref("todos");
    const registroOrden = ref("newest");
    const showRegistroModal = ref(false);
    const isEditingRegistro = ref(false);
    const clientes = ref([]);
    const tiposServicios = ref([]);
    const notifications = ref([]);

    // Estados para contraseñas
    const passwordVisibility = ref({});
    const selectedRegistros = ref([]);

    // Estado actual de registro
    const currentRegistro = ref({
      id_Registro: null,
      id_Cliente: "",
      id_TipoServicio: "",
      usuario: "",
      contraseña: "",
      contraseñaDesencriptada: "",
      notas: "",
      fechaCreacion: new Date().toISOString(),
    });

    // Notificación
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

    // Cargar clientes y tipos de servicio
    const fetchClientes = async () => {
      try {
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
      } catch (error) {
        console.error("Error al cargar clientes:", error);
        showNotification("Error al cargar los clientes", "error");
      }
    };

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
      } catch (error) {
        console.error("Error al cargar tipos de servicio:", error);
        showNotification("Error al cargar los tipos de servicio", "error");
      }
    };

    // Desencriptar registros
    const desencriptarRegistros = async (registrosEncriptados) => {
      try {
        const registrosConPasswordDesencriptado = await Promise.all(
          registrosEncriptados.map(async (registro) => {
            const registroConPasswordDesencriptado = { ...registro };
            registroConPasswordDesencriptado.contraseñaDesencriptada = "";
            return registroConPasswordDesencriptado;
          })
        );

        return registrosConPasswordDesencriptado;
      } catch (error) {
        console.error("Error al preparar registros:", error);
        showNotification("Error al procesar registros", "error");
        return registrosEncriptados.map((registro) => ({
          ...registro,
          contraseñaDesencriptada: "",
        }));
      }
    };

    // Cargar registros
    const fetchRegistros = async () => {
      try {
        const clientesAutorizados = JSON.parse(
          localStorage.getItem("clientesAutorizados") || "[]"
        );

        // Si no es admin, solo traer los registros de clientes autorizados
        if (!props.isAdmin) {
          const registroFetches = clientesAutorizados.map(async (clienteId) => {
            const response = await fetch(
              `http://152.228.135.50:5006/api/Registro/cliente/${clienteId}`,
              {
                method: "GET",
                headers: { accept: "*/*" },
              }
            );

            if (!response.ok) {
              throw new Error(
                `No se pudieron cargar los registros del cliente ${clienteId}`
              );
            }

            return response.json();
          });

          // Aplanar los resultados de los fetches y eliminar duplicados
          const resultados = await Promise.all(registroFetches);
          const registrosUnicos = [
            ...new Set(resultados.flat().map(JSON.stringify)),
          ].map(JSON.parse);
          registros.value = registrosUnicos;
        } else {
          // Si es admin, traer todos los registros
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
        }

        // Desencriptar las contraseñas de los registros
        registrosDesencriptados.value = await desencriptarRegistros(
          registros.value
        );

        showNotification("Registros cargados correctamente", "info");
      } catch (error) {
        console.error("Error al cargar registros:", error);
        showNotification("Error al cargar los registros", "error");
      }
    };

    // Métodos de utilidad
    const formatDate = (dateString) => {
      if (!dateString) return "N/A";

      return new Date(dateString).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    };

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

    // Métodos de obtención de nombres
    const getClienteName = (id) => {
      if (!id) return "N/A";
      const cliente = clientes.value.find((c) => c.id_Cliente == id);
      return cliente ? cliente.nombre_Empresa : `Cliente #${id}`;
    };

    const getServicioName = (id) => {
      if (!id) return "N/A";
      const servicio = tiposServicios.value.find(
        (s) => s.id_TipoServicio == id
      );
      return servicio ? servicio.nombre : `Servicio #${id}`;
    };

    // Métodos de inicial de usuario
    const getUserInitial = (name) => {
      if (!name) return "U";
      return name.charAt(0).toUpperCase();
    };

    // Filtrar registros
    const filteredRegistros = computed(() => {
      let result = props.isAdmin
        ? registrosDesencriptados.value
        : registrosDesencriptados.value.filter((registro) => {
            const clientesAutorizados = JSON.parse(
              localStorage.getItem("clientesAutorizados") || "[]"
            );
            return clientesAutorizados.includes(registro.id_Cliente);
          });

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
            (registro.contraseñaDesencriptada &&
              registro.contraseñaDesencriptada.toLowerCase().includes(query)) ||
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

    // Métodos para contraseñas
    const togglePasswordVisibility = async (registroId) => {
      if (!passwordVisibility.value[registroId]) {
        try {
          const response = await fetch(
            `http://152.228.135.50:5006/api/Registro/decrypt/${registroId}`,
            {
              method: "GET",
              headers: { accept: "*/*" },
            }
          );

          if (!response.ok) {
            throw new Error("No se pudo obtener la contraseña");
          }

          const decryptedPassword = await response.text();

          const index = registrosDesencriptados.value.findIndex(
            (r) => r.id_Registro === registroId
          );

          if (index !== -1) {
            registrosDesencriptados.value[index].contraseñaDesencriptada =
              decryptedPassword;
          }
        } catch (error) {
          console.error("Error al obtener contraseña:", error);
          showNotification("Error al obtener la contraseña", "error");
        }
      }

      passwordVisibility.value[registroId] =
        !passwordVisibility.value[registroId];
    };

    // Selección de registros
    const toggleSelectAllRegistros = () => {
      if (selectedRegistros.value.length === filteredRegistros.value.length) {
        // Si todos están seleccionados, deseleccionar todos
        selectedRegistros.value = [];
      } else {
        // Si no todos están seleccionados, seleccionar todos los filtrados
        selectedRegistros.value = filteredRegistros.value.map(
          (registro) => registro.id_Registro
        );
      }
    };

    const allRegistrosSelected = computed(() => {
      return (
        filteredRegistros.value.length > 0 &&
        selectedRegistros.value.length === filteredRegistros.value.length
      );
    });

    // Exportar a Excel
    const exportToExcel = async () => {
      try {
        if (selectedRegistros.value.length === 0) {
          showNotification(
            "Selecciona al menos un registro para exportar",
            "warning"
          );
          return;
        }

        // Obtener registros seleccionados
        const registrosToExport = registrosDesencriptados.value.filter(
          (registro) => selectedRegistros.value.includes(registro.id_Registro)
        );

        // Si se requieren contraseñas desencriptadas, obtenerlas
        const registrosConPassword = await Promise.all(
          registrosToExport.map(async (registro) => {
            // Si ya tiene contraseña desencriptada, usarla
            if (registro.contraseñaDesencriptada) {
              return { ...registro };
            }

            // Si no tiene contraseña desencriptada, obtenerla
            try {
              const response = await fetch(
                `http://152.228.135.50:5006/api/Registro/decrypt/${registro.id_Registro}`,
                {
                  method: "GET",
                  headers: { accept: "*/*" },
                }
              );

              if (!response.ok) {
                throw new Error("No se pudo obtener la contraseña");
              }

              const decryptedPassword = await response.text();
              return {
                ...registro,
                contraseñaDesencriptada: decryptedPassword,
              };
            } catch (error) {
              console.error("Error al obtener contraseña:", error);
              return {
                ...registro,
                contraseñaDesencriptada: "[Error al desencriptar]",
              };
            }
          })
        );

        // Preparar datos para exportar
        const excelData = registrosConPassword.map((registro) => ({
          Cliente: getClienteName(registro.id_Cliente),
          Servicio: getServicioName(registro.id_TipoServicio),
          Usuario: registro.usuario,
          Contraseña: registro.contraseñaDesencriptada,
          Notas: registro.notas || "",
          Fecha: formatDate(registro.fechaCreacion),
        }));

        // Crear workbook y worksheet
        const XLSX = await importXLSX();
        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Registros");

        // Guardar archivo
        XLSX.writeFile(
          workbook,
          `registros_netymedia_${new Date().toISOString().split("T")[0]}.xlsx`
        );

        showNotification(
          `${selectedRegistros.value.length} registros exportados con éxito`,
          "success"
        );
      } catch (error) {
        console.error("Error al exportar a Excel:", error);
        showNotification("Error al exportar los registros", "error");
      }
    };

    // Copiar registros seleccionados
    const copySelectedRegistros = async () => {
      try {
        if (selectedRegistros.value.length === 0) {
          showNotification(
            "Selecciona al menos un registro para copiar",
            "warning"
          );
          return;
        }

        // Obtener registros seleccionados
        const registrosToExport = registrosDesencriptados.value.filter(
          (registro) => selectedRegistros.value.includes(registro.id_Registro)
        );

        // Si se requieren contraseñas desencriptadas, obtenerlas
        const registrosConPassword = await Promise.all(
          registrosToExport.map(async (registro) => {
            // Si ya tiene contraseña desencriptada, usarla
            if (registro.contraseñaDesencriptada) {
              return { ...registro };
            }

            // Si no tiene contraseña desencriptada, obtenerla
            try {
              const response = await fetch(
                `http://152.228.135.50:5006/api/Registro/decrypt/${registro.id_Registro}`,
                {
                  method: "GET",
                  headers: { accept: "*/*" },
                }
              );

              if (!response.ok) {
                throw new Error("No se pudo obtener la contraseña");
              }

              const decryptedPassword = await response.text();
              return {
                ...registro,
                contraseñaDesencriptada: decryptedPassword,
              };
            } catch (error) {
              console.error("Error al obtener contraseña:", error);
              return {
                ...registro,
                contraseñaDesencriptada: "[Error al desencriptar]",
              };
            }
          })
        );

        // Formatear datos para portapapeles
        let clipboardText =
          "Cliente\tServicio\tUsuario\tContraseña\tNotas\tFecha\n";

        registrosConPassword.forEach((registro) => {
          clipboardText += `${getClienteName(registro.id_Cliente)}\t`;
          clipboardText += `${getServicioName(registro.id_TipoServicio)}\t`;
          clipboardText += `${registro.usuario}\t`;
          clipboardText += `${registro.contraseñaDesencriptada}\t`;
          clipboardText += `${registro.notas || ""}\t`;
          clipboardText += `${formatDate(registro.fechaCreacion)}\n`;
        });

        // Método de copia

        const copyText = (text) => {
          // Método 1: Usar navigator.clipboard si está disponible
          if (navigator.clipboard && navigator.clipboard.writeText) {
            return navigator.clipboard.writeText(text);
          }

          // Método 2: Usar selección y comando exec
          const textArea = document.createElement("textarea");
          textArea.value = text;
          document.body.appendChild(textArea);
          textArea.select();

          try {
            const successful = document.execCommand("copy");
            document.body.removeChild(textArea);
            return successful
              ? Promise.resolve()
              : Promise.reject(new Error("Copying failed"));
          } catch (err) {
            document.body.removeChild(textArea);
            return Promise.reject(err);
          }
        };

        await copyText(clipboardText);
        showNotification(
          `${selectedRegistros.value.length} registros copiados al portapapeles`,
          "success"
        );
      } catch (error) {
        console.error("Error al copiar registros:", error);
        showNotification(
          "Error al copiar los registros: " + error.message,
          "error"
        );
      }
    };

    // Copiar usuario al portapapeles
    const copyUsernameToClipboard = async (username) => {
      try {
        if (!username) {
          showNotification("No hay usuario para copiar", "warning");
          return;
        }

        // Método de copia alternativo
        const copyText = (text) => {
          // Método 1: Usar navigator.clipboard si está disponible
          if (navigator.clipboard && navigator.clipboard.writeText) {
            return navigator.clipboard.writeText(text);
          }

          // Método 2: Usar selección y comando exec
          const textArea = document.createElement("textarea");
          textArea.value = text;
          document.body.appendChild(textArea);
          textArea.select();

          try {
            const successful = document.execCommand("copy");
            document.body.removeChild(textArea);
            return successful
              ? Promise.resolve()
              : Promise.reject(new Error("Copying failed"));
          } catch (err) {
            document.body.removeChild(textArea);
            return Promise.reject(err);
          }
        };

        // Intentar copiar
        await copyText(username);
        showNotification("Usuario copiado al portapapeles", "success");
      } catch (error) {
        console.error("Error al copiar:", error);
        showNotification(`Error al copiar: ${error.message}`, "error");
      }
    };

    // Copiar contraseña al portapapeles
    const copyToClipboard = async (registroId) => {
      try {
        // Buscar el registro
        const registro = registrosDesencriptados.value.find(
          (r) => r.id_Registro === registroId
        );

        let textToCopy;

        // Si no hay contraseña desencriptada, hacer fetch
        if (!registro || !registro.contraseñaDesencriptada) {
          const response = await fetch(
            `http://152.228.135.50:5006/api/Registro/decrypt/${registroId}`,
            {
              method: "GET",
              headers: {
                accept: "*/*",
                "Content-Type": "application/json",
              },
            }
          );

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`No se pudo obtener la contraseña: ${errorText}`);
          }

          textToCopy = await response.text();
        } else {
          textToCopy = registro.contraseñaDesencriptada;
        }

        // Método de copia alternativo
        const copyText = (text) => {
          // Método 1: Usar navigator.clipboard si está disponible
          if (navigator.clipboard && navigator.clipboard.writeText) {
            return navigator.clipboard.writeText(text);
          }

          // Método 2: Usar selección y comando exec
          const textArea = document.createElement("textarea");
          textArea.value = text;
          document.body.appendChild(textArea);
          textArea.select();

          try {
            const successful = document.execCommand("copy");
            document.body.removeChild(textArea);
            return successful
              ? Promise.resolve()
              : Promise.reject(new Error("Copying failed"));
          } catch (err) {
            document.body.removeChild(textArea);
            return Promise.reject(err);
          }
        };

        // Intentar copiar
        await copyText(textToCopy);
        showNotification("Contraseña copiada al portapapeles", "success");
      } catch (error) {
        console.error("Error al copiar:", error);
        showNotification(`Error al copiar: ${error.message}`, "error");
      }
    };

    // Métodos de conteo
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

    // Métodos del modal de registro
    const openRegistroModal = (registro) => {
      // Solo admin puede abrir modal de registros
      if (!props.isAdmin) {
        showNotification("No tienes permisos para esta acción", "error");
        return;
      }

      if (registro) {
        // Para edición: copiar datos pero limpiar la contraseña
        currentRegistro.value = {
          ...registro,
          contraseña: "", // Limpiar contraseña encriptada para edición
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
          contraseñaDesencriptada: "",
          notas: "",
          fechaCreacion: new Date().toISOString(),
        };
        isEditingRegistro.value = false;
      }
      showRegistroModal.value = true;
    };

    const saveRegistro = async () => {
      // Solo admin puede crear/editar registros
      if (!props.isAdmin) {
        showNotification("No tienes permisos para esta acción", "error");
        return;
      }

      try {
        // Crear una copia para no modificar el objeto original
        let registroData = { ...currentRegistro.value };

        const url = isEditingRegistro.value
          ? `http://152.228.135.50:5006/api/Registro/${currentRegistro.value.id_Registro}`
          : "http://152.228.135.50:5006/api/Registro";

        const method = isEditingRegistro.value ? "PUT" : "POST";

        // Si estamos creando un nuevo registro, establecer id_Registro a 0
        if (!isEditingRegistro.value) {
          registroData.id_Registro = 0;
        }

        // Si estamos editando y no se proporcionó contraseña, la eliminamos del objeto
        // para que el backend mantenga la contraseña actual
        if (isEditingRegistro.value && !registroData.contraseña) {
          delete registroData.contraseña;
        }

        // Eliminar el campo contraseñaDesencriptada antes de enviar al API
        delete registroData.contraseñaDesencriptada;

        // Asegurar que los IDs son números
        registroData.id_Cliente = parseInt(registroData.id_Cliente);
        registroData.id_TipoServicio = parseInt(registroData.id_TipoServicio);

        // Asegurar que la fecha de creación esté en formato ISO
        registroData.fechaCreacion = new Date().toISOString();

        const response = await fetch(url, {
          method: method,
          headers: {
            "Content-Type": "application/json",
            accept: "*/*",
          },
          body: JSON.stringify(registroData),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Error al guardar el registro: ${errorText}`);
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

    const deleteRegistro = async (id) => {
      // Solo admin puede eliminar registros
      if (!props.isAdmin) {
        showNotification("No tienes permisos para esta acción", "error");
        return;
      }

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
        const message = `Registro eliminado con éxito`;
        showNotification(message, "success");
      } catch (error) {
        console.error("Error al eliminar registro:", error);
        showNotification("Error al eliminar el registro", "error");
      }
    };

    // Modal de confirmación de eliminación
    const showDeleteConfirmModal = ref(false);
    const deleteItemId = ref(null);
    const deleteItemName = ref("");

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

    const executeDelete = async () => {
      // Solo admin puede ejecutar eliminación
      if (!props.isAdmin) {
        showNotification("No tienes permisos para esta acción", "error");
        return;
      }

      await deleteRegistro(deleteItemId.value);
      closeDeleteConfirmModal();
    };

    // Cargar datos al montar el componente
    onMounted(() => {
      fetchClientes();
      fetchTiposServicios();
      fetchRegistros();
    });

    // Valores para filtros de cliente y servicio
    const sortedClientes = computed(() => {
      return [...clientes.value].sort((a, b) =>
        a.nombre_Empresa.localeCompare(b.nombre_Empresa)
      );
    });

    const sortedTiposServicios = computed(() => {
      return [...tiposServicios.value].sort((a, b) =>
        a.nombre.localeCompare(b.nombre)
      );
    });

    return {
      // Estados
      searchQuery,
      registros,
      registrosDesencriptados,
      filteredRegistros,
      registroTipoServicioFiltro,
      registroClienteFiltro,
      registroOrden,
      showRegistroModal,
      isEditingRegistro,
      currentRegistro,
      showDeleteConfirmModal,
      deleteItemName,
      notifications,

      // Estados de contraseñas
      passwordVisibility,
      selectedRegistros,

      // Listas
      clientes,
      tiposServicios,
      sortedClientes,
      sortedTiposServicios,

      // Métodos
      openRegistroModal,
      saveRegistro,
      closeRegistroModal,
      deleteRegistro,
      confirmDelete,
      closeDeleteConfirmModal,
      executeDelete,
      togglePasswordVisibility,
      copyToClipboard,
      copyUsernameToClipboard,
      exportToExcel,
      copySelectedRegistros,
      toggleSelectAllRegistros,

      // Utilidades
      formatDate,
      getTimeAgo,
      getClienteName,
      getServicioName,
      getUserInitial,
      getTodayRegistrosCount,

      // Notificaciones
      showNotification,
      removeNotification,

      // Métodos de selección
      allRegistrosSelected,
    };
  },
};
</script>

<template>
  <div class="data-section">
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
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
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
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
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

    <div class="content-header">
      <div class="header-left">
        <h1 class="page-title">Gestión de Registros</h1>
        <p class="page-subtitle">
          Total: {{ registros.length }} registros de actividad
        </p>
      </div>
      <div class="header-actions">
        <div class="search-container">
          <input
            type="text"
            placeholder="Buscar registro..."
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
          @click="openRegistroModal(null)"
          class="create-button"
        >
          <span class="button-icon">+</span>
          <span>Nuevo Registro</span>
        </button>
      </div>
    </div>

    <div class="filter-controls">
      <div class="filter-group">
        <label>Filtrar por cliente:</label>
        <select v-model="registroClienteFiltro" class="filter-select">
          <option value="todos">Todos los clientes</option>
          <option
            v-for="cliente in sortedClientes"
            :key="cliente.id_Cliente"
            :value="cliente.id_Cliente"
          >
            {{ cliente.nombre_Empresa }}
          </option>
        </select>
      </div>
      <div class="filter-group">
        <label>Filtrar por tipo de servicio:</label>
        <select v-model="registroTipoServicioFiltro" class="filter-select">
          <option value="todos">Todos los tipos</option>
          <option
            v-for="tipo in sortedTiposServicios"
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

      <div class="action-buttons-container">
        <button
          @click="exportToExcel"
          class="action-button-main export-button"
          title="Exportar seleccionados a Excel"
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
              d="M12 2v15M5 9l7 7 7-7M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"
            ></path>
          </svg>
          <span>Exportar</span>
          <span class="selected-count" v-if="selectedRegistros.length > 0"
            >({{ selectedRegistros.length }})</span
          >
        </button>
        <button
          @click="copySelectedRegistros"
          class="action-button-main copy-all-button"
          title="Copiar seleccionados al portapapeles"
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
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
          </svg>
          <span>Copiar</span>
          <span class="selected-count" v-if="selectedRegistros.length > 0"
            >({{ selectedRegistros.length }})</span
          >
        </button>
      </div>
    </div>

    <div class="table-container">
      <table class="data-table logs-table">
        <thead>
          <tr>
            <th class="column-checkbox">
              <div class="checkbox-container">
                <input
                  type="checkbox"
                  id="selectAllCheckbox"
                  :checked="allRegistrosSelected"
                  @change="toggleSelectAllRegistros"
                  class="custom-checkbox"
                />
                <label for="selectAllCheckbox" class="checkbox-label"></label>
              </div>
            </th>
            <th class="column-client">Cliente</th>
            <th class="column-service">Servicio</th>
            <th class="column-user">Usuario</th>
            <th class="column-password">Contraseña</th>
            <th class="column-notes">Notas</th>
            <th class="column-date">Fecha</th>
            <th v-if="isAdmin" class="column-actions">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="registro in filteredRegistros"
            :key="registro.id_Registro"
            class="data-row"
            :class="{
              'row-selected': selectedRegistros.includes(registro.id_Registro),
            }"
          >
            <td class="column-checkbox">
              <div class="checkbox-container">
                <input
                  type="checkbox"
                  :id="`checkbox-${registro.id_Registro}`"
                  v-model="selectedRegistros"
                  :value="registro.id_Registro"
                  class="custom-checkbox"
                />
                <label
                  :for="`checkbox-${registro.id_Registro}`"
                  class="checkbox-label"
                ></label>
              </div>
            </td>
            <td class="column-client">
              <span class="registro-desc">{{
                getClienteName(registro.id_Cliente)
              }}</span>
            </td>
            <td class="column-service">
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
                <button
                  @click="copyUsernameToClipboard(registro.usuario)"
                  class="copy-button"
                  title="Copiar usuario"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <rect
                      x="9"
                      y="9"
                      width="13"
                      height="13"
                      rx="2"
                      ry="2"
                    ></rect>
                    <path
                      d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"
                    ></path>
                  </svg>
                </button>
              </div>
            </td>
            <td class="column-password">
              <div class="password-cell">
                <span class="password-value">
                  <template v-if="passwordVisibility[registro.id_Registro]">
                    {{ registro.contraseñaDesencriptada }}
                  </template>
                  <template v-else> •••••••••••• </template>
                </span>
                <div class="password-actions">
                  <button
                    @click="togglePasswordVisibility(registro.id_Registro)"
                    class="visibility-button"
                    :title="
                      passwordVisibility[registro.id_Registro]
                        ? 'Ocultar contraseña'
                        : 'Mostrar contraseña'
                    "
                  >
                    <svg
                      v-if="passwordVisibility[registro.id_Registro]"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path
                        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                      ></path>
                      <circle cx="12" cy="12" r="3"></circle>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                    <svg
                      v-else
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width="16"
                      height="16"
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

                  <button
                    @click="copyToClipboard(registro.id_Registro)"
                    class="copy-button"
                    title="Copiar contraseña"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <rect
                        x="9"
                        y="9"
                        width="13"
                        height="13"
                        rx="2"
                        ry="2"
                      ></rect>
                      <path
                        d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"
                      ></path>
                    </svg>
                  </button>
                </div>
              </div>
            </td>
            <td class="column-notes">
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
            <td v-if="isAdmin" class="column-actions">
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
                      registro.id_Registro,
                      `Registro de ${getClienteName(registro.id_Cliente)}`
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
            <td :colspan="isAdmin ? 8 : 7" class="empty-message">
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
                v-for="cliente in sortedClientes"
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
                v-for="servicio in sortedTiposServicios"
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

<style scoped>
/* Use the existing styles from the global layout */
/* Any component-specific styles can be added here if needed */
</style>
