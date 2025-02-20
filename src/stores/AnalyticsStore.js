import { defineStore } from "pinia";
import { computed, nextTick, ref, watch } from "vue";
import {message} from "ant-design-vue";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { getSellerInfo } from "../composible/getSellerInfo.js";
import { getWbArticles } from "../composible/getWbArticles.js";
import { getSales } from "../composible/getSales.js";
import { createPaidStorage } from "../composible/createPaidStorage.js";
import { getPaidStorage } from "../composible/getPaidStorage.js";
import { updateSalesByProducts } from "../composible/updateSalesByProducts.js";
import { updateByProductsWithStorage } from "../composible/updateByProductsWithStorage.js";
import { getAcceptanceReport } from "../composible/getAcceptanceReport.js";
import {updateByProductsWithAcceptanceReport} from "../composible/updateByProductsWithAcceptanceReport.js";

dayjs.extend(isoWeek);

export const useAnalyticsStore = defineStore("AnalyticsStore", () => {
  const companyArray = ref([
    {
      id: 1,
      apiToken: "eyJhbGciOiJFUzI1NiIsImtpZCI6IjIwMjUwMTIwdjEiLCJ0eXAiOiJKV1QifQ.eyJlbnQiOjEsImV4cCI6MTc1MzgyNTE3NiwiaWQiOiIwMTk0YWM0Ny1kNWI3LTdjYzItYTRmZC1hYzgwNzI4ZjU3YTAiLCJpaWQiOjE5NjI0NzM2LCJvaWQiOjQxMjc0NjcsInMiOjEwNzM3NDE5MjYsInNpZCI6Ijg0YjlkNmQzLTAxMTItNDBiZi05MTZiLWVlZDFkOGY3NjBhNSIsInQiOmZhbHNlLCJ1aWQiOjE5NjI0NzM2fQ.9rXa96vOM8BIH5HcHYMyUWqI7G3tbcrEgpiqmAI0GQQisRlEooezoKxi-zcem8JMmJtsrejJC4rybYCW-LaZ6g",
    },
  ]);
  const wbArticles = ref([]);
  const byProducts = ref([]);
  const filters = ref({
    dates: [
      dayjs().subtract(1, 'week').startOf('isoWeek'),
      dayjs().subtract(1, 'week').endOf('isoWeek')
    ],
    companies: [],
    categories: [],
    articles: []
  });

  const stats = computed(() => {
    let filteredProducts;

    if (filters.value.articles.length === 0) {
      const validIds = new Set(optionArticles.value.map(opt => opt.value));
      filteredProducts = byProducts.value.filter(product => validIds.has(product.nm_id));
    } else {
      const validIds = new Set(optionArticles.value.map(opt => opt.value));
      const matchingIds = filters.value.articles.filter(id => validIds.has(id));

      if (matchingIds.length > 0) {
        filteredProducts = byProducts.value.filter(product => matchingIds.includes(product.nm_id));
      } else {
        filteredProducts = byProducts.value.filter(product => filters.value.articles.includes(product.nm_id));
      }
    }

    return filteredProducts.reduce(
      (acc, product) => {
        acc.sales += product.sales; // Продажи (сумма)
        acc.salesCount += product.salesCount; // Продажи (количество)
        acc.compensation += product.compensation; // Компенсация (сумма)
        acc.compensationCount += product.compensationCount; // Компенсация (количество)
        acc.realisation += product.realisation; // Реализация
        acc.logistics += product.logistics; // Логистика
        acc.warehousePrice += product.warehousePrice; // Хранение
        acc.acceptanceReport += product.acceptanceReport; // Платная приёмка
        return acc;
      },
      {
        sales: 0,
        salesCount: 0,
        compensation: 0,
        compensationCount: 0,
        realisation: 0,
        logistics: 0,
        warehousePrice: 0,
        acceptanceReport: 0
      }
    );
  });

  const loading = ref(0);
  const loadingEnrichmentByProducts = ref(0);

  const optionCompanies = computed(() => {
    return companyArray.value.map(company => ({
      value: company.tradeMark,
      label: company.tradeMark
    }));
  });

  const optionCategories = computed(() => {
    const selectedArticles = filters.value.articles;

    return Array.from(
      new Map(wbArticles.value
        .filter(article => selectedArticles.length === 0 || selectedArticles.includes(article.nmID))
        .map(article => [article.category, {
          value: article.category,
          label: article.category
        }])).values()
    );
  });

  const optionArticles = computed(() => {
    const selectedCategories = filters.value.categories;

    return wbArticles.value
      .filter(article => selectedCategories.length === 0 || selectedCategories.includes(article.category))
      .map(article => ({
        value: article.nmID,
        label: article.vendorCode
      }));
  });

  watch(optionCategories, (newCategories) => {
    const availableCategories = newCategories.map(c => c.value);
    const updatedCategories = filters.value.categories.filter(c => availableCategories.includes(c));

    if (updatedCategories.length !== filters.value.categories.length) {
      nextTick(() => {
        filters.value.categories = updatedCategories;
      });
    }
  });

  watch(optionArticles, (newArticles) => {
    const availableArticles = newArticles.map(a => a.value);
    const updatedArticles = filters.value.articles.filter(a => availableArticles.includes(a));

    if (updatedArticles.length !== filters.value.articles.length) {
      nextTick(() => {
        filters.value.articles = updatedArticles;
      });
    }
  });

  // Добавление информации о КОМПАНИЯХ
  const enrichmentCompaniesInfo = async() => {
    loading.value += 1;
    for (const company of companyArray.value) {
      const data = await getSellerInfo({ apiToken: company.apiToken });
      if (data) {
        company.name = data.name;
        company.sid = data.sid;
        company.tradeMark = data.tradeMark;
      }
    }
    loading.value -= 1;
  };

  // Добавление информации об АРТИКУЛАХ
  const enrichmentWbArticles = async() => {
    loading.value += 1;
    for (const company of companyArray.value) {
      wbArticles.value = await getWbArticles({apiToken: company.apiToken});
    }
    loading.value -= 1;
  };

  // Добавление информации о ПРОДАЖАХ
  const addSaleByProducts = async() => {
    loadingEnrichmentByProducts.value += 1;
    byProducts.value = [];

    for (const company of companyArray.value) {
      try {
        const salesData = await getSales({
          apiToken: company.apiToken,
          dateFrom: dayjs(filters.value.dates[0]).format('YYYY-MM-DD'),
          dateTo: dayjs(filters.value.dates[1]).format('YYYY-MM-DD'),
        });

        byProducts.value = updateSalesByProducts(byProducts.value, salesData);
      } catch (error) {
        message.error("Ошибка при загрузки информации о продажах");
        console.error("addSaleByProducts", error);
      }
    }
    loadingEnrichmentByProducts.value -= 1;
  };

  // Добавление информации о ПЛАТНОМ ХРАНЕНИИ
  const enrichmentByProductsWithStorage = async() => {
    async function fetchDataInBatches({ apiToken, dateFrom, dateTo, limit }) {
      let currentDate = dayjs(dateFrom);
      const endDate = dayjs(dateTo);
      const loadingGetPaidStorage = message.loading("Загрузка отчёта о платном хранении", 0);

      while (currentDate.isBefore(endDate)) {
        const batchEndDate = currentDate.add(limit - 1, 'day').isAfter(endDate) ? endDate : currentDate.add(limit - 1, 'day');

        try {
          const taskIdPaidStorage = await createPaidStorage({
            apiToken: apiToken,
            dateFrom: currentDate.format('YYYY-MM-DD'),
            dateTo: batchEndDate.format('YYYY-MM-DD'),
          });

          const storageData = await getPaidStorage({
            apiToken: apiToken,
            task_id: taskIdPaidStorage
          });

          byProducts.value = updateByProductsWithStorage(byProducts.value, storageData);
        } catch (error) {
          loadingGetPaidStorage();
          console.error(error);
        }

        currentDate = currentDate.add(limit, 'day');

        // Добавляем задержку в 1 минуту между запросами
        if (currentDate.isBefore(endDate)) {
          await new Promise(resolve => setTimeout(resolve, 65000));
        }
      }

      loadingGetPaidStorage();
    }

    // Делим запросы и отправляем каждую минуту по 8 дней
    for (const company of companyArray.value) {
      await fetchDataInBatches({
        apiToken: company.apiToken,
        dateFrom: dayjs(filters.value.dates[0]).format('YYYY-MM-DD'),
        dateTo: dayjs(filters.value.dates[1]).format('YYYY-MM-DD'),
        limit: 8
      });
    }
  }

  const enrichmentByProductsWithAcceptanceReport = async() => {
    async function fetchDataInBatches({ apiToken, dateFrom, dateTo, limit }) {
      let currentDate = dayjs(dateFrom);
      const endDate = dayjs(dateTo);
      const loadingAcceptanceReport = message.loading("Загрузка отчёта о платной приёмке", 0);

      while (currentDate.isBefore(endDate)) {
        const batchEndDate = currentDate.add(limit - 1, 'day').isAfter(endDate) ? endDate : currentDate.add(limit - 1, 'day');

        try {
          const acceptanceReportData = await getAcceptanceReport({
            apiToken: apiToken,
            dateFrom: currentDate.format('YYYY-MM-DD'),
            dateTo: batchEndDate.format('YYYY-MM-DD'),
          });

          byProducts.value = updateByProductsWithAcceptanceReport(byProducts.value, acceptanceReportData.report);
        } catch (error) {
          loadingAcceptanceReport();
          console.error(error);
        }

        currentDate = currentDate.add(limit, 'day');

        // Добавляем задержку в 1 минуту между запросами
        if (currentDate.isBefore(endDate)) {
          await new Promise(resolve => setTimeout(resolve, 65000));
        }

        loadingAcceptanceReport();
      }
    }

    loadingEnrichmentByProducts.value += 1;
    for (const company of companyArray.value) {
      await fetchDataInBatches({
        apiToken: company.apiToken,
        dateFrom: dayjs(filters.value.dates[0]).format('YYYY-MM-DD'),
        dateTo: dayjs(filters.value.dates[1]).format('YYYY-MM-DD'),
        limit: 31
      });
    }
    loadingEnrichmentByProducts.value -= 1;
  }

  return {
    companyArray,
    wbArticles,
    byProducts,
    filters,
    stats,
    loading,
    loadingEnrichmentByProducts,
    optionCompanies,
    optionCategories,
    optionArticles,
    enrichmentCompaniesInfo,
    enrichmentWbArticles,
    addSaleByProducts,
    enrichmentByProductsWithStorage,
    enrichmentByProductsWithAcceptanceReport
  }
});
