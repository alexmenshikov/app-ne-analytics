<script setup>
import {computed, onMounted, ref, h, defineComponent, watch} from "vue";
import {
  ConfigProvider as AConfigProvider,
  Spin as ASpin,
  Form as AForm,
  FormItem as AFormItem,
  Select as ASelect,
  RangePicker as ARangePicker,
} from "ant-design-vue";
import ruRu from "ant-design-vue/es/locale/ru_RU";
import dayjs from "dayjs";
import ru from "dayjs/locale/ru";
import utc from "dayjs/plugin/utc";
import { useAnalyticsStore } from "./stores/AnalyticsStore.js";
import { getWbArticles } from "./composible/getWbArticles.js";
import { getSellerInfo } from "./composible/getSellerInfo.js";
import NeCustomSelect from "./components/NeCustomSelect.vue";
import NeCard from "./components/NeCard.vue";

dayjs.locale(ru);
dayjs.extend(utc);

const analyticsStore = useAnalyticsStore();

const companyArray = [
  {
    id: 1,
    name: "Ne Vi",
    apiToken: "eyJhbGciOiJFUzI1NiIsImtpZCI6IjIwMjUwMTIwdjEiLCJ0eXAiOiJKV1QifQ.eyJlbnQiOjEsImV4cCI6MTc1MzgyNTE3NiwiaWQiOiIwMTk0YWM0Ny1kNWI3LTdjYzItYTRmZC1hYzgwNzI4ZjU3YTAiLCJpaWQiOjE5NjI0NzM2LCJvaWQiOjQxMjc0NjcsInMiOjEwNzM3NDE5MjYsInNpZCI6Ijg0YjlkNmQzLTAxMTItNDBiZi05MTZiLWVlZDFkOGY3NjBhNSIsInQiOmZhbHNlLCJ1aWQiOjE5NjI0NzM2fQ.9rXa96vOM8BIH5HcHYMyUWqI7G3tbcrEgpiqmAI0GQQisRlEooezoKxi-zcem8JMmJtsrejJC4rybYCW-LaZ6g",
  },
];

const companySelected = ref([1]);
const companyOptions = companyArray.map(company => ({
  label: company.name,
  value: company.id
}));

// const cardList = ref([]);
// const sellerInfo = ref([]);

const dateFormat = "DD MMM YYYY";

// const value4 = ref([]);

onMounted(async () => {
  await analyticsStore.enrichmentCompaniesInfo();
  await analyticsStore.enrichmentWbArticles();
  await analyticsStore.enrichmentByProducts();

  // cardList.value = await getWbArticles({ apiToken: companyArray[0].apiToken });
  // sellerInfo.value = await getSellerInfo({ apiToken: companyArray[0].apiToken });
});

watch(() => analyticsStore.filters.dates, async () => {
  await analyticsStore.enrichmentByProducts();
}, { deep: true });

// console.log(cardList);

// const articleOption = computed(() => {
//   if (Array.isArray(cardList.value)) {
//     return cardList.value.map(card => ({
//       value: card.nmID,
//       label: card.vendorCode,
//     }));
//   }
//   return [];
// });
// const articleSelected = ref([]);

// const categoryOption = computed(() => {
//   if (!cardList.value) return [];
//
//   return Array.from(
//     new Map(cardList.value.map(card => [card.category, {
//       value: card.category,
//       label: card.category
//     }])).values()
//   );
// });
// const categorySelected = ref([]);

// Функция, которая отключает даты:
// 1. Начиная с завтрашнего дня
// 2. Более 90 дней назад от текущей даты
const disabledDate = (current) => {
  const today = dayjs().startOf('day'); // Начало текущего дня
  const tomorrow = today.add(1, 'day'); // Завтрашний день
  const ninetyDaysAgo = today.subtract(90, 'day'); // 90 дней назад

  // Отключаем даты, которые:
  // 1. Больше или равны завтрашнему дню
  // 2. Меньше 90 дней назад
  return current && (current >= tomorrow || current < ninetyDaysAgo);
};

// const getPreviousMonth = () => dayjs().subtract(1, "month").startOf("month"); // Предыдущий месяц
// const getCurrentMonth = () => dayjs().startOf("month"); // Текущий месяц

</script>

<template>
  <a-config-provider :locale="ruRu">
    <div v-if="analyticsStore.loading !== 0" class="spinner">
      <a-spin
        tip="Идёт загрузка..."
        size="large"
      />
    </div>

    <template v-else>
      <a-form ref="form" layout="vertical" class="form">
        <div class="form__items">
          <div class="period-report">
            <div class="period-report__title">Период отчета</div>

            <div class="period-report__items">
              <div class="period-report__item">
                <a-form-item label=" ">
                  <a-range-picker
                    :value="analyticsStore.filters.dates"
                    :format="dateFormat"
                    :disabled-date="disabledDate"
                    :allowClear="false"
                    @change="analyticsStore.setDate($event)"
                  />
<!--                  :default-picker-value="[getPreviousMonth(), getCurrentMonth()]"-->
                </a-form-item>
              </div>
            </div>
          </div>

          <div class="filter">
            <div class="filter__title">Фильтры</div>

            <div class="filter__items">
              <div class="filter__items-item">
                <a-form-item label="Компании">
                  <ne-custom-select
                    :options="analyticsStore.optionCompanies"
                    :value="analyticsStore.filters.companies"
                    placeholder="Все компании"
                  />
                </a-form-item>
              </div>

              <div class="filter__items-item">
                <a-form-item label="Категории">
                  <ne-custom-select
                    v-model:value="analyticsStore.filters.categories"
                    :options="analyticsStore.optionCategories"
                    placeholder="Все категории"
                  />
                </a-form-item>
              </div>

              <div class="filter__items-item">
                <a-form-item label="Артикулы" class="filter__items-item">
                  <ne-custom-select
                    v-model:value="analyticsStore.filters.articles"
                    :options="analyticsStore.optionArticles"
                    placeholder="Все артикулы"
                  />
                </a-form-item>
              </div>
            </div>
          </div>
        </div>
      </a-form>

      <div class="table">
        <!--      <NeCard-->
        <!--        title="Чистая прибыль / Маржинальность"-->
        <!--        info="Прибыль за вычетом всех расходов (себестоимость, логистика, хранение, штрафы, комиссия маркетплейса, реклама, налог, фф, опер. расходы и тд)"-->
        <!--        :parameters="[-->
        <!--          {-->
        <!--            value: 94, symbol: ''-->
        <!--            },-->
        <!--          {-->
        <!--            value: 22.5, symbol: '%'-->
        <!--          }-->
        <!--          ]"-->
        <!--      />-->

        <!--      <NeCard-->
        <!--        title="Прибыль без операционных расходов"-->
        <!--        info="Прибыль без учета операционных расходов"-->
        <!--        :parameters="[-->
        <!--          {-->
        <!--            value: 10, symbol: ''-->
        <!--          }-->
        <!--          ]"-->
        <!--      />-->

        <NeCard
          title="Продажи"
          info="Сумма продаж с учетом применения СПП и ВБ кошелька"
          :parameters="[
          { value: analyticsStore.stats.sales, symbol: '₽'},
          { value: analyticsStore.stats.totalSales, symbol: 'шт'}
        ]"
        />
      </div>
    </template>
  </a-config-provider>
</template>

<style scoped>
.spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  height: calc(100vh - 40px);
}

.form__items {
  display: grid;
  grid-template-columns: 1fr;
}

.period-report__title,
.filter__title {
  font-size: 20px;
}

.period-report__items {
  display: grid;
  grid-template-columns: 1fr;
}

.filter__items {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-column-gap: 10px;
}

.table {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-gap: 10px;
}

@media (min-width: 680px) {
  .form__items {
    grid-template-columns: 1fr 1fr;
  }

  .period-report__items {
    grid-template-columns: 1fr;
  }

  .filter__items {
    grid-template-columns: repeat(3, 1fr);
    grid-column-gap: 10px;
  }

  .table {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 840px) {
  .form__items {
    grid-template-columns: 1fr 1fr;
  }

  .period-report__items {
    grid-template-columns: 1fr 1fr;
  }

  .table {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (min-width: 1180px) {
  .table {
    grid-template-columns: repeat(5, 1fr);
  }
}
</style>
