<script setup lang="ts">
import { ref, watchEffect } from "vue";
import { useRoute } from "vue-router";
import { RouterLink } from "vue-router";
import {
  Layout as ALayout,
  LayoutSider as ALayoutSider,
  Menu as AMenu,
  MenuItem as AMenuItem,
  LayoutContent as ALayoutContent,
} from "ant-design-vue";
import {
  AppstoreOutlined as AAppstoreOutlined,
  AuditOutlined as AAuditOutlined,
  ShoppingOutlined as AAShoppingOutlined,
  PlusCircleOutlined as AAPlusCircleOutlined,
} from "@ant-design/icons-vue";

const collapsed = ref<boolean>(true);
const selectedKeys = ref<string[]>(['analytics']);

const route = useRoute();

watchEffect(() => {
  const currentRoute = route.path;
  switch (currentRoute) {
    case '/store':
      selectedKeys.value = ['store'];
      break;
    case '/tax':
      selectedKeys.value = ['tax'];
      break;
    case '/cost':
      selectedKeys.value = ['cost'];
      break;
    default:
      selectedKeys.value = ['analytics'];
      break;
  }
});
</script>

<template>
<!--  <vue3-progress-bar />-->

  <a-layout id="components-layout-demo-side" style="min-height: 100vh">
    <a-layout-sider v-model:collapsed="collapsed" collapsible>
      <div class="logo" />
      <a-menu
        v-model:selectedKeys="selectedKeys"
        theme="dark"
        mode="inline"
      >
        <a-menu-item key="store">
          <router-link to="/store">
            <a-a-plus-circle-outlined />
            <span>Мои магазины</span>
          </router-link>
        </a-menu-item>

        <a-menu-item key="analytics">
          <router-link to="/">
            <a-appstore-outlined />
            <span>Аналитика</span>
          </router-link>
        </a-menu-item>

        <a-menu-item key="tax">
          <router-link to="/tax">
            <a-audit-outlined />
            <span>Налог</span>
          </router-link>
        </a-menu-item>

        <a-menu-item key="cost">
          <router-link to="/cost">
            <a-a-shopping-outlined />
            <span>Себестоимость</span>
          </router-link>
        </a-menu-item>
      </a-menu>
    </a-layout-sider>

    <a-layout>
      <a-layout-content>
        <suspense>
          <slot />
        </suspense>
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<style scoped>
#components-layout-demo-side .logo {
  height: 32px;
  margin: 16px;
  background-repeat: no-repeat;
  background-size: contain;
  background-position: left;
}

.site-layout .site-layout-background {
  background: #fff;
}

[data-theme="dark"] .site-layout .site-layout-background {
  background: #141414;
}
</style>
