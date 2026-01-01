// src/services/airtable.js

export async function fetchTable(tableName, options = {}) {
  const isDev = import.meta.env.DEV; // Vite автоматически определяет режим
  let allRecords = [];
  let offset = "";

  do {
    let url;
    let fetchOptions = {};

    if (isDev) {
      // Локально: идем напрямую в Airtable
      const query = new URLSearchParams(options);
      if (offset) query.set("offset", offset);
      url = `https://api.airtable.com/v0/${import.meta.env.VITE_AIRTABLE_BASE_ID}/${tableName}?${query.toString()}`;
      fetchOptions = {
        headers: { Authorization: `Bearer ${import.meta.env.VITE_AIRTABLE_TOKEN}` }
      };
    } else {
      // В облаке: идем через наш защищенный API-прокси
      const query = new URLSearchParams({ tableName, ...options });
      if (offset) query.set("offset", offset);
      url = `/api/get-table?${query.toString()}`;
    }

    const res = await fetch(url, fetchOptions);
    if (!res.ok) throw new Error(`Ошибка API: ${await res.text()}`);

    const data = await res.json();
    const records = data.records || [];

    const formatted = records.map((record) => ({
      recordId: record.id,
      ...record.fields,
    }));

    allRecords = [...allRecords, ...formatted];
    offset = data.offset;
  } while (offset);

  return allRecords;
}