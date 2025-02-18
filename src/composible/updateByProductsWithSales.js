export function updateByProductsWithSales(byProductsArray, salesData) {
  const updatedProducts = [...byProductsArray];

  salesData.forEach((sale) => {
    const existing = updatedProducts.find(
      (product) =>
        product.subject_name === sale.subject_name &&
        product.nm_id === sale.nm_id &&
        product.brand_name === sale.brand_name
    );

    if (existing) {
      existing.delivery_rub += sale.delivery_rub;
      if (sale.supplier_oper_name === "Продажа") {
        existing.quantitySale = (existing.quantitySale || 0) + sale.quantity;
      }
      if (sale.supplier_oper_name === "Компенсация ущерба") {
        existing.ppvz_for_pay += sale.ppvz_for_pay;
        existing.quantityCompensation = (existing.quantityCompensation || 0) + sale.quantity;
      }
      if (sale.supplier_oper_name === "Возврат") {
        existing.retail_amount -= sale.retail_amount;
        existing.quantitySale = (existing.quantitySale || 0) - sale.quantity;
        existing.retail_price -= sale.retail_price;
      } else {
        existing.retail_amount += sale.retail_amount;
        existing.retail_price += sale.retail_price;
      }
    } else {
      updatedProducts.push({
        subject_name: sale.subject_name,
        nm_id: sale.nm_id,
        brand_name: sale.brand_name,
        retail_amount: sale.retail_amount,
        ppvz_for_pay: sale.ppvz_for_pay,
        retail_price: sale.retail_price,
        delivery_rub: sale.delivery_rub,
        supplier_oper_name: sale.supplier_oper_name,
        quantitySale: sale.supplier_oper_name === "Продажа" ? sale.quantity : 0,
        quantityCompensation: sale.supplier_oper_name === "Компенсация ущерба" ? sale.quantity : 0,
      });
    }
  });

  return updatedProducts;
}
