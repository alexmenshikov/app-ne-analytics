<script setup lang="ts">
import NeCard from "./NeCard.vue";
import {PropType} from "vue";

interface Parametr {
  value: number;
  symbol?: string;
  roundTheValue?: boolean;
}


const props = defineProps({
  title: {
    type: String,
    required: true
  },
  info: {
    type: String,
    default: ''
  },
  parameters: {
    type: Array as PropType<Parametr[]>,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  dates: {
    type: Array,
    required: true
  },
  allowedRange: {
    type: Number,
    default: null
  }
});
</script>

<template>
  <NeCard
    :title="title"
    :info="info"
    :parameters="parameters"
    :loading="loading"
    :get-data="allowedRange ? true : false"
  />
</template>

<style scoped>

</style>