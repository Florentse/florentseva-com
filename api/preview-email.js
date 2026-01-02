// api/preview-email.js
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  const { name, service, locale } = req.body;
  const service_id = service?.[0];
  const locale_id = locale?.[0];

  const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID } = process.env;

  try {
    // Поиск шаблона и перевода (та же логика, что в основном скрипте)
    const [tRes, sRes] = await Promise.all([
      fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Response%20Templates?filterByFormula=${encodeURIComponent(`({locale_id_hidden}='${locale_id}')`)}`, {
        headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
      }),
      fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Service%20Translations?filterByFormula=${encodeURIComponent(`AND({service_id_hidden}='${service_id}', {locale_id_hidden}='${locale_id}')`)}`, {
        headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
      })
    ]);

    const tData = await tRes.json();
    const sData = await sRes.json();

    if (tData.records?.length > 0) {
      const template = tData.records[0].fields;
      const serviceTitle = sData.records?.[0]?.fields?.title || "selected service";

      // Формируем HTML (добавляем футер, если он уже есть в Airtable)
      const htmlContent = `
        <div style="font-family: sans-serif; line-height: 1.6; color: #333; padding: 20px; border: 1px solid #eee;">
          <p>${template.greeting} ${name || '[Имя]'}!</p>
          <br/>
          <p>${template.topic_intro} <strong>${serviceTitle}</strong>. ${template.message_body}</p>
          <br/>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #777;">
            ${template.footer ? template.footer.replace(/\n/g, '<br/>') : ''}
          </div>
        </div>
      `;

      return res.status(200).json({ html: htmlContent });
    }

    return res.status(404).json({ message: "Template not found" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}