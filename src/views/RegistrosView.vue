<script>
import { ref, computed, onMounted, onUnmounted } from "vue";

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
    const clienteSearchQuery = ref(""); // Para búsqueda de clientes en el modal
    const servicioSearchQuery = ref(""); // Para búsqueda de tipos de servicio en el modal
    const registros = ref([]);
    const registrosDesencriptados = ref([]);
    const registroTipoServicioFiltro = ref("todos");
    const registroClienteFiltro = ref("todos");
    const registroOrden = ref("clientName"); // Cambiado a ordenamiento por nombre de cliente
    const showRegistroModal = ref(false);
    const isEditingRegistro = ref(false);
    const clientes = ref([]);
    const tiposServicios = ref([]);
    const tableContainer = ref(null);
    const isDragging = ref(false);
    const startX = ref(0);
    const scrollLeft = ref(0);

    // Referencias y estados para manejar cierre de dropdowns
    const clientSearchRef = ref(null);
    const serviceSearchRef = ref(null);
    const showClientResults = ref(false);
    const showServiceResults = ref(false);

    // Estados para contraseñas
    const passwordVisibility = ref({});
    const selectedRegistros = ref([]);

    // Estado para modal de notas
    const showNotesModal = ref(false);
    const viewingNotes = ref({
      registroId: null,
      clienteName: "",
      serviceName: "",
      notes: "",
    });

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
      url: "",
      url_2: "",
      isp: "",
      nombre_BBDD: "", // Cambiado de nombre_bt a nombre_BBDD
    });

    // Funciones para manejar los dropdowns
    const focusClientSearch = () => {
      showClientResults.value = true;
      showServiceResults.value = false; // Cierra el otro dropdown
      // No borrar el texto de búsqueda cuando ya hay un elemento seleccionado
      if (!currentRegistro.value.id_Cliente) {
        clienteSearchQuery.value = "";
      }
    };

    const focusServiceSearch = () => {
      showServiceResults.value = true;
      showClientResults.value = false; // Cierra el otro dropdown
      // No borrar el texto de búsqueda cuando ya hay un elemento seleccionado
      if (!currentRegistro.value.id_TipoServicio) {
        servicioSearchQuery.value = "";
      }
    };

    const selectClient = (clienteId) => {
      currentRegistro.value.id_Cliente = clienteId;
      showClientResults.value = false;
      // Limpiar la cadena de búsqueda para mostrar el elemento seleccionado
      clienteSearchQuery.value = "";
    };

    const selectService = (servicioId) => {
      currentRegistro.value.id_TipoServicio = servicioId;
      showServiceResults.value = false;
      // Limpiar la cadena de búsqueda para mostrar el elemento seleccionado
      servicioSearchQuery.value = "";
    };

    // Función para manejar clics fuera de los dropdowns
    const setupClickAwayListeners = () => {
      const handleClickOutside = (event) => {
        // Para el dropdown de clientes
        if (
          clientSearchRef.value &&
          !clientSearchRef.value.contains(event.target)
        ) {
          showClientResults.value = false;
          // Si no hay cliente seleccionado, limpiar la búsqueda
          if (!currentRegistro.value.id_Cliente) {
            clienteSearchQuery.value = "";
          }
        }

        // Para el dropdown de tipos de servicio
        if (
          serviceSearchRef.value &&
          !serviceSearchRef.value.contains(event.target)
        ) {
          showServiceResults.value = false;
          // Si no hay servicio seleccionado, limpiar la búsqueda
          if (!currentRegistro.value.id_TipoServicio) {
            servicioSearchQuery.value = "";
          }
        }
      };

      // Añade el listener
      document.addEventListener("mousedown", handleClickOutside);

      // Retorna una función para remover el listener
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    };

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

    // Métodos de notas
    const openNotesModal = (registro) => {
      viewingNotes.value = {
        registroId: registro.id_Registro,
        clienteName: getClienteName(registro.id_Cliente),
        serviceName: getServicioName(registro.id_TipoServicio),
        notes: registro.notas || "Sin notas",
      };
      showNotesModal.value = true;
    };

    const closeNotesModal = () => {
      showNotesModal.value = false;
    };

    const hasNotes = (notas) => {
      return notas && notas.trim() !== "";
    };

    // Generador de contraseñas seguras
    const generateSecurePassword = () => {
      const length = 18; // Aumentamos la longitud para mayor seguridad
      const uppercaseChars = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // Sin I y O para evitar confusión
      const lowercaseChars = "abcdefghijkmnpqrstuvwxyz"; // Sin l y o para evitar confusión
      const numberChars = "23456789"; // Sin 0 y 1 para evitar confusión

      // Removidos los símbolos especiales
      const allChars = uppercaseChars + lowercaseChars + numberChars;

      // Asegurar que hay varios caracteres de cada categoría
      let password = "";

      // Añadir 4 mayúsculas para aumentar la seguridad
      for (let i = 0; i < 4; i++) {
        password += uppercaseChars.charAt(
          Math.floor(Math.random() * uppercaseChars.length)
        );
      }

      // Añadir 4 números para aumentar la seguridad
      for (let i = 0; i < 4; i++) {
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
      currentRegistro.value.contraseña = password;
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
          const response = await fetch("https://152.228.135.50/api/Cliente", {
            method: "GET",
            headers: { accept: "*/*" },
          });

          if (!response.ok) {
            throw new Error("No se pudieron cargar los clientes");
          }

          clientes.value = await response.json();
        }
      } catch (error) {
        console.error("Error al cargar clientes:", error);
      }
    };

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
      } catch (error) {
        console.error("Error al cargar tipos de servicio:", error);
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
              `https://152.228.135.50/api/Registro/cliente/${clienteId}`,
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
          const response = await fetch("https://152.228.135.50/api/Registro", {
            method: "GET",
            headers: { accept: "*/*" },
          });

          if (!response.ok) {
            throw new Error("No se pudieron cargar los registros");
          }

          registros.value = await response.json();
        }

        // Desencriptar las contraseñas de los registros
        registrosDesencriptados.value = await desencriptarRegistros(
          registros.value
        );
      } catch (error) {
        console.error("Error al cargar registros:", error);
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
            (registro.url && registro.url.toLowerCase().includes(query)) ||
            (registro.url_2 && registro.url_2.toLowerCase().includes(query)) ||
            (registro.isp && registro.isp.toLowerCase().includes(query)) ||
            (registro.nombre_BBDD &&
              registro.nombre_BBDD.toLowerCase().includes(query)) ||
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

      // Ordenar según criterio seleccionado
      result = [...result].sort((a, b) => {
        if (registroOrden.value === "clientName") {
          // Ordenar por nombre de cliente
          const clienteA = getClienteName(a.id_Cliente).toLowerCase();
          const clienteB = getClienteName(b.id_Cliente).toLowerCase();
          return clienteA.localeCompare(clienteB);
        } else if (registroOrden.value === "newest") {
          // Ordenar por fecha más reciente
          const dateA = new Date(a.fechaCreacion || 0);
          const dateB = new Date(b.fechaCreacion || 0);
          return dateB - dateA;
        } else if (registroOrden.value === "oldest") {
          // Ordenar por fecha más antigua
          const dateA = new Date(a.fechaCreacion || 0);
          const dateB = new Date(b.fechaCreacion || 0);
          return dateA - dateB;
        }
        // Ordenamiento predeterminado
        return 0;
      });

      return result;
    });

    // Filtrar clientes para el modal
    const filteredClientes = computed(() => {
      const query = clienteSearchQuery.value.toLowerCase().trim();
      if (!query) return sortedClientes.value;

      return sortedClientes.value.filter((cliente) =>
        cliente.nombre_Empresa.toLowerCase().includes(query)
      );
    });

    // Filtrar tipos de servicio para el modal
    const filteredServicios = computed(() => {
      const query = servicioSearchQuery.value.toLowerCase().trim();
      if (!query) return sortedTiposServicios.value;

      return sortedTiposServicios.value.filter((servicio) =>
        servicio.nombre.toLowerCase().includes(query)
      );
    });

    // Métodos para contraseñas
    const togglePasswordVisibility = async (registroId) => {
      if (!passwordVisibility.value[registroId]) {
        try {
          const response = await fetch(
            `https://152.228.135.50/api/Registro/decrypt/${registroId}`,
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
          console.log("Selecciona al menos un registro para exportar");
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
                `https://152.228.135.50/api/Registro/decrypt/${registro.id_Registro}`,
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
          URL: registro.url || "",
          URL_Alternativa: registro.url_2 || "",
          ISP: registro.isp || "",
          BBDD: registro.nombre_BBDD || "",
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

        console.log(
          `${selectedRegistros.value.length} registros exportados con éxito`
        );
      } catch (error) {
        console.error("Error al exportar a Excel:", error);
      }
    };

    // Copiar registros seleccionados
    const copySelectedRegistros = async () => {
      try {
        if (selectedRegistros.value.length === 0) {
          console.log("Selecciona al menos un registro para copiar");
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
                `https://152.228.135.50/api/Registro/decrypt/${registro.id_Registro}`,
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
          "Cliente\tServicio\tUsuario\tContraseña\tURL\tURL Alt\tISP\tBBDD\tNotas\tFecha\n";

        registrosConPassword.forEach((registro) => {
          clipboardText += `${getClienteName(registro.id_Cliente)}\t`;
          clipboardText += `${getServicioName(registro.id_TipoServicio)}\t`;
          clipboardText += `${registro.usuario}\t`;
          clipboardText += `${registro.contraseñaDesencriptada}\t`;
          clipboardText += `${registro.url || ""}\t`;
          clipboardText += `${registro.url_2 || ""}\t`;
          clipboardText += `${registro.isp || ""}\t`;
          clipboardText += `${registro.nombre_BBDD || ""}\t`;
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
        console.log(
          `${selectedRegistros.value.length} registros copiados al portapapeles`
        );
      } catch (error) {
        console.error("Error al copiar registros:", error);
      }
    };

    // Copiar usuario al portapapeles
    const copyUsernameToClipboard = async (username) => {
      try {
        if (!username) {
          console.log("No hay usuario para copiar");
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
        console.log("Usuario copiado al portapapeles");
      } catch (error) {
        console.error("Error al copiar:", error);
      }
    };

    // Copiar texto genérico al portapapeles
    const copyTextToClipboard = async (text, type = "Texto") => {
      try {
        if (!text) {
          console.log(`No hay ${type.toLowerCase()} para copiar`);
          return;
        }

        const copyText = (text) => {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            return navigator.clipboard.writeText(text);
          }

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

        await copyText(text);
        console.log(`${type} copiado al portapapeles`);
      } catch (error) {
        console.error("Error al copiar:", error);
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
            `https://152.228.135.50/api/Registro/decrypt/${registroId}`,
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
            throw new const errorText = await response.text();
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
        console.log("Contraseña copiada al portapapeles");
      } catch (error) {
        console.error("Error al copiar:", error);
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
        console.log("No tienes permisos para esta acción");
        return;
      }

      // Resetear la búsqueda de clientes y servicios
      clienteSearchQuery.value = "";
      servicioSearchQuery.value = "";
      showClientResults.value = false;
      showServiceResults.value = false;

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
          url: "",
          url_2: "",
          isp: "",
          nombre_BBDD: "",
          fechaCreacion: new Date().toISOString(),
        };
        isEditingRegistro.value = false;
      }
      showRegistroModal.value = true;
    };

    const saveRegistro = async () => {
      // Solo admin puede crear/editar registros
      if (!props.isAdmin) {
        console.log("No tienes permisos para esta acción");
        return;
      }

      try {
        // Crear una copia para no modificar el objeto original
        let registroData = { ...currentRegistro.value };

        const url = isEditingRegistro.value
          ? `https://152.228.135.50/api/Registro/${currentRegistro.value.id_Registro}`
          : "https://152.228.135.50/api/Registro";

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

        console.log(
          isEditingRegistro.value
            ? `Registro para ${clienteName} (${serviceName}) actualizado con éxito`
            : `Registro para ${clienteName} (${serviceName}) creado con éxito`
        );
      } catch (error) {
        console.error("Error:", error);
      }
    };

    const closeRegistroModal = () => {
      showRegistroModal.value = false;
    };

    const deleteRegistro = async (id) => {
      // Solo admin puede eliminar registros
      if (!props.isAdmin) {
        console.log("No tienes permisos para esta acción");
        return;
      }

      try {
        const response = await fetch(
          `https://152.228.135.50/api/Registro/${id}`,
          {
            method: "DELETE",
            headers: { accept: "*/*" },
          }
        );

        if (!response.ok) {
          throw new Error("No se pudo eliminar el registro");
        }

        await fetchRegistros();
        console.log(`Registro eliminado con éxito`);
      } catch (error) {
        console.error("Error al eliminar registro:", error);
      }
    };

    // Modal de confirmación de eliminación
    const showDeleteConfirmModal = ref(false);
    const deleteItemId = ref(null);
    const deleteItemName = ref("");

    const confirmDelete = (id, name) => {
      // Solo admin puede confirmar eliminación
      if (!props.isAdmin) {
        console.log("No tienes permisos para esta acción");
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
        console.log("No tienes permisos para esta acción");
        return;
      }

      await deleteRegistro(deleteItemId.value);
      closeDeleteConfirmModal();
    };

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

    // Cargar datos al montar el componente
    onMounted(() => {
      fetchClientes();
      fetchTiposServicios();
      fetchRegistros();

      // Configura el listener para clics fuera
      const removeListener = setupClickAwayListeners();

      // Limpia el listener cuando el componente se desmonte
      onUnmounted(removeListener);
    });

    return {
      // Estados
      searchQuery,
      clienteSearchQuery,
      servicioSearchQuery,
      registros,
      registrosDesencriptados,
      filteredRegistros,
      filteredClientes,
      filteredServicios,
      registroTipoServicioFiltro,
      registroClienteFiltro,
      registroOrden,
      showRegistroModal,
      isEditingRegistro,
      currentRegistro,
      showDeleteConfirmModal,
      deleteItemName,
      tableContainer,
      isDragging,
      showNotesModal,
      viewingNotes,

      // Estados para el control de dropdowns
      clientSearchRef,
      serviceSearchRef,
      showClientResults,
      showServiceResults,

      // Estados de contraseñas
      passwordVisibility,
      selectedRegistros,

      // Listas
      clientes,
      tiposServicios,
      sortedClientes,
      sortedTiposServicios,

      // Métodos para el desplazamiento
      handleMouseDown,
      handleMouseLeave,
      handleMouseUp,
      handleMouseMove,

      // Métodos para dropdowns
      focusClientSearch,
      focusServiceSearch,
      selectClient,
      selectService,

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
      copyTextToClipboard,
      exportToExcel,
      copySelectedRegistros,
      toggleSelectAllRegistros,
      generateSecurePassword,
      openNotesModal,
      closeNotesModal,
      hasNotes,

      // Utilidades
      formatDate,
      getTimeAgo,
      getClienteName,
      getServicioName,
      getTodayRegistrosCount,

      // Métodos de selección
      allRegistrosSelected,
    };
  },
};
</script>
<template>
  <div class="data-section">
    <div class="content-header">
      <div class="header-left">
        <div class="header-title-container">
          <h1 class="page-title">Gestión de Registros</h1>
          <div class="header-cards">
            <div class="header-card">
              <div class="card-icon logs-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div class="card-info">
                <span class="card-label">Total</span>
                <span class="card-value">{{ registros.length }}</span>
              </div>
            </div>
            <div class="header-card">
              <div class="card-icon today-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
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
                <span class="card-label">Hoy</span>
                <span class="card-value">{{ getTodayRegistrosCount() }}</span>
              </div>
            </div>
          </div>
        </div>
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
          <option value="clientName">Nombre de cliente</option>
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

    <div
      ref="tableContainer"
      class="table-container draggable"
      @mousedown="handleMouseDown"
      @mouseleave="handleMouseLeave"
      @mouseup="handleMouseUp"
      @mousemove="handleMouseMove"
    >
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
            <th class="column-url">URL</th>
            <th class="column-url">URL Alt.</th>
            <th class="column-isp">ISP</th>
            <th class="column-bbdd">BBDD</th>
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
            <td class="column-url">
              <div class="url-cell">
                <span class="url-value text-truncate">{{
                  registro.url || "-"
                }}</span>
                <button
                  v-if="registro.url"
                  @click="copyTextToClipboard(registro.url, 'URL')"
                  class="copy-button"
                  title="Copiar URL"
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
            <td class="column-url">
              <div class="url-cell">
                <span class="url-value text-truncate">{{
                  registro.url_2 || "-"
                }}</span>
                <button
                  v-if="registro.url_2"
                  @click="
                    copyTextToClipboard(registro.url_2, 'URL Alternativa')
                  "
                  class="copy-button"
                  title="Copiar URL Alternativa"
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
            <td class="column-isp">
              <div class="isp-cell">
                <span class="isp-value">{{ registro.isp || "-" }}</span>
                <button
                  v-if="registro.isp"
                  @click="copyTextToClipboard(registro.isp, 'ISP')"
                  class="copy-button"
                  title="Copiar ISP"
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
            <td class="column-bbdd">
              <div class="bbdd-cell">
                <span class="bbdd-value">{{
                  registro.nombre_BBDD || "-"
                }}</span>
                <button
                  v-if="registro.nombre_BBDD"
                  @click="copyTextToClipboard(registro.nombre_BBDD, 'BBDD')"
                  class="copy-button"
                  title="Copiar BBDD"
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
            <td class="column-notes">
              <div class="notes-cell">
                <span class="notes-preview">
                  {{
                    registro.notas
                      ? registro.notas.substring(0, 40) +
                        (registro.notas.length > 40 ? "..." : "")
                      : "Sin notas"
                  }}
                </span>
                <button
                  v-if="hasNotes(registro.notas)"
                  @click="openNotesModal(registro)"
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
                      d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 0122v2"
                    ></path>
                  </svg>
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="filteredRegistros.length === 0" class="empty-row">
            <td :colspan="isAdmin ? 12 : 11" class="empty-message">
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
      <div class="modal-container modal-large" @click.stop>
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
          <div class="form-row">
            <div class="form-group">
              <label for="clienteSearch">Cliente</label>
              <div ref="clientSearchRef" class="selector-with-search">
                <div class="searchable-select">
                  <div
                    class="select-input-container"
                    @click="focusClientSearch"
                  >
                    <input
                      type="text"
                      id="clienteSearch"
                      v-model="clienteSearchQuery"
                      class="form-input select-input"
                      :placeholder="
                        currentRegistro.id_Cliente ? '' : 'Buscar cliente...'
                      "
                      @focus="focusClientSearch"
                      @input="focusClientSearch"
                    />
                    <div
                      v-if="currentRegistro.id_Cliente"
                      class="selected-item-inline"
                    >
                      {{ getClienteName(currentRegistro.id_Cliente) }}
                    </div>
                    <div class="select-icons">
                      <button
                        v-if="currentRegistro.id_Cliente"
                        type="button"
                        @click.stop="
                          currentRegistro.id_Cliente = '';
                          clienteSearchQuery = '';
                        "
                        class="clear-button"
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
                          <path d="M18 6L6 18"></path>
                          <path d="M6 6l12 12"></path>
                        </svg>
                      </button>
                      <span class="dropdown-icon">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          width="16"
                          height="16"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <path d="M6 9l6 6 6-6"></path>
                        </svg>
                      </span>
                    </div>
                  </div>
                  <div class="search-results-dropdown" v-if="showClientResults">
                    <div
                      v-for="cliente in filteredClientes"
                      :key="cliente.id_Cliente"
                      class="search-result-item"
                      :class="{
                        selected:
                          currentRegistro.id_Cliente == cliente.id_Cliente,
                      }"
                      @click="selectClient(cliente.id_Cliente)"
                    >
                      {{ cliente.nombre_Empresa }}
                    </div>
                    <div
                      v-if="filteredClientes.length === 0"
                      class="search-no-results"
                    >
                      No se encontraron resultados
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label for="servicioSearch">Tipo de Servicio</label>
              <div ref="serviceSearchRef" class="selector-with-search">
                <div class="searchable-select">
                  <div
                    class="select-input-container"
                    @click="focusServiceSearch"
                  >
                    <input
                      type="text"
                      id="servicioSearch"
                      v-model="servicioSearchQuery"
                      class="form-input select-input"
                      :placeholder="
                        currentRegistro.id_TipoServicio
                          ? ''
                          : 'Buscar tipo de servicio...'
                      "
                      @focus="focusServiceSearch"
                      @input="focusServiceSearch"
                    />
                    <div
                      v-if="currentRegistro.id_TipoServicio"
                      class="selected-item-inline"
                    >
                      {{ getServicioName(currentRegistro.id_TipoServicio) }}
                    </div>
                    <div class="select-icons">
                      <button
                        v-if="currentRegistro.id_TipoServicio"
                        type="button"
                        @click.stop="
                          currentRegistro.id_TipoServicio = '';
                          servicioSearchQuery = '';
                        "
                        class="clear-button"
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
                          <path d="M18 6L6 18"></path>
                          <path d="M6 6l12 12"></path>
                        </svg>
                      </button>
                      <span class="dropdown-icon">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          width="16"
                          height="16"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <path d="M6 9l6 6 6-6"></path>
                        </svg>
                      </span>
                    </div>
                  </div>
                  <div
                    class="search-results-dropdown"
                    v-if="showServiceResults"
                  >
                    <div
                      v-for="servicio in filteredServicios"
                      :key="servicio.id_TipoServicio"
                      class="search-result-item"
                      :class="{
                        selected:
                          currentRegistro.id_TipoServicio ==
                          servicio.id_TipoServicio,
                      }"
                      @click="selectService(servicio.id_TipoServicio)"
                    >
                      {{ servicio.nombre }}
                    </div>
                    <div
                      v-if="filteredServicios.length === 0"
                      class="search-no-results"
                    >
                      No se encontraron resultados
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="form-row">
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
              <div class="password-input-group">
                <input
                  id="password"
                  v-model="currentRegistro.contraseña"
                  type="text"
                  placeholder="Ingrese la contraseña"
                  :required="!isEditingRegistro"
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
              <small v-if="isEditingRegistro" class="form-hint"
                >Dejar en blanco para mantener la contraseña actual</small
              >
            </div>
          </div>

          <!-- El resto del formulario permanece igual -->
          <div class="form-row">
            <div class="form-group">
              <label for="url">URL</label>
              <input
                id="url"
                v-model="currentRegistro.url"
                placeholder="Ingrese la URL principal"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="url_2">URL Alternativa</label>
              <input
                id="url_2"
                v-model="currentRegistro.url_2"
                placeholder="Ingrese la URL alternativa"
                class="form-input"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="isp">ISP</label>
              <input
                id="isp"
                v-model="currentRegistro.isp"
                placeholder="Ingrese el proveedor de servicios"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="nombre_BBDD">BBDD</label>
              <input
                id="nombre_BBDD"
                v-model="currentRegistro.nombre_BBDD"
                placeholder="Ingrese el nombre de la BBDD"
                class="form-input"
              />
            </div>
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

    <!-- Modal para Ver Notas -->
    <div v-if="showNotesModal" class="modal-backdrop">
      <div class="modal-container notes-modal" @click.stop>
        <div class="modal-header">
          <h2>
            Notas de {{ viewingNotes.clienteName }} ({{
              viewingNotes.serviceName
            }})
          </h2>
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
  </div>
</template>
<style>
/* Estilos para la vista de registros */

/* Nuevos estilos para el encabezado */
.header-title-container {
  display: flex;
  align-items: center;
  gap: 24px;
}

.header-cards {
  display: flex;
  gap: 16px;
}

.header-card {
  display: flex;
  align-items: center;
  background-color: white;
  border-radius: 10px;
  padding: 10px 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.header-card .card-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.header-card .card-info {
  display: flex;
  flex-direction: column;
}

.header-card .card-label {
  font-size: 12px;
  color: #6c757d;
  margin-bottom: 2px;
}

.header-card .card-value {
  font-size: 18px;
  font-weight: 700;
  color: #2c3e50;
}

.logs-icon {
  background-color: rgba(243, 156, 18, 0.1);
  color: #f39c12;
}

.today-icon {
  background-color: rgba(26, 188, 156, 0.1);
  color: #1abc9c;
}

/* Ajuste de los contadores en una línea compacta como en las otras páginas */
.total-clients-card {
  display: flex;
  align-items: center;
  background-color: white;
  border-radius: 10px;
  padding: 8px 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  min-width: 150px;
  margin-right: 10px;
}

.total-clients-card .card-content {
  display: flex;
  align-items: center;
  width: 100%;
}

.total-clients-card .card-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
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

/* Estilos para el modal más grande - AUMENTADO A 1000px */
.modal-large {
  width: 1000px;
  max-width: 95%;
}

.form-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.form-row .form-group {
  flex: 1;
  min-width: 220px; /* Asegurar un ancho mínimo para evitar que se corten etiquetas */
}

/* Hacer que las etiquetas nunca se corten */
.form-group label {
  white-space: nowrap;
  overflow: visible;
}

/* Estilos para URLs, ISP y BBDD */
.url-cell,
.isp-cell,
.bbdd-cell {
  display: flex;
  align-items: center;
  position: relative;
}

.url-value,
.isp-value,
.bbdd-value {
  flex-grow: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
  margin-right: 8px;
}

.text-truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
  max-width: 180px;
  padding-right: 15px;
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
  opacity: 1;
  visibility: visible;
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

/* Estilos para el contenedor arrastrable */
.draggable {
  cursor: grab;
  overflow-x: auto;
  user-select: none;
}

.draggable:active {
  cursor: grabbing;
}

/* Ajustes de columnas para la tabla */
.column-url {
  width: 150px;
}

.column-isp {
  width: 100px;
}

.column-bbdd {
  width: 100px;
}

.column-user {
  width: 150px;
}

/* Nuevo estilo para el select-like searchbox */
.selector-with-search {
  position: relative;
  width: 100%;
}

/* NUEVOS ESTILOS PARA EL SELECTOR CON BÚSQUEDA */
.searchable-select {
  position: relative;
  width: 100%;
}

.select-input-container {
  position: relative;
  display: flex;
  background-color: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
}

.select-input-container:hover {
  border-color: #c1272d;
}

.select-input-container:focus-within {
  border-color: #c1272d;
  box-shadow: 0 0 0 3px rgba(193, 39, 45, 0.1);
}

.select-input {
  flex: 1;
  border: none !important;
  box-shadow: none !important;
  background: transparent;
  padding-right: 40px;
  z-index: 1;
  position: relative;
}

.select-input:focus {
  outline: none;
  box-shadow: none !important;
  border: none !important;
}

.selected-item-inline {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  font-weight: 500;
  color: #2c3e50;
  pointer-events: none;
  max-width: calc(100% - 70px);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  z-index: 0;
}

.select-icons {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 5px;
  z-index: 2;
}

.clear-button {
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  padding: 0;
  transition: all 0.2s ease;
}

.clear-button:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: #c1272d;
}

.dropdown-icon {
  color: #6c757d;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-results-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 5px;
  max-height: 200px;
  overflow-y: auto;
  background-color: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  z-index: 10;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.search-result-item {
  padding: 10px 15px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  transition: all 0.2s ease;
}

.search-result-item:hover {
  background-color: #f8f9fa;
}

.search-result-item.selected {
  background-color: rgba(193, 39, 45, 0.1);
  color: #c1272d;
  font-weight: 600;
}

.search-no-results {
  padding: 15px;
  text-align: center;
  color: #6c757d;
  font-style: italic;
}

/* Background logo para el modal - SVG de fondo */
.modal-container::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url("../../public/favicon.svg");
  background-repeat: no-repeat;
  background-position: center;
  background-size: 250px;
  opacity: 0.1;
  pointer-events: none;
  z-index: 0;
}

/* Estilos responsivos para la tabla */
@media (max-width: 1280px) {
  .data-table {
    min-width: 1200px;
    width: 100%;
  }

  .url-value,
  .isp-value,
  .bbdd-value {
    max-width: 100px;
  }

  .column-url,
  .column-isp,
  .column-bbdd {
    width: auto;
  }
}

@media (max-width: 768px) {
  .header-title-container {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .header-cards {
    width: 100%;
    justify-content: space-between;
  }

  .header-card {
    flex-basis: 48%;
  }

  .form-row {
    flex-direction: column;
    gap: 8px;
  }

  .modal-large {
    width: 95%;
  }

  .header-actions {
    flex-wrap: wrap;
    gap: 10px;
  }

  .total-clients-card {
    flex-basis: 48%; /* Para que quepa 2 por fila en móvil */
    margin-right: 0;
  }

  .search-container {
    width: 100%;
    margin-top: 10px;
  }

  .search-input {
    width: 100%;
  }

  .create-button {
    margin-top: 10px;
  }
}

/* Ajuste en la tabla para mantener fijo el encabezado */
.table-container {
  max-height: 57vh;
  overflow: auto;
  position: relative;
  border-radius: 16px;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
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
  padding: 16px 12px;
  border-bottom: 1px solid #dee2e6;
}

.data-table td {
  padding: 16px 24px;
  border-bottom: 1px solid #dee2e6;
  font-size: 14px;
  text-align: left;
}

/* Ajustes para datos truncados */
.user-name-cell,
.password-value,
.url-value,
.bbdd-value,
.isp-value,
.registro-desc {
  max-width: 150px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
