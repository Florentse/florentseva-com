// middleware.js

export async function middleware(req) {
  const url = new URL(req.url);
  const pathname = url.pathname;
  const userAgent = req.headers.get("user-agent") || "";

  // Пропускаем только расширения (картинки, скрипты), но НЕ папки /ru/
  if (pathname.includes('.') && !pathname.startsWith('/ru')) return;

  // 1. Упрощаем проверку бота для теста
  const isBot = /bot|telegram|facebook|whatsapp|twitter|slack/i.test(userAgent);

  // 2. ДОБАВЛЯЕМ ЖЕСТКИЙ ДЕБАГ (будет виден в curl всем)
  const debugHeaders = {
    "x-middleware-alive": "true",
    "x-debug-ua": userAgent,
    "x-debug-bot": isBot.toString()
  };

  if (isBot) {
    const isRu = pathname.startsWith("/ru");
    const langCode = isRu ? "ru" : "en";
    let slug = pathname.replace(/^\/ru/, "").replace(/^\//, "") || "home";
    if (slug.includes("/")) slug = slug.split("/").pop();

    try {
      const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID } = process.env;

      if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
        return new Response("Config Missing", { 
          headers: { ...debugHeaders, "x-seo-status": "error-env-missing" } 
        });
      }

      const filter = `AND(SEARCH('${slug}', {page_slug}) > 0, SEARCH('${langCode}', {locale_code}) > 0)`;
      const airtableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Page%20Meta%20Translations?filterByFormula=${encodeURIComponent(filter)}&maxRecords=1`;

      const response = await fetch(airtableUrl, {
        headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
      });

      const data = await response.json();
      const fields = data.records?.[0]?.fields;

      if (!fields) {
        return new Response("Not found in Airtable", {
          headers: { 
            ...debugHeaders,
            "x-seo-status": "airtable-empty",
            "x-debug-slug": slug
          }
        });
      }

      const title = fields["title-tag"] || "Florentseva";
      const description = fields["meta_description"] || "";
      let ogImage = fields["open_graph"]?.[0]?.url || "https://florentseva.com/og-image.png";

      const html = `<!DOCTYPE html><html lang="${langCode}"><head><meta charset="UTF-8"><title>${title}</title><meta name="description" content="${description}"><meta property="og:title" content="${title}"><meta property="og:image" content="${ogImage}"></head><body></body></html>`;

      return new Response(html, {
        headers: { 
          ...debugHeaders,
          "Content-Type": "text/html; charset=utf-8",
          "x-seo-status": "dynamic-hit"
        },
      });
    } catch (e) {
      return new Response("Error", { 
        headers: { ...debugHeaders, "x-seo-status": "middleware-crash", "x-error": e.message } 
      });
    }
  }

  // Для обычных юзеров просто добавляем заголовок "alive", чтобы знать, что Middleware работает
  const res = Response.next ? undefined : null; // В среде Vercel Edge просто выходим
  
  // Если это не бот, мы позволяем Vercel продолжить рендеринг, но в curl мы увидим x-middleware-alive
  return new Response(null, { headers: debugHeaders }); 
}