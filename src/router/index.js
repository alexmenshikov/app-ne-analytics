import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
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
    },
    {
      path: "/store",
      component: () => import("@/pages/NeStore.vue"),
    }
  ]
})

export default router;
