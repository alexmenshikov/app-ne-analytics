import { defineStore } from "pinia";
import { computed, nextTick, ref, watch } from "vue";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { getSellerInfo } from "../composible/getSellerInfo.js";
import { getWbArticles } from "../composible/getWbArticles.js";
import { getSalesReport } from "../composible/getSalesReport.js";
import { createPaidStorage } from "../composible/createPaidStorage.js";
import { getPaidStorage } from "../composible/getPaidStorage.js";
import { enrichByProductsPaidStorage } from "../composible/enrichByProductsPaidStorage.js";
import { updateByProductsWithSales } from "../composible/updateByProductsWithSales.js";
import { updateByProductsWithStorage } from "../composible/updateByProductsWithStorage.js";

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
        acc.retail_amount += product.retail_amount;
        acc.ppvz_for_pay += product.ppvz_for_pay;
        acc.quantitySale += product.quantitySale;
        acc.quantityCompensation += product.quantityCompensation;
        acc.retail_price += product.retail_price;
        acc.delivery_rub += product.delivery_rub;
        acc.warehousePrice += product.warehousePrice;
        return acc;
      },
      { retail_amount: 0, ppvz_for_pay: 0, quantitySale: 0, quantityCompensation: 0, retail_price: 0, delivery_rub: 0, warehousePrice: 0 }
    );
  });

  const loading = ref(0);
  const loadingEnrichmentByProducts = ref(false);

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

  const enrichmentWbArticles = async() => {
    loading.value += 1;
    for (const company of companyArray.value) {
      wbArticles.value = await getWbArticles({apiToken: company.apiToken});
    }
    loading.value -= 1;
  };

  const enrichmentByProducts = async() => {
    loadingEnrichmentByProducts.value = true;
    byProducts.value = [];

    for (const company of companyArray.value) {
      try {
        const salesData = await getSalesReport({
          apiToken: company.apiToken,
          dateFrom: dayjs(filters.value.dates[0]).format('YYYY-MM-DD'),
          dateTo: dayjs(filters.value.dates[1]).format('YYYY-MM-DD'),
        });

        byProducts.value = updateByProductsWithSales(byProducts.value, salesData);
      } catch (error) {
        console.error(error);
      }
    }
    loadingEnrichmentByProducts.value = false;
  };

  const enrichmentByProductsWithStorage = async() => {
    for (const company of companyArray.value) {
      try {
        const taskIdPaidStorage = await createPaidStorage({
          apiToken: company.apiToken,
          dateFrom: dayjs(filters.value.dates[0]).format('YYYY-MM-DD'),
          dateTo: dayjs(filters.value.dates[1]).format('YYYY-MM-DD'),
        });

        const storageData = await getPaidStorage({
          apiToken: company.apiToken,
          task_id: taskIdPaidStorage
        });

        byProducts.value = updateByProductsWithStorage(byProducts.value, storageData);
      } catch (error) {
        console.error(error);
      }
    }
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
    enrichmentByProducts,
    enrichmentByProductsWithStorage,
  }
});

// export const useAnalyticsStore = defineStore("AnalyticsStore", {
//   state: () => ({
//     companyArray: [
//       {
//         id: 1,
//         apiToken: "eyJhbGciOiJFUzI1NiIsImtpZCI6IjIwMjUwMTIwdjEiLCJ0eXAiOiJKV1QifQ.eyJlbnQiOjEsImV4cCI6MTc1MzgyNTE3NiwiaWQiOiIwMTk0YWM0Ny1kNWI3LTdjYzItYTRmZC1hYzgwNzI4ZjU3YTAiLCJpaWQiOjE5NjI0NzM2LCJvaWQiOjQxMjc0NjcsInMiOjEwNzM3NDE5MjYsInNpZCI6Ijg0YjlkNmQzLTAxMTItNDBiZi05MTZiLWVlZDFkOGY3NjBhNSIsInQiOmZhbHNlLCJ1aWQiOjE5NjI0NzM2fQ.9rXa96vOM8BIH5HcHYMyUWqI7G3tbcrEgpiqmAI0GQQisRlEooezoKxi-zcem8JMmJtsrejJC4rybYCW-LaZ6g",
//       },
//     ],
//     wbArticles: [],
//     byProducts: [],
//     filters: {
//       dates: [
//         dayjs().startOf('isoWeek'),
//         dayjs()
//       ],
//       company: [],
//       arcicles: [],
//       categories: []
//     },
//     stats: {
//       sales: 0, // продажи (сумма)
//       totalSales: 0, // продажи (количество)
//     },
//     loading: 0,
//   }),
//   getters: {
//
//   },
//   actions: {
//     async enrichmentCompaniesInfo() {
//       // this.loading += 1;
//       for (const company of this.companyArray) {
//         const data = await getSellerInfo({ apiToken: company.apiToken });
//         if (data) {
//           company.name = data.name;
//           company.sid = data.sid;
//           company.tradeMark = data.tradeMark;
//         }
//       }
//       // this.loading -= 1;
//     },
//
//     async enrichmentWbArticles() {
//       // this.loader += 1;
//       for (const company of this.companyArray) {
//         this.wbArticles = await getWbArticles({apiToken: company.apiToken});
//       }
//       // this.loading -= 1;
//     },
//
//     async enrichmentByProducts() {
//       // this.loader += 1;
//       for (const company of this.companyArray) {
//         this.byProducts = await getSales({
//           apiToken: company.apiToken,
//           dateFrom: dayjs(this.filters.dates[0]).format('YYYY-MM-DD'),
//           dateTo: dayjs(this.filters.dates[1]).format('YYYY-MM-DD'),
//         });
//       }
//       // this.loading -= 1;
//     },
//
//     setDate(values) {
//       this.filters.dates = values;
//     }
//   }
//
//   // Доступные категории на основе выбранного артикула
//   // const filteredCategories = computed(() => {
//   //   if (state.filters.selectedVendorCode) {
//   //     return [...new Set(state.wbArticles
//   //       .filter(item => item.vendorCode === state.filters.selectedVendorCode)
//   //       .map(item => item.subjectName))];
//   //   }
//   //   return [...new Set(state.wbArticles.map(item => item.subjectName))];
//   // });
//
//   // // Доступные артикулы на основе выбранной категории
//   // const filteredVendorCodes = computed(() => {
//   //   if (state.filters.selectedCategory) {
//   //     return state.wbArticles
//   //       .filter(item => item.subjectName === state.filters.selectedCategory)
//   //       .map(item => item.vendorCode);
//   //   }
//   //   return state.wbArticles.map(item => item.vendorCode);
//   // });
//   //
//   // // Аналитика на основе фильтров
//   // const analytics = computed(() => {
//   //   const filteredItems = state.wbArticles.filter(item =>
//   //     (!state.filters.selectedCategory || item.subjectName === state.filters.selectedCategory) &&
//   //     (!state.filters.selectedVendorCode || item.vendorCode === state.filters.selectedVendorCode)
//   //   );
//   //
//   //   return {
//   //     totalItems: filteredItems.length,
//   //     brands: [...new Set(filteredItems.map(item => item.brand))],
//   //     // Добавь свои расчёты
//   //   };
//   // });
//
//   // return {
//   //   state,
//   //   filteredCategories,
//   //   filteredVendorCodes,
//   //   analytics
//   // };
// });