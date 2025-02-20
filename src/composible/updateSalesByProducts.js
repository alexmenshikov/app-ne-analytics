export function updateSalesByProducts(byProductsArray, salesData) {
  const updatedProducts = [...byProductsArray];

  salesData.forEach((sale) => {
    const existing = updatedProducts.find(
      (product) =>
        product.subject_name === sale.subject_name &&
        product.nm_id === sale.nm_id &&
        product.brand_name === sale.brand_name
    );

    if (existing) {
      existing.logistics += sale.delivery_rub;
      if (sale.supplier_oper_name === "Продажа") {
        existing.salesCount = (existing.salesCount || 0) + sale.quantity;
      }
      if (sale.supplier_oper_name === "Компенсация ущерба") {
        existing.compensation += sale.ppvz_for_pay;
        existing.compensationCount = (existing.compensationCount || 0) + sale.quantity;
      }
      if (sale.supplier_oper_name === "Возврат") {
        existing.sales -= sale.retail_amount;
        existing.salesCount = (existing.salesCount || 0) - sale.quantity;
        existing.realisation -= sale.retail_price;
      } else {
        existing.sales += sale.retail_amount;
        existing.realisation += sale.retail_price;
      }
    } else {
      updatedProducts.push({
        subject_name: sale.subject_name,
        nm_id: sale.nm_id,
        brand_name: sale.brand_name,
        sales: sale.retail_amount,
        salesCount: sale.supplier_oper_name === "Продажа" ? sale.quantity : 0,
        compensation: sale.ppvz_for_pay,
        realisation: sale.retail_price,
        logistics: sale.delivery_rub,
        supplier_oper_name: sale.supplier_oper_name,
        compensationCount: sale.supplier_oper_name === "Компенсация ущерба" ? sale.quantity : 0,
      });
    }
  });

  return updatedProducts;
}
