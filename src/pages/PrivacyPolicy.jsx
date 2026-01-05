import React from "react";
import useLocaleCurrent from "../hooks/useLocaleCurrent";

import usePageSeo from "../hooks/usePageSeo";
import Seo from "../components/Seo";
import "./PrivacyPolicy.css";

const CONTENT = {
  ru: {
    title: "Политика конфиденциальности",
    lastUpdated: "Последнее обновление: 5 января 2026 г.",
    sections: [
      {
        h2: "1. Общие положения",
        p: "Настоящая политика обработки персональных данных составлена в соответствии с требованиями Федерального закона от 27.07.2006. №152-ФЗ «О персональных данных» и Общего регламента по защите данных (GDPR). Оператором данных является самозанятая Флоренцева Татьяна (далее — Оператор).",
      },
      {
        h2: "2. Сбор и обработка данных",
        p: "Сайт собирает и обрабатывает информацию, которую Пользователь добровольно предоставляет через формы брифа и обратной связи: имя, email, роль в проекте, никнейм в Telegram, а также сведения о бизнесе и проекте. Также на Сайте используются файлы «cookie» и сервисы веб-аналитики для сбора обезличенных данных о поведении пользователей.",
      },
      {
        h2: "3. Цели использования",
        p: "Персональные данные используются исключительно для связи с Пользователем, обсуждения деталей проекта, расчета предварительного бюджета в выбранной валюте (RUB, USD, EUR) и повышения удобства работы с Сайтом.",
      },
      {
        h2: "4. Защита и безопасность",
        p: "Оператор использует защищенные системы управления данными и современные методы шифрования для организации и хранения информации. Технические меры направлены на предотвращение несанкционированного доступа или утечки данных.",
      },
      {
        h2: "5. Передача третьим лицам",
        p: "Данные Пользователя не передаются третьим лицам в маркетинговых целях. Использование сторонних инструментов (системы аналитики или защита от спама Google reCAPTCHA) регулируется политиками конфиденциальности соответствующих провайдеров.",
      },
      {
        h2: "6. Права пользователя",
        p: "Пользователь имеет право на доступ к своим данным, их исправление или полное удаление из систем. Для реализации этих прав достаточно направить запрос на электронную почту: contact@florentseva.com.",
      },
      {
        h2: "7. Изменения политики",
        p: "Оператор оставляет за собой право вносить изменения в настоящую Политику в любое время. Новая редакция вступает в силу с момента ее размещения на Сайте. Пользователям рекомендуется периодически проверять данную страницу на предмет обновлений.",
      },
    ],
  },
  en: {
    title: "Privacy Policy",
    lastUpdated: "Last Updated: January 5, 2026",
    sections: [
      {
        h2: "1. General Information",
        p: "This Privacy Policy is designed to comply with the General Data Protection Regulation (GDPR) and relevant data protection laws. The data controller is Tatiana Florentseva (Self-employed status).",
      },
      {
        h2: "2. Data Collection",
        p: "The Website collects and processes information provided voluntarily via project brief and contact forms, including name, email, project role, Telegram handle, and business details. The Website also uses cookies and web analytics to gather anonymized information about user interactions.",
      },
      {
        h2: "3. How Data is Used",
        p: "Personal data is used solely to maintain communication, discuss project specifics, calculate estimates in selected currencies (RUB, USD, EUR), and optimize the user experience on the Website.",
      },
      {
        h2: "4. Data Storage and Security",
        p: "The Operator utilizes secure data management systems and modern encryption methods to organize and protect information. Technical measures are in place to prevent unauthorized access or data breaches.",
      },
      {
        h2: "5. Third-Party Services",
        p: "User data is not sold or shared with third parties for marketing purposes. The use of third-party tools, such as analytics providers or Google reCAPTCHA for spam protection, is subject to the respective providers' privacy terms.",
      },
      {
        h2: "6. Your Rights",
        p: "Users have the right to access, rectify, or request the deletion of their personal data at any time. To exercise these rights, please contact: contact@florentseva.com.",
      },
      {
        h2: "7. Changes to This Policy",
        p: "The Operator reserves the right to update or change this Privacy Policy at any time. Any changes will be effective immediately upon posting on the Website. It is the user's responsibility to check this page periodically for updates.",
      },
    ],
  },
};

export default function PrivacyPolicy() {
  const { locale } = useLocaleCurrent();
  const seoData = usePageSeo("privacy-policy");
  const data = CONTENT[locale?.code] || CONTENT.en;

  return (
    <>
      {seoData && <Seo {...seoData} />}
      <section className="privacy-policy">
        <div className="container">
          <h1 className="title-medium privacy-policy__title">{data.title}</h1>
          <p className="body-small privacy-policy__date">{data.lastUpdated}</p>

          <div className="privacy-policy__content">
            {data.sections.map((sec, idx) => (
              <div key={idx} className="privacy-policy__section">
                <h2 className="body-medium font-weight-medium privacy-policy__subtitle">
                  {sec.h2}
                </h2>
                <p className="body-small privacy-policy__text">{sec.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
