function calculateCommission({ retail_amount, retail_price, acquiring_fee, commission_percent }) {
  const one = (retail_price / 100) * commission_percent;
  const two = one + acquiring_fee;
  const three = retail_price - two;
  const four = retail_amount - three;

  return parseFloat(four.toFixed(1));
}

export function updateSalesByProducts(byProductsArray, salesData) {
  return byProductsArray.map((product) => {
    const matchingSales = salesData.filter(
      (sale) =>
        sale.subject_name === product.subject_name &&
        sale.nm_id === product.nm_id &&
        sale.brand_name === product.brand_name
    );

    if (matchingSales.length === 0) {
      return product; // Если нет совпадений, возвращаем объект без изменений
    }

    // Создаём копию объекта и добавляем отсутствующие поля
    let updatedProduct = {
      ...product,
      logistics: product.logistics || 0,
      logisticsCount: product.logisticsCount || 0,
      sales: product.sales || 0,
      realisation: product.realisation || 0,
      salesCount: product.salesCount || 0,
      commission: product.commission || 0,
      compensation: product.compensation || 0,
      compensationCount: product.compensationCount || 0,
      otherDeduction: product.otherDeduction || 0,
    };

    // Обрабатываем каждую продажу
    matchingSales.forEach((sale) => {
      updatedProduct.logistics += sale.delivery_rub || 0;
      updatedProduct.otherDeduction += sale.deduction || 0;

      if (sale.bonus_type_name !== "Возврат брака (К продавцу)") {
        updatedProduct.logisticsCount += sale.delivery_amount || 0;
      }

      if (sale.supplier_oper_name === "Продажа") {
        updatedProduct.salesCount += sale.quantity || 0;
        updatedProduct.commission += calculateCommission({
          retail_amount: sale.retail_amount || 0,
          retail_price: sale.retail_price || 0,
          acquiring_fee: sale.acquiring_fee || 0,
          commission_percent: sale.commission_percent || 0,
        });
      }

      if (
        sale.supplier_oper_name === "Компенсация ущерба"
      ) {
        updatedProduct.compensation += sale.ppvz_for_pay || 0;
        updatedProduct.compensationCount += sale.quantity || 0;
        updatedProduct.commission -= sale.ppvz_for_pay || 0;
      }

      if (
        sale.supplier_oper_name === "Коррекция продаж" ||
        sale.supplier_oper_name === "Добровольная компенсация при возврате"
      ) {
        updatedProduct.commission -= sale.ppvz_for_pay || 0;
      }

      if (sale.supplier_oper_name === "Возврат") {
        updatedProduct.sales -= sale.retail_amount || 0;
        updatedProduct.salesCount -= sale.quantity || 0;
        updatedProduct.realisation -= sale.retail_price || 0;
        updatedProduct.commission -= (sale.retail_amount - sale.ppvz_for_pay || 0);
      } else {
        updatedProduct.sales += sale.retail_amount || 0;
        updatedProduct.realisation += sale.retail_price || 0;
      }
    });

    return updatedProduct;
  });
}
