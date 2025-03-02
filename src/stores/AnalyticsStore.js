import { defineStore } from "pinia";
import { computed, nextTick, ref, watch } from "vue";
import { message } from "ant-design-vue";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { getSellerInfo } from "../composible/getSellerInfo.js";
import { getWbArticles } from "../composible/getWbArticles.js";
import { getSales } from "../composible/getSales.js";
import { getOrders } from "../composible/getOrders.js";
import { createPaidStorage } from "../composible/createPaidStorage.js";
import { getPaidStorage } from "../composible/getPaidStorage.js";
import { updateSalesByProducts } from "../composible/updateSalesByProducts.js";
import { updateOrdersByProducts } from "../composible/updateOrdersByProducts.js";
import { updateByProductsWithStorage } from "../composible/updateByProductsWithStorage.js";
import { updateByProductsWithPromotion } from "../composible/updateByProductsWithPromotion.js";
import { getAcceptanceReport } from "../composible/getAcceptanceReport.js";
import { updateByProductsWithAcceptanceReport } from "../composible/updateByProductsWithAcceptanceReport.js";
import {getHistoryCosts} from "@/composible/getHistoryCosts.js";
import {getPromotion} from "@/composible/getPromotion.js";

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
    articles: [],
    tax: [],
    cost: [],
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

    const result = filteredProducts.reduce(
      (acc, product) => {
        acc.sales += product.sales; // Продажи (сумма)
        acc.salesCount += product.salesCount; // Продажи (количество)
        acc.compensation += product.compensation; // Компенсация (сумма)
        acc.compensationCount += product.compensationCount; // Компенсация (количество)
        acc.realisation += product.realisation; // Реализация
        acc.logistics += product.logistics; // Логистика
        acc.warehousePrice += product.warehousePrice; // Хранение
        acc.acceptanceSum += product.acceptanceSum; // Платная приёмка
        // acc.orders += product.orders; // Заказы (сумма)
        // acc.ordersCount += product.ordersCount; // Заказы (количество)
        acc.commission += product.commission; // Комиссия
        // acc.otherDeduction += product.otherDeduction;
        acc.tax += (product.sales / 100) * filters.value.tax.find(company => company.tradeMark === product.brand_name).value; // Налоги
        acc.advertisingExpense += product.advertisingExpense; // Реклама
        acc.drr += (product.advertisingExpense && product.realisation) ? ((product.advertisingExpense / product.realisation) * 100) : 0;
        acc.costOfSales += (product.salesCount * filters.value.cost.find(article => article.nmID === product.nm_id).value); // Себестоимость продаж
        acc.profit += // Чистая прибыль
          product.realisation - // Реализация
          product.logistics - // Логистика
          product.advertisingExpense - // Реклама
          (product.warehousePrice ? product.warehousePrice : 0) - // Хранение
          product.acceptanceSum - // Платная приёмка
          // Прочие расходы
          product.salesCount * filters.value.cost.find(article => article.nmID === product.nm_id).value - // Себестоимость продаж
          filters.value.tax.find(company => company.tradeMark === product.brand_name).value - // Налоги
          product.commission; // Комиссия
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
        acceptanceSum: 0,
        // orders: 0,
        // ordersCount: 0,
        commission: 0,
        // otherDeduction: 0,
        tax: 0,
        advertisingExpense: 0,
        drr: 0,
        costOfSales: 0,
        profit: 0,
      }
    );

    // После завершения reduce вычисляем DRR
    result.drr = (result.advertisingExpense && result.realisation)
      ? ((result.advertisingExpense / result.realisation) * 100)
      : 0;

    return result;
  });

  const loading = ref(0);
  const loadingEnrichmentByProducts = ref(0);
  const isEnrichmentWbArticlesDone = ref(false);

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

  const fillingTax = () => {
    companyArray.value.forEach(company => {
      filters.value.tax.push({
        tradeMark: company.tradeMark,
        value: 7,
      })
    })
  }

  const fillingCost = () => {
    filters.value.cost = []; // Очищаем массив перед заполнением
    wbArticles.value.forEach(article => {
      filters.value.cost.push({
        tradeMark: article.brand,
        nmID: article.nmID,
        vendorCode: article.vendorCode,
        value: 300,
      });
    });
  };

  // Добавление информации об АРТИКУЛАХ
  const enrichmentWbArticles = async() => {
    loading.value += 1;
    isEnrichmentWbArticlesDone.value = false;
    for (const company of companyArray.value) {
      wbArticles.value = await getWbArticles({apiToken: company.apiToken});
    }
    isEnrichmentWbArticlesDone.value = true;
    loading.value -= 1;
  };

  // Создание списка продуктов на основе артикулов
  const createByProducts = async () => {
    if (!isEnrichmentWbArticlesDone.value) {
      await enrichmentWbArticles();
    }

    byProducts.value = [];

    byProducts.value = wbArticles.value.map(article => ({
      brand_name: article.brand,
      subject_name: article.category,
      nm_id: article.nmID,

      // Поля, которые будут заполняться позже
      logistics: 0,
      sales: 0,
      realisation: 0,
      salesCount: 0,
      commission: 0,
      compensation: 0,
      compensationCount: 0,
      advertisingExpense: 0,
    }));

    // console.log("byProducts", byProducts.value);
  }

  // Добавление информации о ПРОДАЖАХ
  const addSalesByProducts = async() => {
    loadingEnrichmentByProducts.value += 1;

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
        console.error("addSalesByProducts", error);
      }
    }
    loadingEnrichmentByProducts.value -= 1;
  };

  // Добавление информации о ЗАКАЗАХ
  // const addOrdersByProducts = async() => {
  //   loadingEnrichmentByProducts.value += 1;
  //
  //   for (const company of companyArray.value) {
  //     try {
  //       const ordersData = await getOrders({
  //         apiToken: company.apiToken,
  //         dateFrom: dayjs(filters.value.dates[0]).format('YYYY-MM-DD'),
  //       });
  //
  //       byProducts.value = updateOrdersByProducts({
  //         byProducts: byProducts.value,
  //         data: ordersData,
  //         dateTo: dayjs(filters.value.dates[1]).format('YYYY-MM-DD')
  //       });
  //     } catch (error) {
  //       message.error("Ошибка при загрузки информации о продажах");
  //       console.error("addOrdersByProducts", error);
  //     }
  //   }
  //   loadingEnrichmentByProducts.value -= 1;
  // };

  // Добавление информации о ПЛАТНОМ ХРАНЕНИИ
  const enrichmentByProductsWithStorage = async() => {
    async function fetchDataInBatches({ apiToken, dateFrom, dateTo, limit }) {
      let currentDate = dayjs(dateFrom);
      const endDate = dayjs(dateTo);
      const loadingGetPaidStorage = message.loading("Загрузка отчёта о платном хранении", 0);

      while (currentDate.isBefore(endDate) || currentDate.isSame(endDate)) {
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
        if (currentDate.isBefore(endDate) || currentDate.isSame(endDate)) {
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

      // await new Promise(resolve => setTimeout(resolve, 65000));
    }
  }

  const enrichmentByProductsWithAcceptanceReport = async() => {
    async function fetchDataInBatches({ apiToken, dateFrom, dateTo, limit }) {
      let currentDate = dayjs(dateFrom);
      const endDate = dayjs(dateTo);
      // const loadingAcceptanceReport = message.loading("Загрузка отчёта о платной приёмке", 0);

      while (currentDate.isBefore(endDate) || currentDate.isSame(endDate)) {
        const batchEndDate = currentDate.add(limit - 1, 'day').isAfter(endDate) ? endDate : currentDate.add(limit - 1, 'day');

        try {
          const acceptanceReportData = await getAcceptanceReport({
            apiToken: apiToken,
            dateFrom: currentDate.format('YYYY-MM-DD'),
            dateTo: batchEndDate.format('YYYY-MM-DD'),
          });

          byProducts.value = updateByProductsWithAcceptanceReport(byProducts.value, acceptanceReportData.report);
        } catch (error) {
          // loadingAcceptanceReport();
          console.error(error);
        }

        currentDate = currentDate.add(limit, 'day');

        // Добавляем задержку в 1 минуту между запросами
        if (currentDate.isBefore(endDate) || currentDate.isSame(endDate)) {
          await new Promise(resolve => setTimeout(resolve, 65000));
        }

        // loadingAcceptanceReport();
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

      // await new Promise(resolve => setTimeout(resolve, 65000));
    }
    loadingEnrichmentByProducts.value -= 1;
  }

  const enrichmentByProductsWithPromotion = async() => {
    const promotion = ref([]);

    async function fetchDataInBatchesHistory({ apiToken, dateFrom, dateTo, limit }) {
      let currentDate = dayjs(dateFrom);
      const endDate = dayjs(dateTo);

      while (currentDate.isBefore(endDate) || currentDate.isSame(endDate)) {
        const batchEndDate = currentDate.add(limit - 1, 'day').isAfter(endDate) ? endDate : currentDate.add(limit - 1, 'day');

        try {
          const historyCostData = await getHistoryCosts({
            apiToken: apiToken,
            dateFrom: currentDate.format('YYYY-MM-DD'),
            dateTo: batchEndDate.format('YYYY-MM-DD'),
          });

          const newData = historyCostData
            .filter(advert => advert.paymentType === "Баланс" || advert.paymentType === "Счет")
            .map(advert => ({
            advertId: advert.advertId,
            updSum: advert.updSum,
          }));

          promotion.value.push(...newData);

          // byProducts.value = updateByProductsWithAcceptanceReport(byProducts.value, acceptanceReportData.report);
        } catch (error) {
          console.error(error);
        }

        currentDate = currentDate.add(limit, 'day');

        // Добавляем задержку в 2,5 секунды между запросами
        if (currentDate.isBefore(endDate) || currentDate.isSame(endDate)) {
          await new Promise(resolve => setTimeout(resolve, 2500));
        }
      }
    }

    async function fetchDataPromotion({ apiToken, adverts }) {
      function splitArray(inputArray, chunkSize) {
        const resultArrays = [];
        for (let i = 0; i < inputArray.length; i += chunkSize) {
          resultArrays.push(inputArray.slice(i, i + chunkSize));
        }
        return resultArrays;
      }

      const chunkedArray = splitArray(adverts, 50);

      let data = [];
      for (const item of chunkedArray) {
        const dataPromotion = await getPromotion({ apiToken: apiToken, adverts: item });
        data.push(...dataPromotion);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      function getProducts(object) {
        // console.log("object", object);

        if (object.type === 8) {
          return object.autoParams?.nms[0];
        } else if (object.type === 9) {
          return object.unitedParams[0]?.nms[0];
        }
        // return null;
      }

      return data.map(item => ({
        advertId: item.advertId,
        nmId: getProducts(item),
      }));
    }

    loadingEnrichmentByProducts.value += 1;
    for (const company of companyArray.value) {
      await fetchDataInBatchesHistory({
        apiToken: company.apiToken,
        dateFrom: dayjs(filters.value.dates[0]).format('YYYY-MM-DD'),
        dateTo: dayjs(filters.value.dates[1]).format('YYYY-MM-DD'),
        limit: 31
      });
    }

    const adverts = promotion.value.map(advert => advert.advertId);
    let dataAdvertsNmId = [];
    for (const company of companyArray.value) {
      dataAdvertsNmId = await fetchDataPromotion({ apiToken: company.apiToken, adverts });
    }

    // function aggregateUpdSum(data1, data2) {
    //   // Шаг 1: Суммируем updSum по advertId
    //   const advertSumMap = new Map();
    //
    //   data1.forEach(({ advertId, updSum }) => {
    //     // console.log(`${ advertId } - ${ updSum }`);
    //
    //     advertSumMap.set(advertId, (advertSumMap.get(advertId) || 0) + updSum);
    //   });
    //
    //   console.log("advertSumMap", advertSumMap);
    //
    //   // Шаг 2: Сопоставляем advertId с nmId и суммируем по nmId
    //   const nmSumMap = new Map();
    //
    //   data2.forEach(({ advertId, nmId }) => {
    //     if (advertSumMap.has(advertId)) {
    //       const sumToAdd = advertSumMap.get(advertId);
    //       console.log(`nmId: ${nmId}, advertId: ${advertId}, adding: ${sumToAdd}`);
    //
    //       nmSumMap.set(nmId, (nmSumMap.get(nmId) || 0) + sumToAdd);
    //     }
    //   });
    //
    //   console.log("nmSumMap", nmSumMap);
    //
    //   // Шаг 3: Преобразуем Map обратно в массив объектов
    //   return Array.from(nmSumMap, ([nmId, updSum]) => ({ nmId, updSum }));
    // }

    function aggregateUpdSum(data1, data2) {
      // Шаг 1: Суммируем updSum по advertId
      const advertSumMap = new Map();

      data1.forEach(({ advertId, updSum }) => {
        advertSumMap.set(advertId, (advertSumMap.get(advertId) || 0) + updSum);
      });

      // console.log("advertSumMap", advertSumMap);

      // Шаг 2: Сопоставляем advertId с nmId, избегая повторных сложений
      const nmSumMap = new Map();
      const processedPairs = new Set(); // Храним уже обработанные пары nmId-advertId

      data2.forEach(({ advertId, nmId }) => {
        const pairKey = `${nmId}-${advertId}`; // Уникальный ключ

        if (advertSumMap.has(advertId) && !processedPairs.has(pairKey)) {
          processedPairs.add(pairKey); // Запоминаем, что уже обработали эту пару
          nmSumMap.set(nmId, (nmSumMap.get(nmId) || 0) + advertSumMap.get(advertId));
        }
      });

      // console.log("nmSumMap", nmSumMap);

      // Шаг 3: Преобразуем Map обратно в массив объектов
      return Array.from(nmSumMap, ([nmId, updSum]) => ({ nmId, updSum }));
    }

    const result = aggregateUpdSum(promotion.value, dataAdvertsNmId);

    // // Шаг 1: Суммируем updSum по advertId
    // const advertSum = promotion.value.reduce((acc, item) => {
    //   if (!acc[item.advertId]) {
    //     acc[item.advertId] = 0;
    //   }
    //   acc[item.advertId] += item.updSum;
    //   return acc;
    // }, {});
    //
    // console.log("advertSum", advertSum);
    //
    // // Шаг 2: Группируем по nmId и суммируем updSum
    // const nmIdSum = dataAdvertsNmId.reduce((acc, item) => {
    //   if (!acc[item.nmId]) {
    //     acc[item.nmId] = 0;
    //   }
    //   acc[item.nmId] += advertSum[item.advertId] || 0;
    //   return acc;
    // }, {});
    //
    // // Шаг 3: Преобразуем результат в массив объектов
    // const result = Object.keys(nmIdSum).map(nmId => ({
    //   nmId: parseInt(nmId, 10),
    //   updSum: nmIdSum[nmId]
    // }));

    byProducts.value = updateByProductsWithPromotion(byProducts.value, result);

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
    fillingTax,
    fillingCost,
    enrichmentWbArticles,
    createByProducts,
    addSalesByProducts,
    // addOrdersByProducts,
    enrichmentByProductsWithStorage,
    enrichmentByProductsWithAcceptanceReport,
    enrichmentByProductsWithPromotion,
  }
});
