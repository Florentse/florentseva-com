//src/services/airtable.js

const AIRTABLE_BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID;
const AIRTABLE_TOKEN = import.meta.env.VITE_AIRTABLE_TOKEN;

if (!AIRTABLE_BASE_ID || !AIRTABLE_TOKEN) {
  console.error("Airtable env vars are missing");
}

/**
 * Универсальный fetch любой таблицы Airtable
 * @param {string} tableName — ТОЧНОЕ имя таблицы, как в Airtable
 */
export async function fetchTable(tableName) {
  const res = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(
      tableName
    )}`,
    {
      headers: {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error(await res.text());
  }

  const data = await res.json();

  return data.records.map((record) => ({
     recordId: record.id, 
    ...record.fields,
  }));
}
