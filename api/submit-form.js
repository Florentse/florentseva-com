import nodemailer from "nodemailer";

export default async function handler(req, res) {
  // 1. Ограничение метода
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  // 2. Получение данных из payload
  const { name, email, service, locale, message, captchaToken } = req.body;
  const service_id = service?.[0];
  const locale_id = locale?.[0];

  const {
    AIRTABLE_API_KEY,
    AIRTABLE_BASE_ID,
    RECAPTCHA_SECRET_KEY,
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASSWORD,
  } = process.env;

  console.log(">>> [API Start] Получен запрос от:", email);

  try {
    // 3. Проверка reCAPTCHA
    const captchaVerify = await fetch(
      `https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHA_SECRET_KEY}&response=${captchaToken}`,
      { method: "POST" }
    );
    const captchaData = await captchaVerify.json();

    if (!captchaData.success || captchaData.score < 0.5) {
      console.error(">>> [Auth Error] Капча не пройдена");
      return res.status(403).json({ message: "Security check failed" });
    }

    // 4. Поиск или создание контакта в Airtable
    const searchUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Contacts?filterByFormula=({email}='${email}')`;
    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
    });
    const searchData = await searchRes.json();

    let contactRecordId = searchData.records?.[0]?.id;

    if (!contactRecordId) {
      console.log(">>> [Airtable] Создаем новый контакт...");
      const createRes = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Contacts`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${AIRTABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fields: { name, email, locale: locale_id ? [locale_id] : [] },
          }),
        }
      );
      const newContact = await createRes.json();
      contactRecordId = newContact.id;
    }

    // 5. Создание Lead в Airtable
    const leadRes = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Leads`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: {
            name,
            email,
            message,
            service: service_id ? [service_id] : [],
            locale: locale_id ? [locale_id] : [],
            status: "New",
            date: new Date().toISOString(),
            contact: [contactRecordId],
          },
        }),
      }
    );

    if (!leadRes.ok) {
      const errorText = await leadRes.text();
      throw new Error(`Airtable Lead Error: ${errorText}`);
    }
    console.log(">>> [Airtable] Lead успешно создан");

    // 6. Поиск шаблона письма и перевода услуги (используем новые Lookup-поля)
    const templateFormula = `({locale_id_hidden}='${locale_id}')`;
    const transFormula = `AND({service_id_hidden}='${service_id}', {locale_id_hidden}='${locale_id}')`;

    console.log(">>> [Airtable] Новая формула шаблона:", templateFormula);
    console.log(">>> [Airtable] Новая формула перевода:", transFormula);

    const [tRes, sRes] = await Promise.all([
      fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Response%20Templates?filterByFormula=${encodeURIComponent(
          templateFormula
        )}`,
        {
          headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
        }
      ),
      fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Service%20Translations?filterByFormula=${encodeURIComponent(
          transFormula
        )}`,
        {
          headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
        }
      ),
    ]);

    const tData = await tRes.json();
    const sData = await sRes.json();

    // Эти логи теперь должны показать наличие записей
    console.log(
      ">>> [Airtable Raw] Шаблонов найдено:",
      tData.records?.length || 0
    );
    console.log(
      ">>> [Airtable Raw] Переводов найдено:",
      sData.records?.length || 0
    );

    // 7. Отправка письма, если шаблон найден
    if (tData.records && tData.records.length > 0) {
      const template = tData.records[0].fields;
      const serviceTitle =
        sData.records?.[0]?.fields?.title || "selected service";

      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT),
        secure: true,
        auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
      });

      await transporter.sendMail({
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
      console.log(">>> [Mail Success] Письмо отправлено на", email);
    }

    // 8. Финальный ответ
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(">>> [Fatal Error]:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
}
