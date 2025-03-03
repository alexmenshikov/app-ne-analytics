import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  // history: createWebHistory("/"),
  history: createWebHistory("/app-ne-analytics/"),
  routes: [
    {
      path: "/",
      component: () => import("@/pages/NeMain.vue"),
    },
    {
      path: "/tax",
      component: () => import("@/pages/NeTax.vue"),
    },
    {
      path: "/cost",
      component: () => import("@/pages/NeCost.vue"),
    }
  ]
})

export default router;
