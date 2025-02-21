import dayjs from "dayjs";

export function updateOrdersByProducts({ byProducts, data, dateTo }) {
  return byProducts.map((product) => {
    // Фильтруем все совпадающие записи в data
    const matchingStorageItems = data
      .filter(dataItem => dayjs(dataItem.lastChangeDate).format('YYYY-MM-DD') <= dateTo)
      .filter(
      (dataItem) =>
        dataItem.brand === product.brand_name &&
        dataItem.subject === product.subject_name &&
        dataItem.nmId === product.nm_id
    );

    matchingStorageItems.forEach((item, index) => {
      console.log(`${index+1} - ${product.nm_id} - ${item.date}`);
    })

    // Суммируем orders, если есть совпадения
    const totalOrderPrice = matchingStorageItems.reduce(
      (sum, item) => sum + item.finishedPrice,
      0
    );

    // Суммируем ordersCount, если есть совпадения
    const totalOrderCount = matchingStorageItems.reduce(
      (sum, item) => sum + 1,
      0
    );

    return {
      ...product,
      orders: (product.orders || 0) + totalOrderPrice,
      ordersCount: (product.ordersCount || 0) + totalOrderCount,
    };
  });
}
