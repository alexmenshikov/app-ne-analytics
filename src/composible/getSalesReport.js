import axios from "axios";
import { message } from "ant-design-vue";
import dayjs from "dayjs";

export async function getSalesReport({ apiToken, dateFrom, dateTo }) {
  try {
    let dataProducts = [];
    let rrdid = 0;
    const limit = 100000;

    while (true) {
      const response = await axios.get(
        "https://statistics-api.wildberries.ru/api/v5/supplier/reportDetailByPeriod", {
          params: {
            dateFrom: dateFrom,
            dateTo: dateTo,
            limit: limit,
            rrdid: rrdid
          },
          headers: {
            Authorization: apiToken,
          }
        }
      );

      if (
        !response.data ||
        !Array.isArray(response.data) ||
        response.data.length === 0
      ) {
        break; // Выход из цикла
      }

      response.data.forEach((sale) => {
        const existing = dataProducts.find(
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
          dataProducts.push({
            subject_name: sale.subject_name, // Товар
            nm_id: sale.nm_id,
            brand_name: sale.brand_name,
            retail_amount: sale.retail_amount, // Вайлдберриз реализовал Товар (Пр)
            ppvz_for_pay: sale.ppvz_for_pay, // К перечислению продавцу за реализованный товар
            retail_price: sale.retail_price, // Цена розничная
            delivery_rub: sale.delivery_rub, // Услуги по доставке товара покупателю
            supplier_oper_name: sale.supplier_oper_name, // Обоснование для оплаты
            ...(sale.supplier_oper_name === "Продажа" ? { quantitySale: sale.quantity } : { quantitySale: 0 }),
            ...(sale.supplier_oper_name === "Компенсация ущерба" ? { quantityCompensation: sale.quantity } : { quantityCompensation: 0 }),
          });
        }
      });

      if (response.data.length < limit) {
        break; // Выход из цикла
      }

      rrdid = response.data[response.data.length - 1].rrd_id;
    }

    return dataProducts;
  } catch (error) {
    message.error("Ошибка при загрузке продаж");
    return [];
  }
}

// export async function getSalesReport({ apiToken, dateFrom, dateTo }) {
//   try {
//     const response = await axios.get(
//       "https://statistics-api.wildberries.ru/api/v5/supplier/reportDetailByPeriod", {
//         params: {
//           dateFrom: dateFrom,
//           dateTo: dateTo,
//           limit: 100000,
//           rrdid: 0
//         },
//         headers: {
//           Authorization: apiToken,
//         }
//       }
//     );
//
//     let dataProducts = [];
//
//     if (response.data && Array.isArray(response.data)) {
//       response.data.forEach(sale => {
//         const existing = dataProducts.find(el =>
//           el.subject_name === sale.subject_name &&
//           el.nm_id === sale.nm_id &&
//           el.brand_name === sale.brand_name
//         );
//
//         if (existing) {
//           existing.ppvz_for_pay += sale.ppvz_for_pay;
//           existing.retail_price += sale.retail_price;
//           existing.quantity += sale.quantity;
//         } else {
//           dataProducts.push({
//             subject_name: sale.subject_name,
//             nm_id: sale.nm_id,
//             brand_name: sale.brand_name,
//             barcode: sale.barcode,
//             ppvz_for_pay: sale.ppvz_for_pay,
//             retail_price: sale.retail_price,
//             quantity: sale.quantity,
//             delivery_rub: sale.delivery_rub,
//           });
//         }
//       });
//     }
//
//     return dataProducts;
//   } catch (error) {
//     message.error("Ошибка при загрузке продаж");
//     return [];
//   }
// }
