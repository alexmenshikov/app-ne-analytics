import { defineStore } from "pinia";
import dayjs from "dayjs";
import isoWeek from 'dayjs/plugin/isoWeek';
import { getSellerInfo } from "../composible/getSellerInfo.js";
import { getWbArticles } from "../composible/getWbArticles.js";
import { getSales } from "../composible/getSales.js";
import { ref, computed } from "vue";

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
      dayjs().startOf('isoWeek'),
      dayjs()
    ],
    companies: [],
    categories: [],
    articles: []
  });
  const stats = ref({
    sales: 0, // продажи (сумма)
    totalSales: 0, // продажи (количество)
  });
  const loading = ref(0);

  const optionCompanies = computed(() => {
    return companyArray.value.map(company => ({
      value: company.tradeMark,
      label: company.tradeMark
    }));
  });

  const optionCategories = computed(() => {
    return Array.from(
      new Map(wbArticles.value.map(card => [card.category, {
        value: card.category,
        label: card.category
      }])).values()
    );
  });

  const optionArticles = computed(() => {
    if (filters.value.categories.length !== 0) {
      return wbArticles.value.filter(article => {
        return filters.value.categories.find(category => {
          return article.category === category;
        })
      }).map(article => ({
        value: article.nmID,
        label: article.vendorCode
      }));
    } else {
      return wbArticles.value.map((article) => ({
        value: article.nmID,
        label: article.vendorCode
      }));
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
    for (const company of companyArray.value) {
      byProducts.value = await getSales({
        apiToken: company.apiToken,
        dateFrom: dayjs(filters.value.dates[0]).format('YYYY-MM-DD'),
        dateTo: dayjs(filters.value.dates[1]).format('YYYY-MM-DD'),
      });
    }
  };

  return {
    companyArray,
    wbArticles,
    byProducts,
    filters,
    stats,
    loading,
    optionCompanies,
    optionCategories,
    optionArticles,
    enrichmentCompaniesInfo,
    enrichmentWbArticles,
    enrichmentByProducts,
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