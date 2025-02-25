<script setup>
import {
  Form as AForm,
  FormItem as AFormItem,
  Input as AInput
} from "ant-design-vue";
import { useAnalyticsStore } from "@/stores/AnalyticsStore.js";

const analyticsStore = useAnalyticsStore();
</script>

<template>
  <div class="page">
    <a-form ref="form" layout="vertical" class="form">
      <a-form-item v-for="(company, index ) in analyticsStore.filters.tax" :key="index" :label="company.tradeMark" class="form__item">
        <a-input
          v-model:value="company.value"
          suffix="%"
        />
      </a-form-item>
    </a-form>
  </div>
</template>

<style scoped>
.page {
 padding: 10px 10px 30px 10px;
}

.form__item {
  max-width: 100px;
}
</style>