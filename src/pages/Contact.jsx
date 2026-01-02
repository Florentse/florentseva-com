import React, { useState, useEffect } from "react";
import useLocaleCurrent from "../hooks/useLocaleCurrent";
import useServicesPublished from "../hooks/useServicesPublished";
import ContactForm from "../components/common/ContactForm";
import PageLoader from "../components/common/PageLoader";

import "./Contact.css";

const CONTACT_LABELS = {
  en: {
    title: "Contacts",
    subtitle:
      "Have a project in mind or just want to say hi? Contact in a way convenient for you.",
    email: "contact@florentseva.com",
    telegram: "@florentcevat",
    call: "Book a FREE meeting call",
    copy: "Copy",
    copied: "Copied!",
  },
  ru: {
    title: "Контакты",
    subtitle:
      "Есть проект или хотите просто поздороваться? Свяжитесь удобным для вас способом.",
    email: "contact@florentseva.com",
    telegram: "@florentcevat",
    call: "Забронировать созвон бесплатно",
    copy: "Копировать",
    copied: "Скопировано!",
  },
};

export default function Contact() {
  const { locale } = useLocaleCurrent();
  const { loading: servicesLoading } = useServicesPublished();
  const [copiedField, setCopiedField] = useState(null);

  const labels = CONTACT_LABELS[locale?.code] || CONTACT_LABELS.en;

  if (servicesLoading) return <PageLoader />;

  const handleCopy = (text, fieldId) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <>
      <section className="contact-hero">
        <div className="container contact-hero__container">
          <div className="contact-hero__content">
            <div className="contact-hero__text">
              <h1 className="title-medium">{labels.title}</h1>
              <p className="body-large">{labels.subtitle}</p>
            </div>

            <div className="contact-info">
              <div className="contact-info__item">
                <img
                  src="src/assets/icons/email.svg"
                  alt="Email"
                  className="contact-info__item-icon"
                />
                <a
                  href={`mailto:${labels.email}`}
                  className="body-small font-weight-medium"
                >
                  {labels.email}
                </a>
                <button
                  className={`btn-copy ${
                    copiedField === "email" ? "is-copied" : ""
                  }`}
                  onClick={() => handleCopy(labels.email, "email")}
                >
                  <img
                    src="src/assets/icons/copy.svg"
                    alt=""
                    className="icon-default"
                  />
                  <img
                    src="src/assets/icons/copy-check.svg"
                    alt=""
                    className="icon-success"
                  />
                </button>
              </div>

              <div className="contact-info__item">
                <img
                  src="src/assets/icons/telegram.svg"
                  alt="Telegram"
                  className="contact-info__item-icon"
                />
                <a
                  href={`https://t.me/${labels.telegram.replace("@", "")}`}
                  className="body-small font-weight-medium"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {labels.telegram}
                </a>
                <button
                  className={`btn-copy ${
                    copiedField === "tg" ? "is-copied" : ""
                  }`}
                  onClick={() => handleCopy(labels.telegram, "tg")}
                >
                  <img
                    src="src/assets/icons/copy.svg"
                    alt=""
                    className="icon-default"
                  />
                  <img
                    src="src/assets/icons/copy-check.svg"
                    alt=""
                    className="icon-success"
                  />
                </button>
              </div>

              <div className="contact-info__item">
                <img
                  src="src/assets/icons/booking.svg"
                  alt="Booking"
                  className="contact-info__item-icon"
                />
                <a
                  href="#"
                  className="body-small font-weight-medium"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {labels.call}
                </a>
              </div>
            </div>
          </div>

          <div className="contact-page__form-wrap">
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}
