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

    // 5. Поиск шаблона письма именно для брифа (Brief Lead - EN/RU)
    const templateFormula = `AND({locale_id_hidden} = '${locale_id}', SEARCH("Brief Lead", {title}))`;

    const tRes = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Response%20Templates?filterByFormula=${encodeURIComponent(
        templateFormula
      )}`,
      {
        headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
      }
    );

    const tData = await tRes.json();

    // 6. Отправка письма, если шаблон найден
    if (tData.records && tData.records.length > 0) {
      const template = tData.records[0].fields;

      // Определяем язык для заголовков в письме на основе заголовка шаблона
      const isRu = template.title?.toLowerCase().includes("ru");
      const labels = isRu
        ? {
            contactInfo: "Контактная информация",
            projectInfo: "Детали проекта",
            name: "Имя",
            role: "Роль",
            telegram: "Telegram",
            projectName: "Проект",
            industry: "Отрасль",
            site: "Сайт",
            budget: "Бюджет",
            deadline: "Сроки",
            links: "Ссылки (Бриф/Брендбук/Figma)",
            message: "Сообщение",
          }
        : {
            contactInfo: "Contact Information",
            projectInfo: "Project Details",
            name: "Name",
            role: "Role",
            telegram: "Telegram",
            projectName: "Project",
            industry: "Industry",
            site: "Website",
            budget: "Budget",
            deadline: "Timeline",
            links: "Links (Brief/Brandbook/Figma)",
            message: "Message",
          };

      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT),
        secure: true,
        auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
      });

      // Формируем блок с данными проекта
      const infoStyle =
        "padding: 8px 0; border-bottom: 1px solid #eee; vertical-align: top;";
      const labelStyle = "font-weight: 600; width: 150px; color: #666;";

      const detailsHtml = `
        <div style="margin-top: 25px; background: #f9f9f9; padding: 20px; border-radius: 8px;">
          <h3 style="margin-top: 0; font-size: 16px; border-bottom: 2px solid #000; padding-bottom: 8px;">${
            labels.contactInfo
          }</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr><td style="${labelStyle}">${
        labels.name
      }:</td><td style="${infoStyle}">${cleanName}</td></tr>
            ${
              role
                ? `<tr><td style="${labelStyle}">${labels.role}:</td><td style="${infoStyle}">${role}</td></tr>`
                : ""
            }
            ${
              telegram
                ? `<tr><td style="${labelStyle}">${labels.telegram}:</td><td style="${infoStyle}">${telegram}</td></tr>`
                : ""
            }
          </table>

          <h3 style="margin-top: 20px; font-size: 16px; border-bottom: 2px solid #000; padding-bottom: 8px;">${
            labels.projectInfo
          }</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr><td style="${labelStyle}">${
        labels.projectName
      }:</td><td style="${infoStyle}">${project_data.projectName}</td></tr>
            ${
              project_data.projectBusiness
                ? `<tr><td style="${labelStyle}">${labels.industry}:</td><td style="${infoStyle}">${project_data.projectBusiness}</td></tr>`
                : ""
            }
            ${
              project_data.projectSiteLink
                ? `<tr><td style="${labelStyle}">${labels.site}:</td><td style="${infoStyle}">${project_data.projectSiteLink}</td></tr>`
                : ""
            }
            <tr><td style="${labelStyle}">${
        labels.budget
      }:</td><td style="${infoStyle}">${
        project_data.selected_budget_text || "—"
      }</td></tr>
            <tr><td style="${labelStyle}">${
        labels.deadline
      }:</td><td style="${infoStyle}">${
        project_data.selected_deadline_text || "—"
      }</td></tr>
            ${
              project_data.projectBrief ||
              project_data.projectBranbook ||
              project_data.projectFigma
                ? `
              <tr>
                <td style="${labelStyle}">${labels.links}:</td>
                <td style="${infoStyle}">
                  ${
                    project_data.projectBrief
                      ? `<a href="${project_data.projectBrief}">Brief</a> `
                      : ""
                  }
                  ${
                    project_data.projectBranbook
                      ? `<a href="${project_data.projectBranbook}">Brandbook</a> `
                      : ""
                  }
                  ${
                    project_data.projectFigma
                      ? `<a href="${project_data.projectFigma}">Figma</a>`
                      : ""
                  }
                </td>
              </tr>`
                : ""
            }
            ${
              project_data.projectMessage
                ? `<tr><td style="${labelStyle}">${
                    labels.message
                  }:</td><td style="${infoStyle}">${project_data.projectMessage.replace(
                    /\n/g,
                    "<br/>"
                  )}</td></tr>`
                : ""
            }
          </table>
        </div>
      `;

      await transporter.sendMail({
        from: `"Florentseva" <${SMTP_USER}>`,
        to: cleanEmail,
        subject: template.subject,
        html: `
          <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 800px;">
            <p>${template.greeting} ${cleanName}!</p>
            <p>
              ${
                template.message_body
                  ? template.message_body.replace(/\n/g, "<br/>")
                  : ""
              }
            </p>
            
            ${detailsHtml}

            <br/>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <div style="font-size: 12px; color: #777; margin-bottom: 10px;">
                ${
                  template.footer ? template.footer.replace(/\n/g, "<br/>") : ""
                }
              </div>
              <a href="https://florentseva.com" 
                 style="font-size: 13px; color: #000; text-decoration: none; font-weight: 600; border-bottom: 1px solid #000; padding-bottom: 2px;">
                florentseva.com
              </a>
            </div>
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
