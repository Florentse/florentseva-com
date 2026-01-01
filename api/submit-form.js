// api/submit-form.js
import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { name, email, service_id, locale_id, message, captchaToken } =
    req.body;

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
    // 1. Проверка reCAPTCHA v3
    const captchaVerify = await fetch(
      `https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHA_SECRET_KEY}&response=${captchaToken}`,
      { method: "POST" }
    );
    const captchaData = await captchaVerify.json();

    if (!captchaData.success || captchaData.score < 0.5) {
      return res.status(403).json({ message: "Security check failed" });
    }

    // 2. Поиск или создание контакта в таблице "Contacts"
    // Ищем по Email через фильтр Airtable
    const searchUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Contacts?filterByFormula=({Email}='${email}')`;
    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
    });
    const searchData = await searchRes.json();

    let contactRecordId;

    if (searchData.records && searchData.records.length > 0) {
      // Контакт найден, берем его ID
      contactRecordId = searchData.records[0].id;
    } else {
      // Контакт не найден, создаем новый
      const createContactRes = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Contacts`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${AIRTABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fields: {
              Email: email,
              Name: name,
              Locale: locale_id ? [locale_id] : [],
              Type: "Lead",
            },
          }),
        }
      );
      const newContact = await createContactRes.json();
      contactRecordId = newContact.id;
    }

    // 3. Создание заявки в таблице "Leads" с привязкой к контакту
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Leads`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: {
            Name: name,
            Email: email,
            Service: service_id ? [service_id] : [],
            Locale: locale_id ? [locale_id] : [],
            Message: message,
            Status: "New",
            Date: new Date().toISOString(),
            Contact: [contactRecordId],
          },
        }),
      }
    );

    if (!response.ok) throw new Error("Failed to save lead");

    // 4. Получение шаблона письма и перевода услуги
    const [templateRes, serviceTransRes] = await Promise.all([
      fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Response%20Templates?filterByFormula=({Locale_ID_Text}='${locale_id}')`,
        {
          headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
        }
      ),
      fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Service%20Translations?filterByFormula=({Search_Key}='${service_id}-${locale_id}')`,
        {
          headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
        }
      ),
    ]);

    const templateData = await templateRes.json();
    const serviceTransData = await serviceTransRes.json();

    if (
      templateData.records?.length > 0 &&
      serviceTransData.records?.length > 0
    ) {
      const template = templateData.records[0].fields;
      const serviceTitle = serviceTransData.records[0].fields.title;

      // Сборка текста письма
      const emailHtml = `
        <p>${template.Greeting} ${name}!</p>
        <p>${template["Topic Intro"]} <strong>${serviceTitle}</strong> ${
        template["Message Body"]
      }</p>
        <hr />
        <p style="color: #666;">${template.Footer || ""}</p>
      `;

      // 5. Отправка через Beget SMTP
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: true, // true для порта 465
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });

      await transporter.sendMail({
        from: `"Tatiana Florentseva" <${process.env.SMTP_USER}>`,
        to: email,
        subject: template.Subject,
        html: emailHtml,
      });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
