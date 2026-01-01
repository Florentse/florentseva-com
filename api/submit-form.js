// api/submit-form.js
import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  // 1. Получаем данные (теперь service в ед. числе, как на фронте)
  const { name, email, service, locale, message, captchaToken } = req.body;
  const service_id = service?.[0];
  const locale_id = locale?.[0];

  console.log(">>> [API Start] Данные получены:", { name, email, service_id, locale_id });

  const {
    AIRTABLE_API_KEY,
    AIRTABLE_BASE_ID,
    RECAPTCHA_SECRET_KEY,
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASSWORD,
  } = process.env;

  try {
    // 2. Проверка reCAPTCHA
    console.log(">>> [Auth] Проверка reCAPTCHA...");
    const captchaVerify = await fetch(
      `https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHA_SECRET_KEY}&response=${captchaToken}`,
      { method: "POST" }
    );
    const captchaData = await captchaVerify.json();
    console.log(">>> [Auth] Результат капчи:", captchaData.success, "Score:", captchaData.score);

    if (!captchaData.success || captchaData.score < 0.5) {
      return res.status(403).json({ message: "Security check failed" });
    }

    // 3. Поиск или создание контакта
    const searchUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Contacts?filterByFormula=({email}='${email}')`;
    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
    });
    const searchData = await searchRes.json();

    let contactRecordId;
    if (searchData.records?.length > 0) {
      contactRecordId = searchData.records[0].id;
      console.log(">>> [Airtable] Контакт найден:", contactRecordId);
    } else {
      console.log(">>> [Airtable] Создаем новый контакт...");
      const createContactRes = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Contacts`, {
        method: "POST",
        headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: { email, name, locale: locale_id ? [locale_id] : [] }
        }),
      });
      const newContact = await createContactRes.json();
      contactRecordId = newContact.id;
      console.log(">>> [Airtable] Контакт создан:", contactRecordId);
    }

    // 4. Создание Lead
    console.log(">>> [Airtable] Создаем Lead...");
    const leadResponse = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Leads`, {
      method: "POST",
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        fields: {
          name, email, message,
          service: service_id ? [service_id] : [], // Поле в Leads (ед. число)
          locale: locale_id ? [locale_id] : [],
          status: "New",
          date: new Date().toISOString(),
          contact: [contactRecordId],
        },
      }),
    });

    if (!leadResponse.ok) {
      const errorText = await leadResponse.text();
      console.error(">>> [Airtable Error] Ошибка Leads:", errorText);
      throw new Error("Failed to save lead");
    }
    console.log(">>> [Airtable] Lead успешно создан");

    // 5. Поиск шаблона и названия услуги
    // ВАЖНО: в Service Translations поле называется 'services' (мн. число)
    const templateFormula = `({locale}='${locale_id}')`;
    const transFormula = `AND({services}='${service_id}', {locale}='${locale_id}')`;

    console.log(">>> [Airtable] Поиск шаблона...");
    const [templateRes, serviceTransRes] = await Promise.all([
      fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Response%20Templates?filterByFormula=${encodeURIComponent(templateFormula)}`,
        { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }),
      fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Service%20Translations?filterByFormula=${encodeURIComponent(transFormula)}`,
        { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }),
    ]);

    const templateData = await templateRes.json();
    const serviceTransData = await serviceTransRes.json();

    console.log(">>> [Airtable] Найдено шаблонов:", templateData.records?.length || 0);
    console.log(">>> [Airtable] Найдено переводов услуги:", serviceTransData.records?.length || 0);

    if (templateData.records?.length > 0) {
      const template = templateData.records[0].fields;
      const serviceTitle = serviceTransData.records?.[0]?.fields?.title || "selected service";

      console.log(">>> [Mail] Начинаем отправку письма...");

      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: true,
        auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
      });

      // Проверка связи с почтовым сервером
      await transporter.verify();
      console.log(">>> [Mail] SMTP сервер готов");

      const info = await transporter.sendMail({
        from: `"Tatiana Florentseva" <${SMTP_USER}>`,
        to: email,
        subject: template.subject,
        html: `
          <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
            <p>${template.greeting} ${name}!</p>
            <p>${template.topic_intro} <strong>${serviceTitle}</strong>. ${template.message_body}</p>
          </div>
        `,
      });

      console.log(">>> [Mail Success] Письмо отправлено! ID:", info.messageId);
    } else {
      console.warn(">>> [Mail Skip] Шаблон не найден. Письмо не будет отправлено.");
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(">>> [Fatal Error]:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
}