// api/submit-brief.js
import nodemailer from "nodemailer";

export default async function handler(req, res) {
  // 1. Ограничение метода
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  // 2. Получение данных из payload
  const {
    name,
    email,
    role,
    telegram,
    selected_services, // Массив recordId из таблицы Services
    currency_id, // recordId из таблицы Currencies
    locale_id, // recordId из таблицы Locales
    project_data, // Объект со всеми деталями проекта (название, ссылки, бюджет, сроки)
    captchaToken,
  } = req.body;

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
    // 3. Проверка reCAPTCHA (защита от ботов и лишних запросов)
    const captchaVerify = await fetch(
      `https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHA_SECRET_KEY}&response=${captchaToken}`,
      { method: "POST" }
    );
    const captchaData = await captchaVerify.json();

    if (!captchaData.success || captchaData.score < 0.5) {
      return res.status(403).json({ message: "Security check failed" });
    }

    // Валидация базовых полей
    if (!email || !email.includes("@") || !name) {
      return res.status(400).json({ message: "Invalid input data" });
    }

    const cleanName = name.trim();
    const cleanEmail = email.toLowerCase().trim();

    // 4. Создание записи в таблице "Brief Leads"
    // Используем структуру из ТЗ: name, role, email, telegram, locale, selected_services, currency, project_data_json [cite: 19]
    const briefRes = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Brief%20Leads`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: {
            name: cleanName,
            role: role || "",
            email: cleanEmail,
            telegram: telegram || "",
            locale: locale_id ? [locale_id] : [],
            selected_services: selected_services || [],
            currency: currency_id ? [currency_id] : [],
            project_data_json: JSON.stringify(project_data),
          },
        }),
      }
    );

    if (!briefRes.ok) {
      const errorText = await briefRes.text();
      throw new Error(`Airtable Brief Lead Error: ${errorText}`);
    }

    // 5. Поиск шаблона и названий выбранных услуг (из Service Translations)
    const templateFormula = `AND({locale_id_hidden} = '${locale_id}', SEARCH("Brief Lead", {title}))`;

    // Формула для поиска переводов выбранных услуг для конкретной локали
    const servicesFormula =
      selected_services?.length > 0
        ? `AND({locale_id_hidden} = '${locale_id}', OR(${selected_services
            .map((id) => `{service_id_hidden} = '${id}'`)
            .join(",")}))`
        : "FALSE()";

    const [tRes, sNamesRes] = await Promise.all([
      fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Response%20Templates?filterByFormula=${encodeURIComponent(
          templateFormula
        )}`,
        { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
      ),
      fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Service%20Translations?filterByFormula=${encodeURIComponent(
          servicesFormula
        )}&fields[]=title`,
        { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
      ),
    ]);

    const tData = await tRes.json();
    const sNamesData = await sNamesRes.json();

    // Получаем названия из таблицы Service Translations
    const serviceTitles = sNamesData.records?.map((r) => r.fields.title) || [];

    // 6. Отправка письма
    if (tData.records && tData.records.length > 0) {
      const template = tData.records[0].fields;
      const isRu = template.title?.toLowerCase().includes("ru");

      const labels = isRu
        ? {
            secServices: "1. Выбранные услуги",
            secProject: "2. Детали проекта",
            secUser: "3. Ваши данные",
            fields: {
              projectName: "Название компании/проекта",
              projectSite: "Ссылка на сайт",
              projectBusiness: "Отрасль",
              projectBrief: "Бриф / ТЗ",
              projectBrandbook: "Брендбук",
              projectFigma: "Figma",
              projectDeadline: "Сроки",
              projectBudget: "Бюджет",
              projectMessage: "Сообщение по проекту",
              userName: "Имя",
              userRole: "Роль",
              userEmail: "Email",
              userTelegram: "Telegram",
              userMessage: "Дополнительно",
            },
          }
        : {
            secServices: "1. Selected Services",
            secProject: "2. Project Details",
            secUser: "3. Your Details",
            fields: {
              projectName: "Company/project Name",
              projectSite: "Website Link",
              projectBusiness: "Industry",
              projectBrief: "Brief / TOU",
              projectBrandbook: "Brandbook",
              projectFigma: "Figma",
              projectDeadline: "Timeline",
              projectBudget: "Budget",
              projectMessage: "Project Message",
              userName: "Name",
              userRole: "Role",
              userEmail: "Email",
              userTelegram: "Telegram",
              userMessage: "Additional Message",
            },
          };

      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT),
        secure: true,
        auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
      });

      const row = (label, value) =>
        value
          ? `
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: 600; width: 180px; color: #666; font-size: 13px; vertical-align: top;">${label}:</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-size: 14px; vertical-align: top;">${value}</td>
        </tr>`
          : "";

      const link = (url, text) =>
        url
          ? `<a href="${url}" style="color: #000; text-decoration: underline;">${text}</a>`
          : "";

      const detailsHtml = `
        <div style="margin-top: 25px; background: #fff; border: 1px solid #eee; overflow: hidden;">
          <div style="background: #fcfcfc; padding: 12px 20px; border-bottom: 1px solid #eee;">
            <strong style="text-transform: uppercase; font-size: 12px; letter-spacing: 1px;">${
              labels.secServices
            }</strong>
          </div>
          <div style="padding: 0 20px 20px;">
            <p style="font-size: 14px;">${serviceTitles.join(", ") || "—"}</p>
          </div>

          <div style="background: #fcfcfc; padding: 12px 20px; border-bottom: 1px solid #eee; border-top: 1px solid #eee;">
            <strong style="text-transform: uppercase; font-size: 12px; letter-spacing: 1px;">${
              labels.secProject
            }</strong>
          </div>
          <div style="padding: 10px 20px 20px;">
            <table style="width: 100%; border-collapse: collapse;">
              ${row(labels.fields.projectName, project_data.projectName)}
              ${row(
                labels.fields.projectSite,
                link(project_data.projectSiteLink, project_data.projectSiteLink)
              )}
              ${row(
                labels.fields.projectBusiness,
                project_data.projectBusiness
              )}
              ${row(
                labels.fields.projectBrief,
                link(project_data.projectBrief, "View Brief")
              )}
              ${row(
                labels.fields.projectBrandbook,
                link(project_data.projectBranbook, "View Brandbook")
              )}
              ${row(
                labels.fields.projectFigma,
                link(project_data.projectFigma, "Open Figma")
              )}
              ${row(
                labels.fields.projectDeadline,
                project_data.selected_deadline_text
              )}
              ${row(
                labels.fields.projectBudget,
                project_data.selected_budget_text
              )}
              ${row(
                labels.fields.projectMessage,
                project_data.projectMessage?.replace(/\n/g, "<br/>")
              )}
            </table>
          </div>

          <div style="background: #fcfcfc; padding: 12px 20px; border-bottom: 1px solid #eee; border-top: 1px solid #eee;">
            <strong style="text-transform: uppercase; font-size: 12px; letter-spacing: 1px;">${
              labels.secUser
            }</strong>
          </div>
          <div style="padding: 10px 20px 20px;">
            <table style="width: 100%; border-collapse: collapse;">
              ${row(labels.fields.userName, cleanName)}
              ${row(labels.fields.userRole, role)}
              ${row(labels.fields.userEmail, cleanEmail)}
              ${row(labels.fields.userTelegram, telegram)}
              ${row(
                labels.fields.userMessage,
                project_data.userMessage?.replace(/\n/g, "<br/>")
              )}
            </table>
          </div>
        </div>
      `;

      await transporter.sendMail({
        from: `"Florentseva" <${SMTP_USER}>`,
        to: cleanEmail,
        subject: template.subject,
        html: `
          <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 800px;">
            <p>${template.greeting} ${cleanName}!</p>
            <p>${
              template.message_body
                ? template.message_body.replace(/\n/g, "<br/>")
                : ""
            }</p>
            
            ${detailsHtml}

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
    }

    // 7. Отправка уведомления администратору
    const adminSubject = isRu ? "Новая заявка" : "New request";
    await transporter.sendMail({
      from: `"Florentseva System" <${SMTP_USER}>`,
      to: SMTP_USER,
      subject: `${adminSubject} — ${cleanName}`,
      html: `
          <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 800px;">
            <h1 style="font-size: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px;">
              ${adminSubject}
            </h1>
            ${detailsHtml}
          </div>
        `,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(">>> [Brief API Fatal Error]:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
}
