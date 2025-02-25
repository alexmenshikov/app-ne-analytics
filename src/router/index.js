import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory("/"),
  routes: [
    {
      path: "/",
      component: () => import("@/pages/NeMain.vue"),
    },
    {
      path: "/tax",
      component: () => import("@/pages/NeTax.vue"),
    }
  ]
})

export default router;
