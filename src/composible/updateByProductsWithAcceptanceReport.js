export function updateByProductsWithAcceptanceReport(byProductsArray, acceptanceReportData) {
  return byProductsArray.map((product) => {
    // Если acceptanceReportData пуст или не существует, устанавливаем acceptanceReport в 0
    if (!acceptanceReportData || acceptanceReportData.length === 0) {
      return {
        ...product,
        acceptanceReport: 0,
      };
    }

    // Ищем совпадения в acceptanceReportData
    const matchingAcceptanceReport = acceptanceReportData?.filter(
      (storage) =>
        storage.subjectName === product.subject_name &&
        storage.nmID === product.nm_id
    );

    // Суммируем storage, если есть совпадения
    const totalAcceptanceReport = matchingAcceptanceReport.reduce(
      (sum, item) => sum + item.total,
      0
    );

    return {
      ...product,
      acceptanceReport: totalAcceptanceReport,
    };
  });
}