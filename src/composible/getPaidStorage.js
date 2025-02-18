import axios from "axios";
import { message } from "ant-design-vue";
import dayjs from "dayjs";

export async function getPaidStorage({ apiToken, task_id }) {
  const loadingGetPaidStorage = message.loading("Загрузка отчёта о платном хранении", 0);

  try {
    await new Promise(resolve => setTimeout(resolve, 12000));

    const response = await axios.get(
      `https://seller-analytics-api.wildberries.ru/api/v1/paid_storage/tasks/${task_id}/download`, {
        headers: {
          Authorization: apiToken,
        }
      }
    );

    loadingGetPaidStorage();
    return response.data;
  } catch (error) {
    loadingGetPaidStorage();
    message.error("Ошибка при загрузке отчёта платного хранения");
    console.error('Error:', error.response?.status, error.response?.data);
    return [];
  }
}
