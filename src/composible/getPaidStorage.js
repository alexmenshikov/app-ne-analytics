import axios from "axios";
import { message } from "ant-design-vue";
import dayjs from "dayjs";

export async function getPaidStorage({ apiToken, task_id }) {
  try {
    await new Promise(resolve => setTimeout(resolve, 10000));

    const response = await axios.get(
      `https://seller-analytics-api.wildberries.ru/api/v1/paid_storage/tasks/${task_id}/download`, {
        headers: {
          Authorization: apiToken,
        }
      }
    );

    console.log(response.data);
  } catch (error) {
    message.error("Ошибка при загрузке отчёта платного хранения");
    console.error('Error:', error.response?.status, error.response?.data);
    return [];
  }
}
