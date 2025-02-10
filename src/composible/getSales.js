import axios from "axios";
import { message } from "ant-design-vue";
import dayjs from "dayjs";

export async function getSales({ apiToken, dateFrom, dateTo }) {
  try {
    const response = await axios.get(
      "https://statistics-api.wildberries.ru/api/v1/supplier/sales", {
        params: {
          dateFrom: dateFrom,
          flag: 0
        },
        headers: {
          Authorization: apiToken,
        }
      }
    );

    const filterResponse = response.data
      .filter(sale =>
        dayjs(sale.date).format('YYYY.MM.DD') <= dayjs(dateTo).format('YYYY.MM.DD')
      )
      .filter(sale => sale.orderType === "Клиентский")
      .filter(sale => sale.saleID?.startsWith('S'));

    let dataProducts = [];

    filterResponse.forEach(sale => {
      const existing = dataProducts.find(el =>
        el.supplierArticle === sale.supplierArticle &&
        el.nmId === sale.nmId &&
        el.category === sale.category &&
        el.subject === sale.subject &&
        el.brand === sale.brand
      );

      if (existing) {
        existing.priceWithDisc += sale.priceWithDisc;
        existing.count += 1;
      } else {
        dataProducts.push({
          supplierArticle: sale.supplierArticle,
          nmId: sale.nmId,
          category: sale.category,
          subject: sale.subject,
          brand: sale.brand,
          priceWithDisc: sale.priceWithDisc,
          count: 1,
        });
      }
    });

    return dataProducts;
  } catch (error) {
    message.error("Ошибка при загрузке продаж");
    return [];
  }
}
