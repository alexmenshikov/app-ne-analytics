import axios from "axios";
import { message } from "ant-design-vue";
import dayjs from "dayjs";

export async function getAcceptanceReport({ apiToken, dateFrom, dateTo }) {
  try {
    const response = await axios.get(
      "https://seller-analytics-api.wildberries.ru/api/v1/analytics/acceptance-report", {
        params: {
          dateFrom: dateFrom,
          dateTo: dateTo,
        },
        headers: {
          Authorization: apiToken,
        }
      }
    );

    return response.data;
  } catch (error) {
    message.error("Ошибка при загрузке отчёта о платной приёмке");
    console.error('Error:', error.response?.status, error.response?.data);
    return [];
  }
}
