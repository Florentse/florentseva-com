// middleware.js

export async function middleware(req) {
  const url = new URL(req.url);
  const pathname = url.pathname;
  const userAgent = req.headers.get("user-agent") || "";

  const isBot = /TelegramBot|facebookexternalhit|WhatsApp|Twitterbot|Slackbot/i.test(userAgent);

  // Перехватываем ботов ТОЛЬКО на главной, чтобы обойти приоритет статики index.html
  if (isBot && (pathname === "/" || pathname === "/ru")) {
    const langCode = pathname === "/ru" ? "ru" : "en";
    const slug = "home";

    try {
      const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID } = process.env;
      
      const filter = `AND(ARRAYJOIN({page_slug})='${slug}', ARRAYJOIN({locale_code})='${langCode}')`;
      const airtableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Page%20Meta%20Translations?filterByFormula=${encodeURIComponent(filter)}&maxRecords=1`;

      const response = await fetch(airtableUrl, {
        headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
      });

      const data = await response.json();
      const fields = data.records?.[0]?.fields;

      if (fields) {
        const title = fields["title-tag"] || "Florentseva";
        const description = fields["meta_description"] || "";
        let ogImage = fields["open_graph"]?.[0]?.url || "https://florentseva.com/og-image.png";

        const html = `<!DOCTYPE html><html lang="${langCode}"><head><meta charset="UTF-8"><title>${title}</title><meta name="description" content="${description}"><meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta property="og:image" content="${ogImage}"><meta property="og:url" content="${url.href}"><meta name="twitter:card" content="summary_large_image"></head><body></body></html>`;

        return new Response(html, {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }
    } catch (e) {
      return; // В случае ошибки отдаем стандартный index.html
    }
  }

  // Редирект для людей: автоопределение языка на главной
  if (!isBot && pathname === "/") {
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