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


/**
 * Получает SEO-данные для конкретной страницы и локали
 * @param {string} pageSlug - Slug страницы (например, 'home')
 * @param {string} localeRecordId - ID записи локали из Airtable
 */
export async function fetchPageSeo(pageSlug, localeRecordId) {
  try {
    // 1. Получаем ID страницы по её slug
    const pages = await fetchTable("Pages", {
      filterByFormula: `{slug}='${pageSlug}'`,
    });

    if (pages.length === 0) return null;
    const pageId = pages[0].recordId;

    // 2. Ищем мета-данные, связанные с этой страницей и этой локалью
    const seoRecords = await fetchTable("Page Meta Translations", {
      filterByFormula: `AND({page_id_hidden}='${pageId}', {locale_id_hidden}='${localeRecordId}')`,
    });

    if (seoRecords.length === 0) return null;
    const fields = seoRecords[0];

    return {
      title: fields["title-tag"],
      description: fields["meta_description"],
      keywords: fields["key_words"],
      ogImage: fields["open_graph"]?.[0]?.url || null,
    };
  } catch (error) {
    return null;
  }
}