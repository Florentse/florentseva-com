// middleware.js

export async function middleware(req) {
  const url = new URL(req.url);
  const pathname = url.pathname;
  const userAgent = req.headers.get('user-agent') || '';

  // 1. Пропускаем статические файлы
  if (pathname.includes('.')) return;

  // 2. Детекция ботов (Telegram, WhatsApp, Open Graph боты)
  const isBot = /TelegramBot|facebookexternalhit|WhatsApp|Twitterbot|Slackbot/i.test(userAgent);

  if (isBot) {
    const isRu = pathname.startsWith('/ru');
    const langCode = isRu ? 'ru' : 'en';
    
    // Извлекаем слаг страницы
    // /ru/services/web-design -> web-design
    // /services/web-design -> web-design
    // /ru -> home
    let slug = pathname.replace(/^\/ru/, '').replace(/^\//, '') || 'home';
    if (slug.includes('/')) {
        slug = slug.split('/').pop();
    }

    try {
      const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
      const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
      const tableName = encodeURIComponent("Page Meta Translations");

      // Фильтр: ищем запись, где PageSlug совпадает со слагом, а LocaleCode с языком
      // Убедитесь, что в Airtable есть колонки {PageSlug} и {LocaleCode}
      const filter = `AND({PageSlug}='${slug}', {LocaleCode}='${langCode}')`;
      const airtableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${tableName}?filterByFormula=${encodeURIComponent(filter)}&maxRecords=1`;

      const response = await fetch(airtableUrl, {
        headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
      });
      
      const data = await response.json();
      const fields = data.records?.[0]?.fields || {};

      // Формируем HTML с данными из Airtable
      const html = `
        <!DOCTYPE html>
        <html lang="${langCode}">
        <head>
          <meta charset="UTF-8">
          <title>${fields.title || "Florentseva"}</title>
          <meta name="description" content="${fields.description || ""}">
          <meta property="og:type" content="website">
          <meta property="og:url" content="${url.href}">
          <meta property="og:title" content="${fields.og_title || fields.title}">
          <meta property="og:description" content="${fields.og_description || fields.description}">
          <meta property="og:image" content="${fields.og_image || 'https://florentseva.com/og-image.png'}">
          <meta name="twitter:card" content="summary_large_image">
        </head>
        <body></body>
        </html>
      `.trim();

      return new Response(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    } catch (e) {
      // Если что-то пошло не так, Middleware просто пропустит запрос к обычному index.html
      console.error("Middleware Airtable Error:", e);
    }
  }

  // 3. Обычная логика редиректов (для пользователей)
  if (pathname.startsWith('/en')) {
    url.pathname = pathname.replace(/^\/en/, '') || '/';
    return Response.redirect(url);
  }

  if (pathname === '/') {
    const cookie = req.headers.get('cookie') || '';
    if (!cookie.includes('app_lang=')) {
      const acceptLang = req.headers.get('accept-language') || '';
      if (acceptLang.toLowerCase().startsWith('ru')) {
        url.pathname = '/ru';
        return Response.redirect(url);
      }
    }
  }
}