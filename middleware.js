// middleware.js

export async function middleware(req) {
  const url = new URL(req.url);
  const pathname = url.pathname;
  const userAgent = req.headers.get("user-agent") || "";

  if (pathname.includes(".")) return;

  const isBot = /TelegramBot|facebookexternalhit|WhatsApp|Twitterbot|Slackbot/i.test(userAgent);

  if (isBot) {
    const isRu = pathname.startsWith("/ru");
    const langCode = isRu ? "ru" : "en";
    let slug = pathname.replace(/^\/ru/, "").replace(/^\//, "") || "home";
    if (slug.includes("/")) {
      slug = slug.split("/").pop();
    }

    try {
      const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
      const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
      const tableName = encodeURIComponent("Page Meta Translations");

      // Используем SEARCH для Lookup полей, так как они могут приходить как массивы
      const filter = `AND(SEARCH('${slug}', {page_slug}) > 0, SEARCH('${langCode}', {locale_code}) > 0)`;
      const airtableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${tableName}?filterByFormula=${encodeURIComponent(filter)}&maxRecords=1`;

      const response = await fetch(airtableUrl, {
        headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
        // Ограничиваем время ожидания, чтобы Edge-функция не висла
        signal: AbortSignal.timeout(4000) 
      });

      const data = await response.json();
      const fields = data.records?.[0]?.fields;

      if (fields) {
        const title = fields["title-tag"] || "Florentseva";
        const description = fields["meta_description"] || "";
        
        let ogImage = "https://florentseva.com/og-image.png";
        if (Array.isArray(fields["open_graph"]) && fields["open_graph"][0]?.url) {
          ogImage = fields["open_graph"][0].url;
        } else if (typeof fields["open_graph"] === "string") {
          ogImage = fields["open_graph"];
        }

        const html = `<!DOCTYPE html>
<html lang="${langCode}">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${url.href}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${ogImage}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="${ogImage}">
</head>
<body></body>
</html>`.trim();

        return new Response(html, {
          headers: { 
            "Content-Type": "text/html; charset=utf-8",
            "x-seo-status": "dynamic-hit" // Метка для проверки
          },
        });
      }
    } catch (e) {
      // Ошибка будет видна в логах Vercel (Deployment -> Logs)
      console.error("Middleware Airtable Error:", e.message);
    }
  }

  // Логика редиректов для пользователей
  if (pathname.startsWith("/en")) {
    url.pathname = pathname.replace(/^\/en/, "") || "/";
    return Response.redirect(url);
  }

  if (pathname === "/") {
    const cookie = req.headers.get("cookie") || "";
    if (!cookie.includes("app_lang=")) {
      const acceptLang = req.headers.get("accept-language") || "";
      if (acceptLang.toLowerCase().startsWith("ru")) {
        url.pathname = "/ru";
        return Response.redirect(url);
      }
    }
  }
}