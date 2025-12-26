//src/services/airtable.js

const AIRTABLE_BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID;
const AIRTABLE_TOKEN = import.meta.env.VITE_AIRTABLE_TOKEN;

if (!AIRTABLE_BASE_ID || !AIRTABLE_TOKEN) {
  console.error("Airtable env vars are missing");
}

/**
 * Универсальный fetch любой таблицы Airtable с поддержкой пагинации и параметров
 * @param {string} tableName — Имя таблицы
 * @param {object} options — Фильтры (filterByFormula), сортировка и др.
 */
export async function fetchTable(tableName, options = {}) {
  let allRecords = [];
  let offset = "";
  const baseUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}`;

  do {
    const urlParams = new URLSearchParams(options);
    if (offset) urlParams.set("offset", offset);

    const res = await fetch(`${baseUrl}?${urlParams.toString()}`, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`,
      },
    });

    if (!res.ok) {
      throw new Error(await res.text());
    }

    const data = await res.json();
    const formatted = data.records.map((record) => ({
      recordId: record.id,
      ...record.fields,
    }));

    allRecords = [...allRecords, ...formatted];
    offset = data.offset;
  } while (offset);

  return allRecords;
}
