import axios from "axios";
import { message } from "ant-design-vue";

export async function getWbArticles({ apiToken }) {
  try {
    const response = await axios.post(
      "https://content-api.wildberries.ru/content/v2/get/cards/list",
      {
        settings: {
          sort: {
            ascending: false
          },
          filter: {
            textSearch: "",
            allowedCategoriesOnly: true,
            tagIDs: [],
            objectIDs: [],
            brands: [],
            imtID: 0,
            withPhoto: -1
          },
          cursor: {
            limit: 100
          }
        }
      },
      {
        headers: {
          Authorization: apiToken,
        }
      }
    );

    return response.data.cards.map((card) => ({
      nmUUID: card.nmUUID,
      brand: card.brand,
      nmID: card.nmID,
      vendorCode: card.vendorCode,
      title: card.title,
      photo: card.photos ? card.photos[0].big : null,
      category: card.subjectName
    }));
  } catch (error) {
    message.error("Ошибка при загрузке карточек товара");
    return [];
  }
}
