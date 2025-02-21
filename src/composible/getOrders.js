import axios from "axios";
import { message } from "ant-design-vue";

export async function getOrders({ apiToken, dateFrom }) {
  try {
    const response = await axios.get(
      "https://statistics-api.wildberries.ru/api/v1/supplier/orders", {
        params: {
          dateFrom: dateFrom,
          flag: 0,
        },
        headers: {
          Authorization: apiToken,
        }
      }
    );

    // return response.data.filter(order =>
    //   order.orderType === "Клиентский" &&
    //   order.isCancel === false
    // );

    // return response.data.filter(order =>
    //   order.isCancel === false
    // );

    // return response.data.filter(order => order.orderType === "Клиентский");
    return response.data;
  } catch (error) {
    message.error("Ошибка при загрузке заказов");
    return [];
  }
}
