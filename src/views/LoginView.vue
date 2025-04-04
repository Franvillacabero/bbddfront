// src/views/LoginView.vue
<template>
  <div class="login-container">
    <div class="login-wrapper">
      <div class="login-image">
        <div class="logo-placeholder">Netymedia</div>
      </div>
      <form @submit.prevent="handleLogin" class="login-form">
        <h2>Acceso Administrador</h2>

        <div class="form-group">
          <label for="nombre">Nombre</label>
          <div class="input-wrapper">
            <span class="icon-user">👤</span>
            <input
              type="text"
              id="nombre"
              v-model="credentials.nombre"
              required
              placeholder="Ingresa tu nombre"
            />
          </div>
        </div>

        <div class="form-group">
          <label for="password">Contraseña</label>
          <div class="input-wrapper">
            <span class="icon-lock">🔒</span>
            <input
              type="password"
              id="password"
              v-model="credentials.contraseña"
              required
              placeholder="Ingresa tu contraseña"
            />
          </div>
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <button type="submit" :disabled="isLoading" class="login-button">
          {{ isLoading ? "Iniciando..." : "Iniciar Sesión" }}
        </button>
      </form>
    </div>
  </div>
</template>

<script>
import { ref, reactive } from "vue";
import { useRouter } from "vue-router";

export default {
  setup() {
    const credentials = reactive({
      nombre: "",
      contraseña: "",
    });

    const error = ref(null);
    const isLoading = ref(false);
    const router = useRouter();

    const handleLogin = async () => {
      error.value = null;
      isLoading.value = true;

      try {
        // Obtener lista de usuarios
        const usuariosResponse = await fetch(
          "http://152.228.135.50:5006/api/Usuario",
          {
            method: "GET",
            headers: {
              accept: "*/*",
            },
          }
        );

        if (!usuariosResponse.ok) {
          throw new Error("No se pudo obtener la lista de usuarios");
        }

        const usuarios = await usuariosResponse.json();

        // Verificar si el usuario existe y la contraseña coincide
        const usuarioValido = usuarios.find(
          (usuario) =>
            usuario.nombre === credentials.nombre &&
            usuario.contraseña === credentials.contraseña
        );

        if (usuarioValido) {
          localStorage.setItem("userToken", "admin-token");
          localStorage.setItem("username", usuarioValido.nombre);
          router.push("/dashboard");
        } else {
          error.value = "Credenciales incorrectas";
        }
      } catch (err) {
        console.error("Error de inicio de sesión:", err);
        error.value = "Error de conexión. Por favor, intenta más tarde.";
      } finally {
        isLoading.value = false;
      }
    };

    return {
      credentials,
      error,
      isLoading,
      handleLogin,
    };
  },
};
</script>
<style scoped>
.body {
  margin: 0;
  padding: 0;
}
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
  font-family: Arial, sans-serif;
}

.login-wrapper {
  display: flex;
  background: white;
  border-radius: 10px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  max-width: 900px;
  width: 100%;
}

.login-image {
  flex: 1;
  background-color: #c1272d;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
}

.logo-placeholder {
  color: white;
  font-size: 2rem;
  font-weight: bold;
  text-transform: uppercase;
}

.login-form {
  flex: 1;
  padding: 3rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

h2 {
  color: #c1272d;
  text-align: center;
  margin-bottom: 2rem;
  font-size: 2rem;
  font-weight: bold;
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: bold;
}

.input-wrapper {
  position: relative;
}

.input-wrapper .icon-user,
.input-wrapper .icon-lock {
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #c1272d;
}

input {
  width: 100%;
  padding: 12px 12px 12px 40px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 1rem;
  transition: all 0.3s ease;
}

input:focus {
  outline: none;
  border-color: #c1272d;
  box-shadow: 0 0 0 3px rgba(193, 39, 45, 0.1);
}

.error-message {
  color: #c1272d;
  text-align: center;
  margin-bottom: 1rem;
  font-weight: bold;
}

.login-button {
  background-color: #c1272d;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 5px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.login-button:hover {
  background-color: #a01218;
}

.login-button:disabled {
  background-color: #e0a0a4;
  cursor: not-allowed;
}
</style>
