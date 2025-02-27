<script setup>
import dayjs from "dayjs";
import { useAnalyticsStore } from "@/stores/AnalyticsStore.js";
import NeCustomSelect from "@/components/NeCustomSelect.vue";
import NeCard from "@/components/NeCard.vue";
import { onMounted, ref } from "vue";
const analyticsStore = useAnalyticsStore();
const dateFormat = "DD MMM YYYY";

// import { inject } from "vue";
// const locale = inject("locale");
// import ruRu from "ant-design-vue/es/locale/ru_RU";

import {
  Spin as ASpin,
  Form as AForm,
  FormItem as AFormItem,
  RangePicker as ARangePicker,
} from "ant-design-vue";

const disabledDate = (current) => {
  const today = dayjs().startOf('day'); // Начало текущего дня
  const tomorrow = today.add(1, 'day'); // Завтрашний день
  const ninetyDaysAgo = today.subtract(90, 'day'); // 90 дней назад

  // Отключаем даты, которые:
  // 1. Больше или равны завтрашнему дню
  // 2. Меньше 90 дней назад
  return current && (current >= tomorrow || current < ninetyDaysAgo);
};

const previousDates = ref([...analyticsStore.filters.dates]); // Храним предыдущие даты

const handleFiltersDatesChange = async (isOpen) => {
  if (!isOpen) {
    if (
      JSON.stringify(previousDates.value) !==
      JSON.stringify(analyticsStore.filters.dates)
    ) {
      previousDates.value = [...analyticsStore.filters.dates]; // Обновляем предыдущие даты
      analyticsStore.createByProducts();
      await analyticsStore.addSalesByProducts(); // Календарь закрылся, значит выбор окончен — запускаем запрос
      // await analyticsStore.addOrdersByProducts(); // Получаем информацию о заказах
      await analyticsStore.enrichmentByProductsWithAcceptanceReport(); // Получаем информацию о приёмке
      await analyticsStore.enrichmentByProductsWithPromotion();
    }
  }
};

async function updateData(value) {
  const field = value;

  if (field === "warehousePrice") {
    await analyticsStore.enrichmentByProductsWithStorage();
  } else if (field === "acceptanceSum") {
    await analyticsStore.enrichmentByProductsWithAcceptanceReport();
  }
}

onMounted(async () => {
  // await analyticsStore.enrichmentCompaniesInfo();
  // analyticsStore.fillingNalog();
  await analyticsStore.enrichmentWbArticles();
  analyticsStore.createByProducts();
  await analyticsStore.addSalesByProducts();
  // await analyticsStore.addOrdersByProducts();
  await analyticsStore.enrichmentByProductsWithAcceptanceReport();
  await analyticsStore.enrichmentByProductsWithPromotion();

  // cardList.value = await getWbArticles({ apiToken: companyArray[0].apiToken });
  // sellerInfo.value = await getSellerInfo({ apiToken: companyArray[0].apiToken });
});
</script>

<template>
  <div class="page">
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
                <a-form-item label="Укажите диапазон">
                  <a-range-picker
                    v-model:value="analyticsStore.filters.dates"
                    :format="dateFormat"
                    :disabled-date="disabledDate"
                    :allowClear="false"
                    @openChange="handleFiltersDatesChange"
                  />
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
                    v-model:value="analyticsStore.filters.companies"
                    :options="analyticsStore.optionCompanies"
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
        <NeCard
          title="Продажи"
          info="Сумма продаж с учетом применения СПП и ВБ кошелька"
          :parameters="[
            { value: analyticsStore.stats.sales, symbol: '₽', roundTheValue: true },
            { value: analyticsStore.stats.salesCount, symbol: 'шт'}
          ]"
          fieldName="sales"
          :loading="analyticsStore.loadingEnrichmentByProducts !== 0"
        />

        <NeCard
          title="Компенсация"
          :parameters="[
            { value: analyticsStore.stats.compensation, symbol: '₽', roundTheValue: true },
            { value: analyticsStore.stats.compensationCount, symbol: 'шт'}
          ]"
          fieldName="compensation"
          :loading="analyticsStore.loadingEnrichmentByProducts !== 0"
        />

        <NeCard
          title="Реализация"
          info="Сумма продаж до применения СПП и ВБ кошелька"
          :parameters="[
            { value: analyticsStore.stats.realisation, symbol: '₽', roundTheValue: true }
          ]"
          fieldName="realisation"
          :loading="analyticsStore.loadingEnrichmentByProducts !== 0"
        />

        <NeCard
          title="Логистика"
          info="Стоимость доставки товара до покупателя с учетом процента выкупа"
          :parameters="[
            { value: analyticsStore.stats.logistics, symbol: '₽', roundTheValue: true }
          ]"
          fieldName="logistics"
          :loading="analyticsStore.loadingEnrichmentByProducts !== 0"
        />

        <NeCard
          title="Хранение"
          info="Стоимость хранения товара на складах маркетплейса"
          :parameters="[
            { value: analyticsStore.stats.warehousePrice, symbol: '₽', roundTheValue: true }
          ]"
          fieldName="warehousePrice"
          :loading="analyticsStore.loadingEnrichmentByProducts !== 0"
          :get-data="analyticsStore.stats.warehousePrice ? false : true"
          @get="updateData($event)"
        />

        <NeCard
          title="Платная приемка"
          info=""
          :parameters="[
            { value: analyticsStore.stats.acceptanceSum, symbol: '₽', roundTheValue: true }
          ]"
          fieldName="acceptanceSum"
          :loading="analyticsStore.loadingEnrichmentByProducts !== 0"
        />

        <!--        <NeCard-->
        <!--          title="Заказы"-->
        <!--          info=""-->
        <!--          :parameters="[-->
        <!--            { value: analyticsStore.stats.orders, symbol: '₽', roundTheValue: true },-->
        <!--            { value: analyticsStore.stats.ordersCount, symbol: 'шт' }-->
        <!--          ]"-->
        <!--          fieldName="orders"-->
        <!--          :loading="analyticsStore.loadingEnrichmentByProducts !== 0"-->
        <!--        />-->

        <NeCard
          title="Комиссия"
          info=""
          :parameters="[
            { value: analyticsStore.stats.commission, symbol: '₽', roundTheValue: true }
          ]"
          fieldName="commission"
          :loading="analyticsStore.loadingEnrichmentByProducts !== 0"
        />

        <NeCard
          title="Налоги"
          info=""
          :parameters="[
            { value: analyticsStore.stats.tax, symbol: '₽', roundTheValue: true }
          ]"
          fieldName="tax"
          :loading="analyticsStore.loadingEnrichmentByProducts !== 0"
        />

        <NeCard
          title="Реклама"
          info=""
          :parameters="[
            { value: analyticsStore.stats.advertisingExpense, symbol: '₽', roundTheValue: true }
          ]"
          fieldName="advertisingExpense"
          :loading="analyticsStore.loadingEnrichmentByProducts !== 0"
        />

        <!--        <NeCard-->
        <!--          title="Прочие удержания"-->
        <!--          info=""-->
        <!--          :parameters="[-->
        <!--            { value: analyticsStore.stats.otherDeduction, symbol: '₽', roundTheValue: true }-->
        <!--          ]"-->
        <!--          fieldName="otherDeduction"-->
        <!--          :loading="analyticsStore.loadingEnrichmentByProducts !== 0"-->
        <!--        />-->
      </div>
    </template>
  </div>
</template>

<style scoped>
.page {
  padding: 10px 10px 30px 10px;
}

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
  grid-template-columns: 1fr;
}

.table {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-gap: 10px;
}

@media (min-width: 680px) {
  .form__items {
    grid-template-columns: 1fr;
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
    grid-column-gap: 10px;
  }

  .period-report__items {
    grid-template-columns: 1fr;
  }

  .table {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (min-width: 1180px) {
  .period-report__items {
    grid-template-columns: 1fr;
  }

  .table {
    grid-template-columns: repeat(5, 1fr);
  }
}
</style>