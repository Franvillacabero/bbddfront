import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import LoginView from "@/views/LoginView.vue";
import DashboardView from "@/views/DashboardView.vue";
import ClientesView from "@/views/ClientesView.vue";
import TiposServicioView from "@/views/TiposServicioView.vue";
import RegistrosView from "@/views/RegistrosView.vue";
import UsuariosView from "@/views/UsuariosView.vue";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: "Login",
    component: LoginView,
  },
  {
    path: "/dashboard",
    component: DashboardView,
    meta: { requiresAuth: true },
    children: [
      {
        path: "",
        redirect: "/dashboard/clientes",
      },
      {
        path: "clientes",
        name: "Clientes",
        component: ClientesView,
      },
      {
        path: "tipos-servicio",
        name: "TiposServicio",
        component: TiposServicioView,
      },
      {
        path: "registros",
        name: "Registros",
        component: RegistrosView,
      },
      {
        path: "usuarios",
        name: "Usuarios",
        component: UsuariosView,
        meta: { requiresAdmin: true },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

// Guardia de navegación
router.beforeEach((to, from, next) => {
  const isAuthenticated = !!localStorage.getItem("token");
  const isAdmin = localStorage.getItem("esAdmin") === "true";

  if (to.matched.some((record) => record.meta.requiresAuth)) {
    if (!isAuthenticated) {
      next("/");
    } else if (
      to.matched.some((record) => record.meta.requiresAdmin) &&
      !isAdmin
    ) {
      // Si la ruta requiere admin y el usuario no es admin, redirigir al dashboard
      next("/dashboard/clientes");
    } else {
      next();
    }
  } else {
    next();
  }
});

export default router;
