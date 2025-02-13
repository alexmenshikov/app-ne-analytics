import axios from "axios";
import { message } from "ant-design-vue";

export async function createPaidStorage({ apiToken, dateFrom, dateTo }) {
  try {
    const response = await axios.get(
      "https://seller-analytics-api.wildberries.ru/api/v1/paid_storage", {
        params: {
          dateFrom: dateFrom,
          dateTo: dateTo,
        },
        headers: {
          Authorization: apiToken,
        }
      }
    );

    return response.data.taskId || null;
  } catch (error) {
    message.error("Ошибка при создании отчёта для платного хранения");
    return null;
  }
}
