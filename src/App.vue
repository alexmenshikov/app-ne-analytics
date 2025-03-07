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
  // analyticsStore.initCompanyArray(JSON.parse(localStorage.getItem("companyArray")));
  const savedCompanies = JSON.parse(localStorage.getItem("companyArray"));
  analyticsStore.initCompanyArray(savedCompanies);

  if (!analyticsStore.initialized && analyticsStore.companyArray && analyticsStore.companyArray.length > 0) {
    analyticsStore.initialized = true; // Запрещаем повторный вызов

    await analyticsStore.enrichmentCompaniesInfo();
    analyticsStore.fillingTax();
    await analyticsStore.enrichmentWbArticles();
    await analyticsStore.createByProducts();
    await analyticsStore.addSalesByProducts();
    await analyticsStore.addOrdersByProducts();
    await analyticsStore.enrichmentByProductsWithAcceptanceReport();
    await analyticsStore.enrichmentByProductsWithPromotion();
    analyticsStore.fillingCost();
  }

  // if(analyticsStore.companyArray && analyticsStore.companyArray.length > 0) {
  //   await analyticsStore.enrichmentCompaniesInfo();
  //   await analyticsStore.enrichmentWbArticles();
  //   analyticsStore.fillingTax();
  //   analyticsStore.fillingCost();
  // }
  // analyticsStore.isFirstRun = false;
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
