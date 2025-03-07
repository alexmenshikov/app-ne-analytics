import {defineStore} from "pinia";
import {computed, nextTick, ref, watch, watchEffect} from "vue";
import {message} from "ant-design-vue";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import {getSellerInfo} from "../composible/getSellerInfo.js";
import {getWbArticles} from "../composible/getWbArticles.js";
import {getSales} from "../composible/getSales.js";
import {getOrders} from "../composible/getOrders.js";
import {createPaidStorage} from "../composible/createPaidStorage.js";
import {getPaidStorage} from "../composible/getPaidStorage.js";
import {updateSalesByProducts} from "../composible/updateSalesByProducts.js";
import {updateOrdersByProducts} from "../composible/updateOrdersByProducts.js";
import {updateByProductsWithStorage} from "../composible/updateByProductsWithStorage.js";
import {updateByProductsWithPromotion} from "../composible/updateByProductsWithPromotion.js";
import {getAcceptanceReport} from "../composible/getAcceptanceReport.js";
import {updateByProductsWithAcceptanceReport} from "../composible/updateByProductsWithAcceptanceReport.js";
import {getHistoryCosts} from "@/composible/getHistoryCosts.js";
import {getPromotion} from "@/composible/getPromotion.js";

import wildberriesLogo from "@/assets/icons/wildberries.svg";
import ozonLogo from "@/assets/icons/ozon.svg";
import yaMarketLogo from "@/assets/icons/ya_market.svg";

dayjs.extend(isoWeek);

export const useAnalyticsStore = defineStore("AnalyticsStore", () => {
  const marketplaces = [
    {
      id: 0,
      label: "Wildberries",
      value: "wildberries",
      logo: wildberriesLogo,
    },
    {
      id: 1,
      label: "Ozon",
      value: "ozon",
      logo: ozonLogo,
    },
    {
      id: 2,
      label: "Яндекс Маркет",
      value: "ya_market",
      logo: yaMarketLogo,
    }
  ];
  const accessMethods = [
    {
      id: 0,
      label: "Аналитика",
      value: "analytics",
    },
    {
      id: 1,
      label: "Вопросы и отзывы",
      value: "questions_and_reviews",
    }
  ];
  const companyArray = ref([]);
  const wbArticles = ref([]);
  const byProducts = ref([]);
  const filters = ref({
    dates: [
      dayjs().subtract(1, 'week').startOf('isoWeek'),
      dayjs().subtract(1, 'week').endOf('isoWeek')
    ],
    companies: [],
    brands: [],
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
        acc.logisticsCount += product.logisticsCount // Количество доставок
        acc.warehousePrice += product.warehousePrice; // Хранение
        acc.acceptanceSum += product.acceptanceSum; // Платная приёмка
        acc.orders += product.orders; // Заказы (сумма)
        acc.ordersCount += product.ordersCount; // Заказы (количество)
        acc.commission += product.commission; // Комиссия
        acc.otherDeduction += product.otherDeduction;

        const taxEntry = filters.value.tax?.find(company => company.name === product.company);

        const tax = (product.sales / 100) * (taxEntry ? taxEntry.value : 0)
        acc.tax += tax; // Налоги

        acc.advertisingExpense += product.advertisingExpense; // Реклама
        acc.drr += (product.advertisingExpense && product.realisation)
          ? ((product.advertisingExpense / product.realisation) * 100)
          : 0;

        const costEntry = filters.value.cost?.find(article => article.nmID === product.nm_id);
        const costOfSales = product.salesCount * (costEntry ? costEntry.value : 0);
        acc.costOfSales += costOfSales; // Себестоимость продаж

        const costOfGoodsCompensation = product.compensationCount > 0 ? (product.compensationCount * (costEntry ? costEntry.value : 0)) : 0;

        const profit =
          product.sales - // Продажи
          product.logistics - // Логистика
          product.advertisingExpense - // Реклама
          (product.warehousePrice ? product.warehousePrice : 0) - // Хранение
          product.acceptanceSum - // Платная приёмка
          product.otherDeduction - // Прочие удержания
          costOfSales - // Себестоимость продаж
          tax - // Налоги
          product.commission + // Комиссия
          (product.compensation - costOfGoodsCompensation); // Компенсация

        acc.profit += profit // Чистая прибыль
        return acc;
      },
      {
        sales: 0,
        salesCount: 0,
        compensation: 0,
        compensationCount: 0,
        realisation: 0,
        logistics: 0,
        logisticsCount: 0,
        warehousePrice: 0,
        acceptanceSum: 0,
        orders: 0,
        ordersCount: 0,
        commission: 0,
        otherDeduction: 0,
        tax: 0,
        advertisingExpense: 0,
        drr: 0,
        costOfSales: 0,
        profit: 0,
        marginality: 0,
        roi: 0,
        averageRedemption: 0,
        averagePriceBeforeSPP: 0,
      }
    );

    // После завершения reduce вычисляем DRR
    result.drr = (result.advertisingExpense && result.realisation)
      ? ((result.advertisingExpense / result.realisation) * 100)
      : 0;

    result.marginality = (result.profit / result.realisation)
      ? ((result.profit / result.realisation) * 100)
      : 0;

    result.roi = (result.profit / result.costOfSales)
      ? ((result.profit / result.costOfSales) * 100)
      : 0;

    result.averageRedemption = (result.salesCount / result.logisticsCount)
      ? ((result.salesCount / result.logisticsCount) * 100)
      : 0;

    // Средняя цена до СПП
    result.averagePriceBeforeSPP += (result.realisation / result.salesCount)
      ? (result.realisation / result.salesCount)
      : 0;

    return result;
  });

  const loading = ref(0);
  const loadingEnrichmentByProducts = ref(0);
  const isEnrichmentWbArticlesDone = ref(false);
  const initialized = ref(false);
  let isFirstLoad = true; // Флаг для защиты от двойного вызова

  const optionCompanies = computed(() => {
    const selectedBrands = filters.value.brands;
    const selectedArticles = filters.value.articles;

    return Array.from(
      new Map(wbArticles.value
        .filter(article =>
          (selectedBrands.length === 0 || selectedBrands.includes(article.brand)) &&
          (selectedArticles.length === 0 || selectedArticles.includes(article.nmID))
        )
        .map(article => {
          // Находим объект компании в companyArray по article.company (сравниваем с name)
          const companyObj = companyArray.value.find(c => c.name === article.company);
          return companyObj ? [companyObj.name, { value: companyObj.name, label: companyObj.name }] : null;
        })
        .filter(Boolean) // Убираем null, если компания не найдена
      ).values()
    );
  });

  const optionBrand = computed(() => {
    const selectedCompanies = filters.value.companies;
    const selectedArticles = filters.value.articles;

    return Array.from(
      new Map(wbArticles.value
        .filter(article =>
          (selectedCompanies.length === 0 || selectedCompanies.includes(article.company)) &&
          (selectedArticles.length === 0 || selectedArticles.includes(article.nmID))
        )
        .map(article => [article.brand, {
          value: article.brand,
          label: article.brand
        }])
      ).values()
    );
  });

  const optionCategories = computed(() => {
    const selectedArticles = filters.value.articles;
    const selectedCompanies = filters.value.companies;
    const selectedBrands = filters.value.brands;

    return Array.from(
      new Map(wbArticles.value
        .filter(article =>
          (selectedCompanies.length === 0 || selectedCompanies.includes(article.company)) &&
          (selectedBrands.length === 0 || selectedBrands.includes(article.brand)) &&
          (selectedArticles.length === 0 || selectedArticles.includes(article.nmID))
        )
        .map(article => [article.category, {
          value: article.category,
          label: article.category
        }])
      ).values()
    );
  });

  const optionArticles = computed(() => {
    const selectedCategories = filters.value.categories;
    const selectedCompanies = filters.value.companies;
    const selectedBrands = filters.value.brands;

    return wbArticles.value
      .filter(article =>
        (selectedCategories.length === 0 || selectedCategories.includes(article.category)) &&
        (selectedCompanies.length === 0 || selectedCompanies.includes(article.company)) &&
        (selectedBrands.length === 0 || selectedBrands.includes(article.brand))
      )
      .map(article => ({
        value: article.nmID,
        label: article.vendorCode
      }));
  });

  const getCompaniesInfo = async (array) => {
    const promises = array.map(company =>
      getSellerInfo({ apiToken: company.apiToken })
        .then(data => {
          if (data) {
            company.name = data.name;
            company.sid = data.sid;
          }
          return company; // Возвращаем обновлённую компанию
        })
    );

    return await Promise.all(promises); // Возвращаем массив обновлённых компаний
  };

  // Функция для обогащения информации о компаниях
  const enrichmentCompaniesInfo = async () => {
    loading.value += 1;
    try {
      await getCompaniesInfo(companyArray.value);
    } catch (error) {
      console.error("Ошибка в enrichmentCompaniesInfo:", error);
    } finally {
      loading.value -= 1;
    }
  };

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

  // Следим за изменениями companyArray
  watch(() => companyArray.value.length,
    async (newLength, oldLength) => {
      if (isFirstLoad) {
        isFirstLoad = false; // Игнорируем первый вызов при загрузке
        return;
      }

      localStorage.setItem("companyArray", JSON.stringify(companyArray.value));

      if (newLength > oldLength) {
        await enrichmentCompaniesInfo();
        await enrichmentWbArticles();
        await createByProducts();
        await addSalesByProducts();
        await addOrdersByProducts();
        await enrichmentByProductsWithAcceptanceReport();
        await enrichmentByProductsWithPromotion();
      } else if (newLength < oldLength) {
        await enrichmentWbArticles();
        await createByProducts();
        await addSalesByProducts();
        await addOrdersByProducts();
        await enrichmentByProductsWithAcceptanceReport();
        await enrichmentByProductsWithPromotion();
      }
    }
  );

  // watch(filters.value.cost, (newFilters) => {
  //   localStorage.setItem("filtersCost", JSON.stringify(newFilters));
  // });
  //
  // watch(filters.value.tax, (newFilters) => {
  //   localStorage.setItem("filtersTax", JSON.stringify(newFilters));
  // });

  watchEffect(() => {
    if (filters.value.cost !== null && filters.value.tax !== null) {
      localStorage.setItem("filtersCost", JSON.stringify(filters.value.cost));
      localStorage.setItem("filtersTax", JSON.stringify(filters.value.tax));
    }
  });
  // watch(
  //   () => [filters.value.cost, filters.value.tax],
  //   ([newCost, newTax]) => {
  //     if (newCost?.length) {
  //       localStorage.setItem("filtersCost", JSON.stringify(newCost));
  //     }
  //     if (newTax?.length) {
  //       localStorage.setItem("filtersTax", JSON.stringify(newTax));
  //     }
  //   },
  //   { deep: true }
  // );

  // Формирование списка для страницы с НАЛОГ
  const fillingTax = () => {
    const storageTax = JSON.parse(localStorage.getItem("filtersTax")) || [];

    companyArray.value.forEach(company => {
      let existElement = storageTax.find(item =>
        item.id === company.id && item.name === company.name
      );

      filters.value.tax.push({
        id: company.id,
        name: company.name,
        value: existElement?.value || 0,
      })
    })
  }

  const fillingCost = () => {
    const storageCost = JSON.parse(localStorage.getItem("filtersCost")) || [];

    wbArticles.value.forEach(article => {
      let existElement = storageCost.find(item =>
        item.nmID === article.nmID && item.vendorCode === article.vendorCode
      );

      filters.value.cost.push({
        tradeMark: article.brand,
        nmID: article.nmID,
        vendorCode: article.vendorCode,
        value: existElement?.value || 0,
      });
    });
  };

  // Добавление информации об АРТИКУЛАХ
  // const enrichmentWbArticles = async() => {
  //   loading.value += 1;
  //   isEnrichmentWbArticlesDone.value = false;
  //   for (const company of companyArray.value) {
  //     wbArticles.value = await getWbArticles({apiToken: company.apiToken});
  //   }
  //   isEnrichmentWbArticlesDone.value = true;
  //   loading.value -= 1;
  // };

  const getCompaniesArticle = async (array) => {
    const promises = array.map(company =>
      getWbArticles({ apiToken: company.apiToken, company: company.name })
        .then(data => {
          return data;
        })
    );

    const result = await Promise.all(promises); // Возвращаем массив артикулов
    return result.flat();
  };

  const enrichmentWbArticles = async () => {
    loading.value += 1;
    try {
      wbArticles.value = await getCompaniesArticle(companyArray.value);
    } catch (error) {
      console.error("Ошибка в enrichmentWbArticles:", error);
    } finally {
      loading.value -= 1;
    }
  };

  const initCompanyArray = (array) => {
    companyArray.value = array || [];
  };

  const addCompany = ({ marketplace, company, accessMethod, apiToken }) => {
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2); // Генерация уникального ID

    companyArray.value.push({
      id,
      marketplace: {
        ...marketplace,
        logo: marketplaces.find(item => item.value === marketplace.value).logo,
      },
      company,
      accessMethod,
      apiToken,
    })
  };

  const editCompany = (company) => {
    // companyArray.value = companyArray.value.filter(company => company.id !== id);
  };

  const removeCompany = (id) => {
    companyArray.value = companyArray.value.filter(company => company.id !== id);
  };

  // Создание списка продуктов на основе артикулов
  const createByProducts = async () => {
    // if (!isEnrichmentWbArticlesDone.value) {
    //   await enrichmentWbArticles();
    // }

    byProducts.value = [];

    byProducts.value = wbArticles.value.map(article => ({
      brand_name: article.brand,
      subject_name: article.category,
      nm_id: article.nmID,
      company: article.company,
      // Поля, которые будут заполняться позже
      logistics: 0,
      logisticsCount: 0,
      sales: 0,
      realisation: 0,
      salesCount: 0,
      commission: 0,
      compensation: 0,
      compensationCount: 0,
      advertisingExpense: 0,
      otherDeduction: 0,
      orders: 0,
      ordersCount: 0,
    }));
  }

  // Добавление информации о ПРОДАЖАХ
  // const addSalesByProducts = async() => {
  //   loadingEnrichmentByProducts.value += 1;
  //
  //   for (const company of companyArray.value) {
  //     try {
  //       const salesData = await getSales({
  //         apiToken: company.apiToken,
  //         dateFrom: dayjs(filters.value.dates[0]).format('YYYY-MM-DD'),
  //         dateTo: dayjs(filters.value.dates[1]).format('YYYY-MM-DD'),
  //       });
  //
  //       byProducts.value = updateSalesByProducts(byProducts.value, salesData);
  //
  //     } catch (error) {
  //       message.error("Ошибка при загрузки информации о продажах");
  //       console.error("addSalesByProducts", error);
  //     }
  //   }
  //   loadingEnrichmentByProducts.value -= 1;
  // };

  const getSalesByProduct = async (array) => {
    const promises = array.map(company =>
      getSales({
        apiToken: company.apiToken,
        dateFrom: dayjs(filters.value.dates[0]).format('YYYY-MM-DD'),
        dateTo: dayjs(filters.value.dates[1]).format('YYYY-MM-DD'),
      })
        .then(data => {
          return data;
        })
    )

    const result = await Promise.all(promises);
    return result.flat();
  };

  const addSalesByProducts = async () => {
    loadingEnrichmentByProducts.value += 1;
    try {
      byProducts.value = updateSalesByProducts(byProducts.value, await getSalesByProduct(companyArray.value));
    } catch (error) {
      console.error("Ошибка в addSalesByProducts:", error);
    } finally {
      loadingEnrichmentByProducts.value -= 1;
    }
  };

  const getOrdersByProducts = async (array) => {
    const promises = array.map(company =>
      getOrders({
        apiToken: company.apiToken,
        dateFrom: dayjs(filters.value.dates[0]).format('YYYY-MM-DD'),
      })
        .then(data => {
          return data;
        })
    )

    const result = await Promise.all(promises);
    return result.flat();
  };

  const addOrdersByProducts = async () => {
    loadingEnrichmentByProducts.value += 1;
    try {
      byProducts.value = updateOrdersByProducts({
        byProducts: byProducts.value,
        data: await getOrdersByProducts(companyArray.value),
        dateFrom: dayjs(filters.value.dates[0]).format('YYYY-MM-DD'),
        dateTo: dayjs(filters.value.dates[1]).format('YYYY-MM-DD')
      })
    } catch (error) {
      console.error("Ошибка в addOrdersByProducts:", error);
    } finally {
      loadingEnrichmentByProducts.value -= 1;
    }
  }
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
  //         dateFrom: dayjs(filters.value.dates[0]).format('YYYY-MM-DD'),
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
  const fetchDataInBatchesPaid = async ({ apiToken, dateFrom, dateTo, limit }) => {
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

      if (currentDate.isBefore(endDate) || currentDate.isSame(endDate)) {
        await new Promise(resolve => setTimeout(resolve, 65000));
      }
    }

    loadingGetPaidStorage();
  };

  const getCompaniesStorageData = async (array, dateFrom, dateTo, limit) => {
    const promises = array.map(company =>
      fetchDataInBatchesPaid({
        apiToken: company.apiToken,
        dateFrom,
        dateTo,
        limit
      })
    );

    await Promise.all(promises);
  };

  const enrichmentByProductsWithStorage = async () => {
    try {
      await getCompaniesStorageData(
        companyArray.value,
        dayjs(filters.value.dates[0]).format('YYYY-MM-DD'),
        dayjs(filters.value.dates[1]).format('YYYY-MM-DD'),
        8
      );
    } catch (error) {
      console.error("Ошибка в enrichmentByProductsWithStorage:", error);
    }
  };
  // const enrichmentByProductsWithStorage = async() => {
  //   async function fetchDataInBatches({ apiToken, dateFrom, dateTo, limit }) {
  //     let currentDate = dayjs(dateFrom);
  //     const endDate = dayjs(dateTo);
  //     const loadingGetPaidStorage = message.loading("Загрузка отчёта о платном хранении", 0);
  //
  //     while (currentDate.isBefore(endDate) || currentDate.isSame(endDate)) {
  //       const batchEndDate = currentDate.add(limit - 1, 'day').isAfter(endDate) ? endDate : currentDate.add(limit - 1, 'day');
  //
  //       try {
  //         const taskIdPaidStorage = await createPaidStorage({
  //           apiToken: apiToken,
  //           dateFrom: currentDate.format('YYYY-MM-DD'),
  //           dateTo: batchEndDate.format('YYYY-MM-DD'),
  //         });
  //
  //         const storageData = await getPaidStorage({
  //           apiToken: apiToken,
  //           task_id: taskIdPaidStorage
  //         });
  //
  //         byProducts.value = updateByProductsWithStorage(byProducts.value, storageData);
  //       } catch (error) {
  //         loadingGetPaidStorage();
  //         console.error(error);
  //       }
  //
  //       currentDate = currentDate.add(limit, 'day');
  //
  //       // Добавляем задержку в 1 минуту между запросами
  //       if (currentDate.isBefore(endDate) || currentDate.isSame(endDate)) {
  //         await new Promise(resolve => setTimeout(resolve, 65000));
  //       }
  //     }
  //
  //     loadingGetPaidStorage();
  //   }
  //
  //   // Делим запросы и отправляем каждую минуту по 8 дней
  //   for (const company of companyArray.value) {
  //     await fetchDataInBatches({
  //       apiToken: company.apiToken,
  //       dateFrom: dayjs(filters.value.dates[0]).format('YYYY-MM-DD'),
  //       dateTo: dayjs(filters.value.dates[1]).format('YYYY-MM-DD'),
  //       limit: 8
  //     });
  //
  //     // await new Promise(resolve => setTimeout(resolve, 65000));
  //   }
  // }

  const fetchDataInBatches = async ({ apiToken, dateFrom, dateTo, limit }) => {
    let currentDate = dayjs(dateFrom);
    const endDate = dayjs(dateTo);

    while (currentDate.isBefore(endDate) || currentDate.isSame(endDate)) {
      const batchEndDate = currentDate.add(limit - 1, 'day').isAfter(endDate)
        ? endDate
        : currentDate.add(limit - 1, 'day');

      try {
        const acceptanceReportData = await getAcceptanceReport({
          apiToken: apiToken,
          dateFrom: currentDate.format('YYYY-MM-DD'),
          dateTo: batchEndDate.format('YYYY-MM-DD'),
        });

        byProducts.value = updateByProductsWithAcceptanceReport(byProducts.value, acceptanceReportData.report);
      } catch (error) {
        console.error("Ошибка при получении отчёта о приёмке:", error);
      }

      currentDate = currentDate.add(limit, 'day');

      // Добавляем задержку в 1 минуту между запросами
      if (currentDate.isBefore(endDate) || currentDate.isSame(endDate)) {
        await new Promise(resolve => setTimeout(resolve, 65000));
      }
    }
  };

  const enrichmentByProductsWithAcceptanceReport = async () => {
    loadingEnrichmentByProducts.value += 1;

    try {
      const promises = companyArray.value.map(company =>
        fetchDataInBatches({
          apiToken: company.apiToken,
          dateFrom: dayjs(filters.value.dates[0]).format('YYYY-MM-DD'),
          dateTo: dayjs(filters.value.dates[1]).format('YYYY-MM-DD'),
          limit: 31,
        })
      );

      await Promise.all(promises);
    } catch (error) {
      console.error("Ошибка в enrichmentByProductsWithAcceptanceReport:", error);
    } finally {
      loadingEnrichmentByProducts.value -= 1;
    }
  };

  const fetchDataInBatchesHistory = async ({ apiToken, dateFrom, dateTo, limit }) => {
    let currentDate = dayjs(dateFrom);
    const endDate = dayjs(dateTo);
    let promotion = [];

    while (currentDate.isBefore(endDate) || currentDate.isSame(endDate)) {
      const batchEndDate = currentDate.add(limit - 1, 'day').isAfter(endDate) ? endDate : currentDate.add(limit - 1, 'day');

      try {
        const historyCostData = await getHistoryCosts({
          apiToken,
          dateFrom: currentDate.format('YYYY-MM-DD'),
          dateTo: batchEndDate.format('YYYY-MM-DD'),
        });

        const newData = historyCostData
          .filter(advert => advert.paymentType === "Баланс" || advert.paymentType === "Счет")
          .map(advert => ({
            advertId: advert.advertId,
            updSum: advert.updSum,
          }));

        promotion.push(...newData);
      } catch (error) {
        console.error(error);
      }

      currentDate = currentDate.add(limit, 'day');
      if (currentDate.isBefore(endDate) || currentDate.isSame(endDate)) {
        await new Promise(resolve => setTimeout(resolve, 2500));
      }
    }
    return promotion;
  };

  const fetchDataPromotion = async ({ apiToken, adverts }) => {
    const splitArray = (inputArray, chunkSize) => {
      return Array.from({ length: Math.ceil(inputArray.length / chunkSize) }, (_, i) =>
        inputArray.slice(i * chunkSize, i * chunkSize + chunkSize)
      );
    };

    const chunkedArray = splitArray(adverts, 50);
    let data = [];

    for (const chunk of chunkedArray) {
      const dataPromotion = await getPromotion({ apiToken, adverts: chunk });
      data.push(...dataPromotion);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return data.map(item => ({
      advertId: item.advertId,
      nmId: item.type === 8 ? item.autoParams?.nms[0] : item.unitedParams[0]?.nms[0],
    }));
  };

  const getPromotionsByCompanies = async (companies) => {
    const promises = companies.map(company =>
      fetchDataInBatchesHistory({
        apiToken: company.apiToken,
        dateFrom: dayjs(filters.value.dates[0]).format('YYYY-MM-DD'),
        dateTo: dayjs(filters.value.dates[1]).format('YYYY-MM-DD'),
        limit: 31
      })
    );
    const results = await Promise.all(promises);
    return results.flat();
  };

  const getPromotionData = async (companies, adverts) => {
    const promises = companies.map(company =>
      fetchDataPromotion({ apiToken: company.apiToken, adverts })
    );
    const results = await Promise.all(promises);
    return results.flat();
  };

  // получение информации о РЕКЛАМЕ
  const enrichmentByProductsWithPromotion = async () => {
    loadingEnrichmentByProducts.value += 1;

    try {
      const promotion = await getPromotionsByCompanies(companyArray.value);
      const adverts = promotion.map(advert => advert.advertId);
      const dataAdvertsNmId = await getPromotionData(companyArray.value, adverts);

      const aggregateUpdSum = (data1, data2) => {
        const advertSumMap = new Map();
        data1.forEach(({ advertId, updSum }) => {
          advertSumMap.set(advertId, (advertSumMap.get(advertId) || 0) + updSum);
        });

        const nmSumMap = new Map();
        const processedPairs = new Set();

        data2.forEach(({ advertId, nmId }) => {
          const pairKey = `${nmId}-${advertId}`;
          if (advertSumMap.has(advertId) && !processedPairs.has(pairKey)) {
            processedPairs.add(pairKey);
            nmSumMap.set(nmId, (nmSumMap.get(nmId) || 0) + advertSumMap.get(advertId));
          }
        });

        return Array.from(nmSumMap, ([nmId, updSum]) => ({ nmId, updSum }));
      };

      const result = aggregateUpdSum(promotion, dataAdvertsNmId);
      byProducts.value = updateByProductsWithPromotion(byProducts.value, result);
    } catch (error) {
      console.error("Ошибка в enrichmentByProductsWithPromotion:", error);
    } finally {
      loadingEnrichmentByProducts.value -= 1;
    }
  };

  // const enrichmentByProductsWithAcceptanceReport = async() => {
  //   async function fetchDataInBatches({ apiToken, dateFrom, dateTo, limit }) {
  //     let currentDate = dayjs(dateFrom);
  //     const endDate = dayjs(dateTo);
  //     // const loadingAcceptanceReport = message.loading("Загрузка отчёта о платной приёмке", 0);
  //
  //     while (currentDate.isBefore(endDate) || currentDate.isSame(endDate)) {
  //       const batchEndDate = currentDate.add(limit - 1, 'day').isAfter(endDate) ? endDate : currentDate.add(limit - 1, 'day');
  //
  //       try {
  //         const acceptanceReportData = await getAcceptanceReport({
  //           apiToken: apiToken,
  //           dateFrom: currentDate.format('YYYY-MM-DD'),
  //           dateTo: batchEndDate.format('YYYY-MM-DD'),
  //         });
  //
  //         byProducts.value = updateByProductsWithAcceptanceReport(byProducts.value, acceptanceReportData.report);
  //       } catch (error) {
  //         // loadingAcceptanceReport();
  //         console.error(error);
  //       }
  //
  //       currentDate = currentDate.add(limit, 'day');
  //
  //       // Добавляем задержку в 1 минуту между запросами
  //       if (currentDate.isBefore(endDate) || currentDate.isSame(endDate)) {
  //         await new Promise(resolve => setTimeout(resolve, 65000));
  //       }
  //
  //       // loadingAcceptanceReport();
  //     }
  //   }
  //
  //   loadingEnrichmentByProducts.value += 1;
  //   for (const company of companyArray.value) {
  //     await fetchDataInBatches({
  //       apiToken: company.apiToken,
  //       dateFrom: dayjs(filters.value.dates[0]).format('YYYY-MM-DD'),
  //       dateTo: dayjs(filters.value.dates[1]).format('YYYY-MM-DD'),
  //       limit: 31
  //     });
  //
  //     // await new Promise(resolve => setTimeout(resolve, 65000));
  //   }
  //   loadingEnrichmentByProducts.value -= 1;
  // }

  // const fetchDataInBatchesHistory = async ({ apiToken, dateFrom, dateTo, limit }) => {
  //   let currentDate = dayjs(dateFrom);
  //   const endDate = dayjs(dateTo);
  //   const promotion = [];
  //
  //   while (currentDate.isBefore(endDate) || currentDate.isSame(endDate)) {
  //     const batchEndDate = currentDate.add(limit - 1, 'day').isAfter(endDate)
  //       ? endDate
  //       : currentDate.add(limit - 1, 'day');
  //
  //     try {
  //       const historyCostData = await getHistoryCosts({
  //         apiToken: apiToken,
  //         dateFrom: currentDate.format('YYYY-MM-DD'),
  //         dateTo: batchEndDate.format('YYYY-MM-DD'),
  //       });
  //
  //       const newData = historyCostData
  //         .filter(advert => advert.paymentType === "Баланс" || advert.paymentType === "Счет")
  //         .map(advert => ({
  //           advertId: advert.advertId,
  //           updSum: advert.updSum,
  //         }));
  //
  //       promotion.push(...newData);
  //     } catch (error) {
  //       console.error("Ошибка при получении данных о промоакциях:", error);
  //     }
  //
  //     currentDate = currentDate.add(limit, 'day');
  //
  //     // Добавляем задержку в 2,5 секунды между запросами
  //     if (currentDate.isBefore(endDate) || currentDate.isSame(endDate)) {
  //       await new Promise(resolve => setTimeout(resolve, 2500));
  //     }
  //   }
  //
  //   return promotion;
  // };
  //
  // const fetchDataPromotion = async ({ apiToken, adverts }) => {
  //   const splitArray = (inputArray, chunkSize) => {
  //     const resultArrays = [];
  //     for (let i = 0; i < inputArray.length; i += chunkSize) {
  //       resultArrays.push(inputArray.slice(i, i + chunkSize));
  //     }
  //     return resultArrays;
  //   };
  //
  //   const chunkedArray = splitArray(adverts, 50);
  //   let data = [];
  //
  //   for (const item of chunkedArray) {
  //     try {
  //       const dataPromotion = await getPromotion({ apiToken: apiToken, adverts: item });
  //       data.push(...dataPromotion);
  //       await new Promise(resolve => setTimeout(resolve, 500)); // Задержка 500 мс
  //     } catch (error) {
  //       console.error("Ошибка при получении данных о рекламных кампаниях:", error);
  //     }
  //   }
  //
  //   const getProducts = (object) => {
  //     if (object.type === 8) {
  //       return object.autoParams?.nms[0];
  //     } else if (object.type === 9) {
  //       return object.unitedParams[0]?.nms[0];
  //     }
  //   };
  //
  //   return data.map(item => ({
  //     advertId: item.advertId,
  //     nmId: getProducts(item),
  //   }));
  // };
  //
  // const aggregateUpdSum = (data1, data2) => {
  //   const advertSumMap = new Map();
  //   const nmSumMap = new Map();
  //   const processedPairs = new Set();
  //
  //   // Шаг 1: Суммируем updSum по advertId
  //   data1.forEach(({ advertId, updSum }) => {
  //     advertSumMap.set(advertId, (advertSumMap.get(advertId) || 0) + updSum);
  //   });
  //
  //   // Шаг 2: Сопоставляем advertId с nmId
  //   data2.forEach(({ advertId, nmId }) => {
  //     const pairKey = `${nmId}-${advertId}`;
  //
  //     if (advertSumMap.has(advertId) && !processedPairs.has(pairKey)) {
  //       processedPairs.add(pairKey);
  //       nmSumMap.set(nmId, (nmSumMap.get(nmId) || 0) + advertSumMap.get(advertId));
  //     }
  //   });
  //
  //   // Шаг 3: Преобразуем Map в массив объектов
  //   return Array.from(nmSumMap, ([nmId, updSum]) => ({ nmId, updSum }));
  // };
  //
  // const enrichmentByProductsWithPromotion = async () => {
  //   loadingEnrichmentByProducts.value += 1;
  //
  //   try {
  //     // Получаем данные о промоакциях для всех компаний
  //     const promotionDataPromises = companyArray.value.map(company =>
  //       fetchDataInBatchesHistory({
  //         apiToken: company.apiToken,
  //         dateFrom: dayjs(filters.value.dates[0]).format('YYYY-MM-DD'),
  //         dateTo: dayjs(filters.value.dates[1]).format('YYYY-MM-DD'),
  //         limit: 31,
  //       })
  //     );
  //
  //     const promotionData = await Promise.all(promotionDataPromises);
  //     const promotion = promotionData.flat();
  //
  //     // Получаем данные о рекламных кампаниях для всех компаний
  //     const adverts = promotion.map(advert => advert.advertId);
  //     const promotionAdvertsPromises = companyArray.value.map(company =>
  //       fetchDataPromotion({ apiToken: company.apiToken, adverts })
  //     );
  //
  //     const promotionAdvertsData = await Promise.all(promotionAdvertsPromises);
  //     const dataAdvertsNmId = promotionAdvertsData.flat();
  //
  //     // Объединяем данные и обновляем byProducts
  //     const result = aggregateUpdSum(promotion, dataAdvertsNmId);
  //     byProducts.value = updateByProductsWithPromotion(byProducts.value, result);
  //   } catch (error) {
  //     console.error("Ошибка в enrichmentByProductsWithPromotion:", error);
  //   } finally {
  //     loadingEnrichmentByProducts.value -= 1;
  //   }
  // };

  // const enrichmentByProductsWithPromotion = async() => {
  //   const promotion = ref([]);
  //
  //   async function fetchDataInBatchesHistory({ apiToken, dateFrom, dateTo, limit }) {
  //     let currentDate = dayjs(dateFrom);
  //     const endDate = dayjs(dateTo);
  //
  //     while (currentDate.isBefore(endDate) || currentDate.isSame(endDate)) {
  //       const batchEndDate = currentDate.add(limit - 1, 'day').isAfter(endDate) ? endDate : currentDate.add(limit - 1, 'day');
  //
  //       try {
  //         const historyCostData = await getHistoryCosts({
  //           apiToken: apiToken,
  //           dateFrom: currentDate.format('YYYY-MM-DD'),
  //           dateTo: batchEndDate.format('YYYY-MM-DD'),
  //         });
  //
  //         const newData = historyCostData
  //           .filter(advert => advert.paymentType === "Баланс" || advert.paymentType === "Счет")
  //           .map(advert => ({
  //           advertId: advert.advertId,
  //           updSum: advert.updSum,
  //         }));
  //
  //         promotion.value.push(...newData);
  //
  //         // byProducts.value = updateByProductsWithAcceptanceReport(byProducts.value, acceptanceReportData.report);
  //       } catch (error) {
  //         console.error(error);
  //       }
  //
  //       currentDate = currentDate.add(limit, 'day');
  //
  //       // Добавляем задержку в 2,5 секунды между запросами
  //       if (currentDate.isBefore(endDate) || currentDate.isSame(endDate)) {
  //         await new Promise(resolve => setTimeout(resolve, 2500));
  //       }
  //     }
  //   }
  //
  //   async function fetchDataPromotion({ apiToken, adverts }) {
  //     function splitArray(inputArray, chunkSize) {
  //       const resultArrays = [];
  //       for (let i = 0; i < inputArray.length; i += chunkSize) {
  //         resultArrays.push(inputArray.slice(i, i + chunkSize));
  //       }
  //       return resultArrays;
  //     }
  //
  //     const chunkedArray = splitArray(adverts, 50);
  //
  //     let data = [];
  //     for (const item of chunkedArray) {
  //       const dataPromotion = await getPromotion({ apiToken: apiToken, adverts: item });
  //       data.push(...dataPromotion);
  //       await new Promise(resolve => setTimeout(resolve, 500));
  //     }
  //
  //     function getProducts(object) {
  //       if (object.type === 8) {
  //         return object.autoParams?.nms[0];
  //       } else if (object.type === 9) {
  //         return object.unitedParams[0]?.nms[0];
  //       }
  //     }
  //
  //     return data.map(item => ({
  //       advertId: item.advertId,
  //       nmId: getProducts(item),
  //     }));
  //   }
  //
  //   loadingEnrichmentByProducts.value += 1;
  //   for (const company of companyArray.value) {
  //     await fetchDataInBatchesHistory({
  //       apiToken: company.apiToken,
  //       dateFrom: dayjs(filters.value.dates[0]).format('YYYY-MM-DD'),
  //       dateTo: dayjs(filters.value.dates[1]).format('YYYY-MM-DD'),
  //       limit: 31
  //     });
  //   }
  //
  //   const adverts = promotion.value.map(advert => advert.advertId);
  //   let dataAdvertsNmId = [];
  //   for (const company of companyArray.value) {
  //     dataAdvertsNmId = await fetchDataPromotion({ apiToken: company.apiToken, adverts });
  //   }
  //
  //   function aggregateUpdSum(data1, data2) {
  //     // Шаг 1: Суммируем updSum по advertId
  //     const advertSumMap = new Map();
  //
  //     data1.forEach(({ advertId, updSum }) => {
  //       advertSumMap.set(advertId, (advertSumMap.get(advertId) || 0) + updSum);
  //     });
  //
  //     // console.log("advertSumMap", advertSumMap);
  //
  //     // Шаг 2: Сопоставляем advertId с nmId, избегая повторных сложений
  //     const nmSumMap = new Map();
  //     const processedPairs = new Set(); // Храним уже обработанные пары nmId-advertId
  //
  //     data2.forEach(({ advertId, nmId }) => {
  //       const pairKey = `${nmId}-${advertId}`; // Уникальный ключ
  //
  //       if (advertSumMap.has(advertId) && !processedPairs.has(pairKey)) {
  //         processedPairs.add(pairKey); // Запоминаем, что уже обработали эту пару
  //         nmSumMap.set(nmId, (nmSumMap.get(nmId) || 0) + advertSumMap.get(advertId));
  //       }
  //     });
  //
  //     // Шаг 3: Преобразуем Map обратно в массив объектов
  //     return Array.from(nmSumMap, ([nmId, updSum]) => ({ nmId, updSum }));
  //   }
  //
  //   const result = aggregateUpdSum(promotion.value, dataAdvertsNmId);
  //
  //   byProducts.value = updateByProductsWithPromotion(byProducts.value, result);
  //
  //   loadingEnrichmentByProducts.value -= 1;
  // }

  return {
    initialized,
    initCompanyArray,
    marketplaces,
    accessMethods,
    addCompany,
    editCompany,
    removeCompany,
    companyArray,
    wbArticles,
    byProducts,
    filters,
    stats,
    loading,
    loadingEnrichmentByProducts,
    optionCompanies,
    optionBrand,
    optionCategories,
    optionArticles,
    enrichmentCompaniesInfo,
    fillingTax,
    fillingCost,
    enrichmentWbArticles,
    createByProducts,
    addSalesByProducts,
    addOrdersByProducts,
    enrichmentByProductsWithStorage,
    enrichmentByProductsWithAcceptanceReport,
    enrichmentByProductsWithPromotion,
  }
});
