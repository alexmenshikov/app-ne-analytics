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
      <a-form-item v-for="(article, index ) in analyticsStore.filters.cost" :key="index" :label="`${article.tradeMark} - ${article.vendorCode}`" class="form__item">
        <a-input
          v-model:value.number.trim="article.value"
          suffix="₽"
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
  max-width: 250px;
}
</style>