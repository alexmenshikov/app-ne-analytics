import axios from "axios";
import { message } from "ant-design-vue";

export async function getHistoryCosts({ apiToken, dateFrom, dateTo }) {
  try {
    const response = await axios.get(
      "https://advert-api.wildberries.ru/adv/v1/upd", {
        params: {
          from: dateFrom,
          to: dateTo,
        },
        headers: {
          Authorization: apiToken,
        }
      }
    );

    return response.data;
  } catch (error) {
    message.error("Ошибка при получении истории затрат (реклама)");
    console.error('Error:', error.response?.status, error.response?.data);
    return [];
  }
}
