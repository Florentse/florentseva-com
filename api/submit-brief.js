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

    // 6. Отправка писем (внутри блока проверки шаблона)
    if (tData.records && tData.records.length > 0) {
      const template = tData.records[0].fields;
      const isRu = template.title?.toLowerCase().includes("ru");

      const labels = isRu
        ? {
            adminNotify: "Уведомление о новом брифе",
            secServices: "1. Выбранные услуги",
            secProject: "2. Детали проекта",
            secUser: "3. Данные клиента",
            fields: {
              projectName: "Проект",
              projectSite: "Сайт",
              projectBusiness: "Отрасль",
              projectBrief: "Бриф / ТЗ",
              projectBrandbook: "Брендбук",
              projectFigma: "Figma",
              projectDeadline: "Сроки",
              projectBudget: "Бюджет",
              projectMessage: "Сообщение",
              userName: "Имя",
              userRole: "Роль",
              userEmail: "Email",
              userTelegram: "Telegram",
              userMessage: "Доп. инфо",
            },
          }
        : {
            adminNotify: "New Brief Notification",
            secServices: "1. Selected Services",
            secProject: "2. Project Details",
            secUser: "3. User Details",
            fields: {
              projectName: "Project",
              projectSite: "Website",
              projectBusiness: "Industry",
              projectBrief: "Brief / TOU",
              projectBrandbook: "Brandbook",
              projectFigma: "Figma",
              projectDeadline: "Timeline",
              projectBudget: "Budget",
              projectMessage: "Message",
              userName: "Name",
              userRole: "Role",
              userEmail: "Email",
              userTelegram: "Telegram",
              userMessage: "Additional",
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
          ? `<tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: 600; width: 160px; color: #777; font-size: 12px; text-transform: uppercase;">${label}:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-size: 14px; color: #111;">${value}</td>
            </tr>`
          : "";

      const link = (url, text) =>
        url
          ? `<a href="${url}" style="color: #0066cc; text-decoration: none; font-weight: 500;">${text} →</a>`
          : "";

      const detailsHtml = `
        <div style="background: #ffffff; border: 1px solid #e0e0e0; border-radius: 4px; overflow: hidden; margin: 20px 0;">
          <div style="background: #f8f8f8; padding: 12px 20px; border-bottom: 1px solid #eee;">
            <span style="font-size: 11px; font-weight: 700; letter-spacing: 1px; color: #999; text-transform: uppercase;">${
              labels.secServices
            }</span>
          </div>
          <div style="padding: 15px 20px; font-size: 15px; font-weight: 500;">${
            serviceTitles.join(", ") || "—"
          }</div>

          <div style="background: #f8f8f8; padding: 12px 20px; border-bottom: 1px solid #eee; border-top: 1px solid #eee;">
            <span style="font-size: 11px; font-weight: 700; letter-spacing: 1px; color: #999; text-transform: uppercase;">${
              labels.secProject
            }</span>
          </div>
          <div style="padding: 5px 20px 15px;">
            <table style="width: 100%; border-collapse: collapse;">
              ${row(labels.fields.projectName, project_data.projectName)}
              ${row(
                labels.fields.projectSite,
                link(project_data.projectSiteLink, "Open Site")
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

          <div style="background: #f8f8f8; padding: 12px 20px; border-bottom: 1px solid #eee; border-top: 1px solid #eee;">
            <span style="font-size: 11px; font-weight: 700; letter-spacing: 1px; color: #999; text-transform: uppercase;">${
              labels.secUser
            }</span>
          </div>
          <div style="padding: 5px 20px 15px;">
            <table style="width: 100%; border-collapse: collapse;">
              ${row(labels.fields.userName, cleanName)}
              ${row(labels.fields.userRole, role)}
              ${row(
                labels.fields.userEmail,
                `<a href="mailto:${cleanEmail}" style="color: #0066cc;">${cleanEmail}</a>`
              )}
              ${row(labels.fields.userTelegram, telegram)}
              ${row(
                labels.fields.userMessage,
                project_data.userMessage?.replace(/\n/g, "<br/>")
              )}
            </table>
          </div>
        </div>
      `;

      // 1. Письмо пользователю
      await transporter.sendMail({
        from: `"Florentseva" <${SMTP_USER}>`,
        to: cleanEmail,
        subject: template.subject,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
            <p style="font-size: 16px;">${template.greeting} ${cleanName}!</p>
            <p style="font-size: 16px;">${
              template.message_body
                ? template.message_body.replace(/\n/g, "<br/>")
                : ""
            }</p>
            ${detailsHtml}
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
              <div style="font-size: 12px; color: #999; margin-bottom: 10px;">${template.footer?.replace(
                /\n/g,
                "<br/>"
              )}</div>
              <a href="https://florentseva.com" style="font-size: 14px; color: #000; text-decoration: none; font-weight: 600;">florentseva.com</a>
            </div>
          </div>
        `,
      });

      // 2. Уведомление администратору (внутри того же блока)
      const adminSubject = isRu ? "Новая заявка" : "New request";
      await transporter.sendMail({
        from: `"System" <${SMTP_USER}>`,
        to: SMTP_USER,
        subject: `[BRIEF] ${adminSubject}: ${cleanName}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; background: #fff; padding: 20px;">
            <h2 style="font-size: 18px; color: #000; margin-bottom: 10px;">${labels.adminNotify}</h2>
            <p style="font-size: 14px; color: #666;">Поступил новый бриф от <b>${cleanName}</b> (${cleanEmail}).</p>
            ${detailsHtml}
            <div style="font-size: 11px; color: #ccc; margin-top: 20px;">Sent from florentseva.com system</div>
          </div>
        `,
      });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(">>> [Brief API Fatal Error]:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
}
