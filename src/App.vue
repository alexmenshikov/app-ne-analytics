<script setup>
import {
  ConfigProvider as AConfigProvider,
} from "ant-design-vue";
import ruRu from "ant-design-vue/es/locale/ru_RU";
import NeLayoutApplication from "@/layouts/NeLayoutApplication.vue";
import {onMounted} from "vue";
import { useAnalyticsStore } from "@/stores/AnalyticsStore.js";
const analyticsStore = useAnalyticsStore();

import dayjs from "dayjs";
import ru from "dayjs/locale/ru";
import utc from "dayjs/plugin/utc";

dayjs.locale(ru);
dayjs.extend(utc);

onMounted(async () => {
  await analyticsStore.enrichmentCompaniesInfo();
  analyticsStore.fillingTax();
});
</script>

<template>
  <a-config-provider :locale="ruRu">
    <ne-layout-application>
      <router-view />
    </ne-layout-application>
  </a-config-provider>
</template>

<style scoped>
</style>
