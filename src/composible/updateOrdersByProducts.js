import dayjs from "dayjs";

// export function updateOrdersByProducts({ byProducts, data, dateTo }) {
//   return byProducts.map((product) => {
//     // Фильтруем все совпадающие записи в data
//     const matchingStorageItems = data
//       .filter(dataItem => dayjs(dataItem.date).format('YYYY-MM-DD') <= dateTo)
//       .filter(
//       (dataItem) =>
//         dataItem.brand === product.brand_name &&
//         dataItem.subject === product.subject_name &&
//         dataItem.nmId === product.nm_id
//     );
//
//     // Суммируем orders, если есть совпадения
//     const totalOrderPrice = matchingStorageItems.reduce(
//       (sum, item) => sum + item.priceWithDisc,
//       0
//     );
//
//     // Суммируем ordersCount, если есть совпадения
//     const totalOrderCount = matchingStorageItems.reduce(
//       (sum, item) => sum + 1,
//       0
//     );
//
//     return {
//       ...product,
//       orders: (product.orders || 0) + totalOrderPrice,
//       ordersCount: (product.ordersCount || 0) + totalOrderCount,
//     };
//   });
// }

export function updateOrdersByProducts({ byProducts, data, dateFrom, dateTo }) {
  return byProducts.map((product) => {
    // Фильтруем все совпадающие записи в data
    const matchingStorageItems = data
      .filter(dataItem => dayjs(dataItem.date).format('YYYY-MM-DD') >= dateFrom)
      .filter(dataItem => dayjs(dataItem.date).format('YYYY-MM-DD') <= dateTo)
      .filter(
        (dataItem) =>
          dataItem.brand === product.brand_name &&
          dataItem.subject === product.subject_name &&
          dataItem.nmId === product.nm_id
      );

    // Используем Set для хранения уникальных srid
    const uniqueSrids = new Set();

    console.log("matchingStorageItems", matchingStorageItems);

    // Суммируем orders и учитываем уникальные srid для ordersCount
    const totalOrderPrice = matchingStorageItems.reduce((sum, item) => {
      if (item.nmId === 277107650) {
        console.log("встретили");
      }

      if (!uniqueSrids.has(item.srid)) {
        uniqueSrids.add(item.srid);
      }
      return sum + item.priceWithDisc;
    }, 0);

    // Количество уникальных srid
    const totalOrderCount = uniqueSrids.size;

    return {
      ...product,
      orders: (product.orders || 0) + totalOrderPrice,
      ordersCount: (product.ordersCount || 0) + totalOrderCount,
    };
  });
}
