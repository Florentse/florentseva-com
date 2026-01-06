// api/bot-seo.js

export default async function handler(req, res) {
  const { url: originalUrl } = req.query;
  const url = new URL(originalUrl, `https://${req.headers.host}`);
  const pathname = url.pathname;

  const isRu = pathname.startsWith("/ru");
  const langCode = isRu ? "ru" : "en";

  // Определяем раздел страницы
  const isServicePage = pathname.includes('/services/');
  const isCasePage = pathname.includes('/cases/');

  // Извлекаем слаг
  let slug = pathname.replace(/^\/ru/, "").replace(/^\//, "") || "home";
  if (slug.includes("/")) slug = slug.split("/").pop();

  try {
    const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID } = process.env;

    // Конфигурация полей для каждого типа таблицы
    let config;
    if (isServicePage) {
      config = {
        table: "Service Translations",
        slugField: "{service_slug}", 
        titleField: "title",
        descField: "about_service"
      };
    } else if (isCasePage) {
      config = {
        table: "Case Translations",
        slugField: "{case_slug}",
        titleField: "case_title_lookup", // Lookup заголовка из таблицы Cases
        descField: "meta_description"
      };
    } else {
      config = {
        table: "Page Meta Translations",
        slugField: "{page_slug}",
        titleField: "title-tag",
        descField: "meta_description"
      };
    }

    // Формула поиска с учетом того, что lookup-поля — это массивы
    const filter = `AND(ARRAYJOIN(${config.slugField})='${slug}', ARRAYJOIN({locale_code})='${langCode}')`;
    const airtableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(config.table)}?filterByFormula=${encodeURIComponent(filter)}&maxRecords=1`;

    const response = await fetch(airtableUrl, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
    });

    const data = await response.json();
    const fields = data.records?.[0]?.fields;

    if (!fields) {
      return res.status(404).send(`SEO not found for ${slug}`);
    }

    const title = fields[config.titleField] || "Florentseva";
    const description = fields[config.descField] || "";
    
    let ogImage = "https://florentseva.com/og-image.png";
    if (Array.isArray(fields["open_graph"]) && fields["open_graph"][0]?.url) {
      ogImage = fields["open_graph"][0].url;
    } else if (fields["hero_image_lookup"]) { // Дополнительная проверка для кейсов
       ogImage = Array.isArray(fields["hero_image_lookup"]) ? fields["hero_image_lookup"][0].url : ogImage;
    }

    const html = `
      <!DOCTYPE html>
      <html lang="${langCode}">
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <meta name="description" content="${description}">
        <meta property="og:type" content="website">
        <meta property="og:title" content="${title}">
        <meta property="og:description" content="${description}">
        <meta property="og:image" content="${ogImage}">
        <meta property="og:url" content="${url.href}">
        <meta name="twitter:card" content="summary_large_image">
      </head>
      <body></body>
      </html>
    `.trim();

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate");
    return res.status(200).send(html);

  } catch (e) {
    return res.status(500).send("SEO Generation Error");
  }
}