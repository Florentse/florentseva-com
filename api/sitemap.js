// api/sitemap.js
import { fetch } from 'undici'; // или встроенный fetch в Node.js 18+

export default async function handler(req, res) {
  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const SITE_URL = "https://florentseva.com"; // Ваш домен

  try {
    // 1. Получаем все слаги услуг и кейсов параллельно
    const [servicesRes, casesRes] = await Promise.all([
      fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Services?fields%5B%5D=slug`, {
        headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
      }),
      fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Cases?fields%5B%5D=slug`, {
        headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
      })
    ]);

    const services = await servicesRes.json();
    const cases = await casesRes.json();

    // 2. Статические страницы
    const staticPages = [
      "",
      "/services",
      "/cases",
      "/about",
      "/contact",
      "/brief",
      "/privacy-policy"
    ];

    // 3. Формируем XML структуру
    let xml = `<?xml version="1.0" encoding="UTF-8"?>`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    // Добавляем статику
    staticPages.forEach(path => {
      xml += `<url><loc>${SITE_URL}${path}</loc><changefreq>weekly</changefreq></url>`;
    });

    // Добавляем динамические услуги
    services.records?.forEach(record => {
      if (record.fields.slug) {
        xml += `<url><loc>${SITE_URL}/services/${record.fields.slug}</loc><changefreq>monthly</changefreq></url>`;
      }
    });

    // Добавляем динамические кейсы
    cases.records?.forEach(record => {
      if (record.fields.slug) {
        xml += `<url><loc>${SITE_URL}/cases/${record.fields.slug}</loc><changefreq>monthly</changefreq></url>`;
      }
    });

    xml += `</urlset>`;

    res.setHeader("Content-Type", "text/xml");
    res.write(xml);
    res.end();
  } catch (e) {
    res.status(500).send("Error generating sitemap");
  }
}