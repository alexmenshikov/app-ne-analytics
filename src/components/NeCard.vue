<script setup lang="ts">
import { PropType } from "vue";
import {
  Statistic as AStatistic,
  Tooltip as ATooltip,
} from "ant-design-vue";
import {
  InfoCircleOutlined
} from '@ant-design/icons-vue';

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
  }
});

const formatPrice = (value) => {
  return new Intl.NumberFormat("ru-RU").format(value);
};
</script>

<template>
  <div class="card">
    <div class="card__header">
      <div v-if="title" class="card__header-title">
        {{ title }}
      </div>
      <a-tooltip placement="top">
        <template #title>
          <span>{{ info }}</span>
        </template>
        <InfoCircleOutlined />
      </a-tooltip>
    </div>

    <div class="card__body">
      <div class="card__body-value" v-for="(parameter, index) in parameters" :key="index">
        <template v-if="index === 0">
          {{ parameter.roundTheValue ? formatPrice(Math.round(parameter.value)) : formatPrice(parameter.value.toFixed(2)) }} {{ parameter.symbol }}
        </template>
        <template v-else>
          &nbsp;/ {{ parameter.roundTheValue ? formatPrice(Math.round(parameter.value)) : formatPrice(parameter.value.toFixed(2)) }} {{ parameter.symbol }}
        </template>
      </div>
    </div>
  </div>

<!--  <div class="card__body-value">-->
<!--    {{ formatPrice(1000) }} ₽ / {{ formatPrice(2000) }} шт-->
<!--  </div>-->
</template>

<style scoped>
.card {
  background-color: #fff;
  //border-radius: 10px;
  border-radius: 16px;
  border: 1px solid #d9d9d9;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  //padding: 12px;
  padding: 15px;
  //box-shadow: 0 2px 16px rgba(0, 0, 0, .08);
}

.card__header {
  align-items: flex-start;
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
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
    //border-radius: 10px;
    border-radius: 16px;
    //border: 1px solid #d9d9d9;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    //padding: 12px;
    padding: 15px;
    //box-shadow: 0 2px 16px rgba(0, 0, 0, .08);
  }

  .card__header {
    align-items: flex-start;
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
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

  .card__body-parameter,
  .card__body-value,
  .card__body-symbol,
  .card__body-separator {
    //font-weight: 700;
  }

  .card__body-value,
  .card__body-separator {
    line-height: 1.5714285714285714;
    font-size: 24px;
  }

  .card__body-symbol {
    font-size: 18px;
  }
}
</style>