import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import LoginView from "@/views/LoginView.vue";
import DashboardView from "@/views/DashboardView.vue";
import ClientesView from "@/views/ClientesView.vue";
import TiposServicioView from "@/views/TiposServicioView.vue";
import RegistrosView from "@/views/RegistrosView.vue";

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

  if (to.matched.some((record) => record.meta.requiresAuth)) {
    if (!isAuthenticated) {
      next("/");
    } else {
      next();
    }
  } else {
    next();
  }
});

export default router;
