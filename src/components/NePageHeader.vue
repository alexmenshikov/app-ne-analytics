<script setup>
import {
  PageHeader as APageHeader,
} from "ant-design-vue";

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  subTitle: {
    type: String,
    default: "",
  }
})
</script>

<template>
  <a-page-header
    :title="title"
    :sub-title="subTitle"
    @back="() => $router.go(-1)"
  >
    <template #extra>
      <slot name="extra"/>
    </template>
  </a-page-header>
</template>

<style scoped></style>