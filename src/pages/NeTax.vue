<script setup>
import {
  Form as AForm,
  FormItem as AFormItem,
  Input as AInput
} from "ant-design-vue";
import { useAnalyticsStore } from "@/stores/AnalyticsStore.js";
import NePageHeader from "@/components/NePageHeader.vue";

const analyticsStore = useAnalyticsStore();
</script>

<template>
  <ne-page-header title="Налоговые ставки"/>

  <div class="page">
    <div v-if="analyticsStore.filters.tax.length > 0">
      <a-form ref="form" layout="vertical" class="form">
        <a-form-item v-for="(company, index ) in analyticsStore.filters.tax" :key="index" :label="company.name" class="form__item">
          <a-input
            v-model:value.number.trim="company.value"
            suffix="%"
          />
        </a-form-item>
      </a-form>
    </div>
    <div v-else>
      Нет компаний
    </div>
  </div>
</template>

<style scoped>
.page {
 padding: 10px 10px 30px 10px;
}
</style>