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

  try {
    // 3. Проверка reCAPTCHA
    const captchaVerify = await fetch(
      `https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHA_SECRET_KEY}&response=${captchaToken}`,
      { method: "POST" }
    );
    const captchaData = await captchaVerify.json();

    if (!captchaData.success || captchaData.score < 0.5) {
      return res.status(403).json({ message: "Security check failed" });
    }

    if (!email || !email.includes("@") || name.length > 100) {
      return res.status(400).json({ message: "Invalid input data" });
    }

    // Очистка данных от лишних пробелов (санитизация)
    const cleanName = name.trim();
    const cleanEmail = email.toLowerCase().trim();
    const cleanMessage = message ? message.slice(0, 5000) : "";

    // 4. Поиск или обновление контакта в Airtable
    const escapedEmail = cleanEmail.replace(/'/g, "\\'"); // Защита от инъекций в формулу
    const searchUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Contacts?filterByFormula=({email}='${escapedEmail}')`;
    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
    });
    const searchData = await searchRes.json();

    let contactRecordId = searchData.records?.[0]?.id;

    if (contactRecordId) {
      await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Contacts/${contactRecordId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${AIRTABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fields: { name: cleanName, locale: locale_id ? [locale_id] : [] },
          }),
        }
      );
    } else {
      const createRes = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Contacts`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${AIRTABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fields: {
              name: cleanName,
              email: cleanEmail,
              locale: locale_id ? [locale_id] : [],
            },
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
            name: cleanName,
            email: cleanEmail,
            message: cleanMessage,
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

    // 6. Поиск шаблона письма и перевода услуги (используем новые Lookup-поля)
    const templateFormula = `({locale_id_hidden}='${locale_id}')`;
    const transFormula = `AND({service_id_hidden}='${service_id}', {locale_id_hidden}='${locale_id}')`;

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

    // 7. Отправка письма, если шаблон найден
    if (tData.records && tData.records.length > 0) {
      const template = tData.records[0].fields;
      const isRu = template.title?.toLowerCase().includes("ru");

      const serviceTitle =
        sData.records?.[0]?.fields?.title ||
        (isRu ? "выбранная услуга" : "selected service");

      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT),
        secure: true,
        auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
      });

      const labels = isRu
        ? {
            name: "Имя",
            email: "Email",
            topic: "Тема вопроса",
            message: "Вопрос",
            adminSubject: "Новый вопрос",
          }
        : {
            name: "Name",
            email: "Email",
            topic: "Topic",
            message: "Question",
            adminSubject: "New Question",
          };

      const row = (label, value, isLast = false) =>
        value
          ? `<tr>
            <td style="padding: 10px 0; ${
              isLast ? "" : "border-bottom: 1px solid #eee;"
            } font-weight: 600; width: 160px; color: #777; font-size: 12px; text-transform: uppercase; vertical-align: top;">${label}:</td>
            <td style="padding: 10px 0; ${
              isLast ? "" : "border-bottom: 1px solid #eee;"
            } font-size: 14px; color: #111; word-break: break-all;">${value}</td>
          </tr>`
          : "";

      const detailsHtml = `
        <div style="background: #ffffff; border: 1px solid #e0e0e0; overflow: hidden; margin: 20px 0; text-align: left;">
          <div style="padding: 10px 20px;">
            <table style="width: 100%; border-collapse: collapse; text-align: left;">
              ${row(labels.name, cleanName)}
              ${row(
                labels.email,
                `<a href="mailto:${cleanEmail}" style="color: #0066cc;">${cleanEmail}</a>`
              )}
              ${row(labels.topic, serviceTitle)}
              ${row(labels.message, cleanMessage.replace(/\n/g, "<br/>"), true)}
            </table>
          </div>
        </div>
      `;

      // А. Письмо пользователю
      await transporter.sendMail({
        from: `"Florentseva" <${SMTP_USER}>`,
        to: email,
        subject: template.subject,
        html: `
          <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 800px; text-align: left;">
            <p>${template.greeting} ${name}!</p>
            <p>
              ${template.topic_intro} <strong>${serviceTitle}</strong> ${
          template.message_body
            ? template.message_body.replace(/\n/g, "<br/>")
            : ""
        }
            </p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <div style="font-size: 12px; color: #777; margin-bottom: 10px;">
                ${
                  template.footer ? template.footer.replace(/\n/g, "<br/>") : ""
                }
              </div>
              <a href="https://florentseva.com" style="font-size: 13px; color: #000; text-decoration: none; font-weight: 600;">florentseva.com</a>
            </div>
          </div>
        `,
      });

      // Б. Письмо администратору
      await transporter.sendMail({
        from: `"System" <${SMTP_USER}>`,
        to: "contact@florentseva.com",
        replyTo: cleanEmail,
        subject: `[CONTACT] ${labels.adminSubject}: ${cleanName}`,
        html: `
          <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 800px; text-align: left;">
            ${detailsHtml}
          </div>
        `,
      });
    }

    // 8. Финальный ответ
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(">>> [Fatal Error]:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
}
