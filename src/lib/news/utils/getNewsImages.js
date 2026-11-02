// Возвращает главное (1) и второстепенное (2) фото новости
export const getNewsImages = (item) => {
  const images = (item?.existing_images || []).filter((img) => img?.image);

  // Если бек отдаёт поле порядка (order / position), сортируем по нему.
  // Если такого поля нет, порядок остаётся как пришёл с бека.
  const sorted = [...images].sort(
    (a, b) => (a.order ?? a.position ?? 0) - (b.order ?? b.position ?? 0),
  );

  return {
    main: sorted[0]?.image || null, // 1-е фото: главная страница
    second: sorted[1]?.image || null, // 2-е фото: только страница новости
  };
};
