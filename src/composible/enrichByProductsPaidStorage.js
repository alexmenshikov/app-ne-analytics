export function enrichByProductsPaidStorage({ byProducts, responseData }) {
  return responseData.forEach((paidStorage) => {
    const existing = byProducts.find(
      (product) =>
        product.subject_name === paidStorage.subject &&
        product.nm_id === paidStorage.nm_id &&
        product.brand_name === paidStorage.brand
    );

    if (existing) {
      existing.warehousePrice = (existing.warehousePrice || 0) + paidStorage.warehousePrice;
    }
  })
}
