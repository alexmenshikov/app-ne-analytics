import axios from "axios";
import { message } from "ant-design-vue";

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

      return response.data;

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
