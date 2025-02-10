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
          (el) =>
            el.subject_name === sale.subject_name &&
            el.nm_id === sale.nm_id &&
            el.brand_name === sale.brand_name
        );

        if (existing) {
          existing.ppvz_for_pay += sale.ppvz_for_pay;
          existing.retail_price += sale.retail_price;
          existing.quantity += sale.quantity;
          existing.delivery_rub += sale.delivery_rub;
        } else if (sale.subject_name && sale.brand_name && sale.nm_id) {
          dataProducts.push({
            subject_name: sale.subject_name,
            nm_id: sale.nm_id,
            brand_name: sale.brand_name,
            barcode: sale.barcode,
            ppvz_for_pay: sale.ppvz_for_pay,
            retail_price: sale.retail_price,
            quantity: sale.quantity,
            delivery_rub: sale.delivery_rub,
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
