// api/bot-seo.js

export default async function handler(req, res) {
  const { url: originalUrl } = req.query;
  const url = new URL(originalUrl, `https://${req.headers.host}`);
  const pathname = url.pathname;

  const isRu = pathname.startsWith("/ru");
  const langCode = isRu ? "ru" : "en";
  
  // Извлекаем слаг (home, services, и т.д.)
  let slug = pathname.replace(/^\/ru/, "").replace(/^\//, "") || "home";
  if (slug.includes("/")) slug = slug.split("/").pop();

  try {
    const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID } = process.env;
    const filter = `AND(SEARCH('${slug}', {page_slug}) > 0, SEARCH('${langCode}', {locale_code}) > 0)`;
    const airtableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Page%20Meta%20Translations?filterByFormula=${encodeURIComponent(filter)}&maxRecords=1`;

    const response = await fetch(airtableUrl, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
    });

    const data = await response.json();
    const fields = data.records?.[0]?.fields;

    if (!fields) {
      // Если в базе нет — отдаем пустую страницу, Vercel подхватит дефолт
      return res.status(404).send("Not found in Airtable");
    }

    const title = fields["title-tag"] || "Florentseva";
    const description = fields["meta_description"] || "";
    
    let ogImage = "https://florentseva.com/og-image.png";
    if (Array.isArray(fields["open_graph"]) && fields["open_graph"][0]?.url) {
      ogImage = fields["open_graph"][0].url;
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
    return res.status(500).send("Internal Error");
  }
}