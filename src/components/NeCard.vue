<script setup lang="ts">
import { PropType, ref } from "vue";
import {
  Button as AButton,
  Tooltip as ATooltip,
  SkeletonInput as ASkeletonInput,
} from "ant-design-vue";
import {
  InfoCircleOutlined,
  DownloadOutlined
} from "@ant-design/icons-vue";

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
  fieldName: {
    type: String,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  getData: {
    type: Boolean,
    default: false
  }
});

const formatPrice = (value: number) => {
  return new Intl.NumberFormat("ru-RU").format(value);
};

const emit = defineEmits(["get"]);

const disabledButton = ref(false);

function get() {
  // disabledButton.value = true;
  emit('get', props.fieldName);
}
</script>

<template>
  <div class="card">
    <div class="card__header">
      <div v-if="title" class="card__header-title">
        {{ title }}
      </div>
      <a-tooltip v-if="info" placement="top">
        <template #title>
          <span>{{ info }}</span>
        </template>
        <InfoCircleOutlined />
      </a-tooltip>
    </div>

    <div class="card__body">
      <template v-if="getData">
        <a-button
          size="small" style="margin-top: 5px;"
          :disabled="disabledButton"
          @click="get"
        >
          <template #icon><DownloadOutlined /></template>Получить
        </a-button>
      </template>

      <template v-else>
        <a-skeleton-input v-if="loading" style="width: 100%" active size="default" />

        <div v-else class="card__body-value" v-for="(parameter, index) in parameters" :key="index">
          <template v-if="index === 0">
            <div v-if="parameter.value || parameter.value === 0">
              {{ parameter.roundTheValue ? formatPrice(Math.round(parameter.value)) : formatPrice(parseFloat(parameter.value.toFixed(2))) }} {{ parameter.symbol }}
            </div>
            <div v-else>
              Нет данных
            </div>
          </template>
          <template v-else>
            <div v-if="parameter.value || parameter.value === 0">
              &nbsp;/ {{ parameter.roundTheValue ? formatPrice(Math.round(parameter.value)) : formatPrice(parseFloat(parameter.value.toFixed(2))) }} {{ parameter.symbol }}
            </div>
            <div v-else>
              &nbsp;/ Нет данных
            </div>
          </template>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.card {
  background-color: #fff;
  border-radius: 10px;
  border: 1px solid #d9d9d9;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 15px;
}

.card__header {
  align-items: flex-start;
  display: flex;
  justify-content: space-between;
}

.card__header-title {
  margin-bottom: 4px;
  color: rgba(0, 0, 0, 0.45);
  font-size: 12px;
  padding-right: 10px;
}

.card__body {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
}

.card__body-value {
  line-height: 1.5714285714285714;
  font-size: 18px;
}

.card__body-symbol {
  font-size: 18px;
}

@media (min-width: 1520px) {
  .card {
    background-color: #fff;
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 15px;
  }

  .card__header {
    align-items: flex-start;
    display: flex;
    justify-content: space-between;
  }

  .card__header-title {
    margin-bottom: 4px;
    color: rgba(0, 0, 0, 0.45);
    font-size: 14px;
    padding-right: 10px;
  }

  .card__body {
    align-items: center;
    display: flex;
  }

  .card__body-value {
    line-height: 1.5714285714285714;
    font-size: 24px;
  }

  .card__body-symbol {
    font-size: 18px;
  }
}
</style>