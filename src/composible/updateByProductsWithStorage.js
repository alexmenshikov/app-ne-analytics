export function updateByProductsWithStorage(byProductsArray, storageData) {
  return byProductsArray.map((product) => {
    // Фильтруем все совпадающие записи в storageData
    const matchingStorageItems = storageData.filter(
      (storage) =>
        storage.subject === product.subject_name &&
        storage.nmId === product.nm_id &&
        storage.brand === product.brand_name
    );

    // Суммируем warehousePrice, если есть совпадения
    const totalWarehousePrice = matchingStorageItems.reduce(
      (sum, item) => sum + item.warehousePrice,
      0
    );

    return {
      ...product,
      warehousePrice: (product.warehousePrice || 0) + totalWarehousePrice,
    };
  });
}