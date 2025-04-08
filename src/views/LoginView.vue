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

    <!-- Multi-Factor Authentication Modal -->
    <div v-if="showMFAModal" class="mfa-modal-backdrop">
      <div class="mfa-modal-container">
        <div class="mfa-modal-header">
          <h2>Verificación en Dos Pasos</h2>
          <button @click="closeMFAModal" class="mfa-modal-close">×</button>
        </div>
        <div class="mfa-modal-content">
          <p>
            Se ha enviado un código de verificación a tu correo electrónico.
          </p>
          <div class="form-group">
            <label for="mfaCode">Código de Verificación</label>
            <input
              type="text"
              id="mfaCode"
              v-model="credentials.mfaCode"
              placeholder="Ingresa el código de 6 dígitos"
              maxlength="6"
            />
          </div>
          <div v-if="error" class="error-message">
            {{ error }}
          </div>
          <button @click="verifyMFACode" class="mfa-verify-button">
            Verificar Código
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
import bcrypt from "bcryptjs";

export default {
  setup() {
    class LoginAttemptTracker {
      constructor() {
        this.attempts = JSON.parse(
          localStorage.getItem("loginAttempts") || "{}"
        );
        this.MAX_ATTEMPTS = 3;
        this.LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
      }

      canAttemptLogin(username) {
        if (!username) return true;

        // Ensure user attempts exist
        const userAttempts = this.attempts[username] || {
          count: 0,
          lastAttempt: 0,
          lockedUntil: 0,
        };

        const now = Date.now();

        // Check if account is locked
        if (userAttempts.lockedUntil > now) {
          const remainingMinutes = Math.ceil(
            (userAttempts.lockedUntil - now) / 60000
          );
          throw new Error(
            `Demasiados intentos. Intenta de nuevo en ${remainingMinutes} minutos.`
          );
        }

        return true;
      }

      recordAttempt(username, success) {
        if (!username) return;

        // Ensure user attempts exist
        if (!this.attempts[username]) {
          this.attempts[username] = {
            count: 0,
            lastAttempt: 0,
            lockedUntil: 0,
          };
        }

        const now = Date.now();
        const userAttempts = this.attempts[username];

        if (success) {
          // Reset on successful login
          userAttempts.count = 0;
          userAttempts.lastAttempt = now;
          userAttempts.lockedUntil = 0;
        } else {
          // Increment failed attempts
          userAttempts.count++;
          userAttempts.lastAttempt = now;

          // Lock if max attempts reached
          if (userAttempts.count >= this.MAX_ATTEMPTS) {
            userAttempts.lockedUntil = now + this.LOCKOUT_DURATION;
          }
        }

        // Save to localStorage
        localStorage.setItem("loginAttempts", JSON.stringify(this.attempts));
      }
    }

    const credentials = reactive({
      nombre: "",
      contraseña: "",
    });

    const error = ref(null);
    const isLoading = ref(false);
    const router = useRouter();
    const loginTracker = new LoginAttemptTracker();

    const handleLogin = async () => {
      // Reset previous errors
      error.value = null;

      // Trim inputs
      credentials.nombre = (credentials.nombre || "").trim();
      credentials.contraseña = (credentials.contraseña || "").trim();

      // Validate inputs
      if (!credentials.nombre) {
        error.value = "Ingrese un nombre de usuario";
        return;
      }

      if (!credentials.contraseña) {
        error.value = "Ingrese una contraseña";
        return;
      }

      try {
        // Check if login is allowed
        loginTracker.canAttemptLogin(credentials.nombre);

        // Start loading
        isLoading.value = true;

        // Fetch users
        const usuariosResponse = await fetch(
          "http://152.228.135.50:5006/api/Usuario",
          {
            method: "GET",
            headers: { accept: "*/*" },
          }
        );

        if (!usuariosResponse.ok) {
          throw new Error("No se pudo obtener la lista de usuarios");
        }

        const usuarios = await usuariosResponse.json();

        // Find user
        const usuarioValido = usuarios.find(
          (usuario) =>
            usuario.nombre === credentials.nombre &&
            bcrypt.compareSync(credentials.contraseña, usuario.contraseña)
        );

        if (usuarioValido) {
          // Successful login
          loginTracker.recordAttempt(credentials.nombre, true);

          // Store user information
          localStorage.setItem("token", "admin-token");
          localStorage.setItem("username", usuarioValido.nombre);
          localStorage.setItem("esAdmin", usuarioValido.esAdmin);
          localStorage.setItem(
            "clientesAutorizados",
            JSON.stringify(usuarioValido.clientes || [])
          );

          // Navigate to dashboard
          router.push("/dashboard");
        } else {
          // Failed login
          loginTracker.recordAttempt(credentials.nombre, false);
          throw new Error("Credenciales incorrectas");
        }
      } catch (err) {
        // Handle errors
        error.value =
          err.message || "Error inesperado. Por favor, contacta soporte.";

        // Log failed attempt details
        console.error({
          message: "Login failed",
          error: err.message,
          timestamp: new Date().toISOString(),
          username: credentials.nombre,
        });
      } finally {
        // Always stop loading
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
/* Multi-Factor Authentication Modal Styles */
.mfa-modal-backdrop {
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
}

.mfa-modal-container {
  background-color: white;
  border-radius: 10px;
  width: 400px;
  padding: 24px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.mfa-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.mfa-modal-header h2 {
  margin: 0;
  color: #c1272d;
}

.mfa-modal-close {
  background: none;
  border: none;
  font-size: 24px;
  color: #6c757d;
  cursor: pointer;
}

.mfa-modal-content p {
  margin-bottom: 20px;
  color: #6c757d;
}

.mfa-verify-button {
  background-color: #c1272d;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 5px;
  font-weight: bold;
  width: 100%;
  margin-top: 16px;
  transition: background-color 0.3s ease;
}
</style>
