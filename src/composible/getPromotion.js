import axios from "axios";
import { message } from "ant-design-vue";

export async function getPromotion({ apiToken, adverts }) {
  try {
    const response = await axios.post(
      "https://advert-api.wildberries.ru/adv/v1/promotion/adverts",
      adverts,
      {
        headers: {
          Authorization: apiToken,
        },
      }
    );

    return response.data;
  } catch (error) {
    message.error("Ошибка при получении информации о кампаниях (реклама)");
    console.error('Error:', error.response?.status, error.response?.data);
    return [];
  }
}
