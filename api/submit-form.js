// api/submit-form.js
import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { name, email, service_id, locale_id, message, captchaToken } = req.body;

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
    const searchUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Contacts?filterByFormula=({email}='${email}')`;
    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
    });
    const searchData = await searchRes.json();

    let contactRecordId;

    if (searchData.records && searchData.records.length > 0) {
      contactRecordId = searchData.records[0].id;
    } else {
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
              email: email,
              name: name,
              locale: locale_id ? [locale_id] : [],
            },
          }),
        }
      );
      const newContact = await createContactRes.json();
      contactRecordId = newContact.id;
    }

    // 3. Создание заявки в таблице "Leads"
    const leadResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Leads`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: {
            name: name,
            email: email,
            service: service_id ? [service_id] : [], // Поле в единственном числе
            locale: locale_id ? [locale_id] : [],
            message: message,
            status: "New",
            date: new Date().toISOString(),
            contact: [contactRecordId],
          },
        }),
      }
    );

    if (!leadResponse.ok) throw new Error("Failed to save lead to Airtable");

    // 4. Получение шаблона письма и названия услуги
    const [templateRes, serviceTransRes] = await Promise.all([
      fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Response%20Templates?filterByFormula=({locale}='${locale_id}')`,
        { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
      ),
      fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Service%20Translations?filterByFormula=AND({services}='${service_id}', {locale}='${locale_id}')`,
        { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
      ),
    ]);

    const templateData = await templateRes.json();
    const serviceTransData = await serviceTransRes.json();

    if (templateData.records?.length > 0) {
      const template = templateData.records[0].fields;
      const serviceTitle = serviceTransData.records?.[0]?.fields?.title || "selected service";

      // 5. Отправка через SMTP (contact@florentseva.com)
      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: true,
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASSWORD,
        },
      });

      await transporter.sendMail({
        from: `"Tatiana Florentseva" <${SMTP_USER}>`,
        to: email,
        subject: template.subject,
        html: `
          <div style="font-family: sans-serif; color: #333;">
            <p>${template.greeting} ${name}!</p>
            <p>${template.topic_intro} <strong>${serviceTitle}</strong>. ${template.message_body}</p>
          </div>
        `,
      });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("API Error:", error.message);
    return res.status(500).json({ error: error.message });
  }
}