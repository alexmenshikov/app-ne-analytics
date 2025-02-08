<script setup>
import { watch, computed, ref, defineComponent } from "vue";
import {
  Select as ASelect,
} from "ant-design-vue";

const VNodes = defineComponent({
  props: {
    vnodes: {
      type: Object,
      required: true,
    },
  },
  render() {
    return this.vnodes;
  },
});

const props = defineProps({
  options: {
    type: Array,
    required: true,
  },
  value: {
    type: Array,
    required: true,
  },
  placeholder: {
    type: String,
    default: "Выберите элементы",
  }
});

const emit = defineEmits(["update:value"]);

// Локальное состояние синхронизируем с пропсом value
const selectedValues = ref([...props.value]);

watch(() => props.value, (newValue) => {
  selectedValues.value = [...newValue];
});

// Проверка: выбраны ли все элементы
const isAllSelected = computed(() => selectedValues.value.length === props.options.length);

// Функция для выбора всех элементов или очистки
const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedValues.value = [];
  } else {
    selectedValues.value = props.options.map(option => option.value);
  }
  emit("update:value", selectedValues.value);
};
</script>

<template>
  <a-select
    v-model:value="selectedValues"
    mode="multiple"
    :placeholder="placeholder"
    :options="options"
    max-tag-count="responsive"
    @change="emit('update:value', selectedValues)"
    allow-clear
  >
    <template #dropdownRender="{ menuNode: menu }">
      <div>
        <div class="select-all-option" @click="toggleSelectAll">
          {{ isAllSelected ? 'Очистить все' : 'Выбрать все' }}
        </div>
        <v-nodes :vnodes="menu" />
      </div>
    </template>
  </a-select>
</template>

<style scoped>
/* Стили для кнопки "Выбрать все" */
.select-all-option {
  padding: 5px 12px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s ease;
  border-radius: 4px;
}

.select-all-option:hover {
  background: #f5f5f5;
}
</style>