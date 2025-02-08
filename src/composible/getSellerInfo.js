import axios from "axios";
import { message } from "ant-design-vue";

export async function getSellerInfo({ apiToken }) {
  try {
    const response = await axios.get(
      "https://common-api.wildberries.ru/api/v1/seller-info", {
        headers: {
          Authorization: apiToken,
        }
      }
    );

    return response.data
  } catch (error) {
    message.error("Ошибка при загрузке информации о продавце");
    console.error("getSellerInfo", error);
    return null;
  }
}
