export function updateByProductsWithPromotion(byProductsArray, data) {
  return byProductsArray.map((product) => {
    const matchingStorageItems = data.find(
      (dataItem) =>
        dataItem.nmId === product.nm_id
    );

    return {
      ...product,
      advertisingExpense: matchingStorageItems ? matchingStorageItems.updSum : 0,
    };
  });
}