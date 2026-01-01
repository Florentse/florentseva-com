// api/get-table.js

// Список разрешенных таблиц для публичного чтения
const ALLOWED_TABLES = [
  "Locales",
  "Service Categories",
  "Service Category Translations",
  "Services",
  "Service Translations",
  "Service Process Steps",
  "Service FAQs",
  "Cases",
  "Case Translations",
  "Case Gallery",
  "Reviews",
  "Review Translations",
  "Case Reviews Link",
  "Pages",
  "Page Meta Translations",
  "Page Sections",
  "Page Section Translations"
];

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { tableName, ...options } = req.query;

  // ПРОВЕРКА: Если таблицы нет в белом списке — блокируем запрос
  if (!ALLOWED_TABLES.includes(tableName)) {
    return res.status(403).json({ message: 'Access denied: Table is not public' });
  }

  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

  try {
    const urlParams = new URLSearchParams(options);
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}?${urlParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}