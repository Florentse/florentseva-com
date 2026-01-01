// src/components/common/ContactForm.jsx
import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import useLocaleCurrent from "../../hooks/useLocaleCurrent";
import useServicesPublished from "../../hooks/useServicesPublished";

const FORM_LABELS = {
  en: {
    formTitle: "Still have questions? Write to us.",
    nameLabel: "Name",
    emailLabel: "Email",
    topicLabel: "Topic of inquiry",
    messageLabel: "Your question",
    privacyLabel: "Accept the privacy policy",
    submitBtn: "Submit",
    sending: "Sending...",
    successTitle: "Your application has been successfully sent!",
    successMessage:
      "You will receive a response within 3 working days to your email",
    writeMore: "Write more",
    placeholders: {
      name: "John Doe",
      email: "example@mail.com",
      message: "How can we help you?",
    },
  },
  ru: {
    formTitle: "Остались вопросы? Напишите нам.",
    nameLabel: "Имя",
    emailLabel: "Email",
    topicLabel: "Тема вопроса",
    messageLabel: "Ваш вопрос",
    privacyLabel: "Соглашаюсь с политикой конфиденциальности",
    submitBtn: "Отправить",
    sending: "Отправка...",
    successTitle: "Ваша заявка успешно отправлена!",
    successMessage: "Вы получите ответ в течении 3х рабочих дней на ваш емаил",
    writeMore: "Написать еще",
    placeholders: {
      name: "Иван Иванов",
      email: "example@mail.com",
      message: "Чем мы можем вам помочь?",
    },
  },
};

export default function ContactForm() {
  const { slug } = useParams();
  const { locale } = useLocaleCurrent();
  const { services: allServices, loading: servicesLoading } =
    useServicesPublished();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedService, setSelectedService] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const dropdownRef = useRef(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
    privacy: false,
  });

  // Закрытие при клике вне дропдауна
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  useEffect(() => {
    if (allServices.length > 0 && slug) {
      const current = allServices.find((s) => s.slug === slug);
      if (current) {
        setSelectedService(current.id);
      }
    }
  }, [allServices, slug]);

  const isFormValid =
    formData.name &&
    formData.email &&
    formData.message &&
    formData.privacy &&
    selectedService;

  const labels = FORM_LABELS[locale?.code] || FORM_LABELS.en;

  const currentServiceName =
    allServices?.find((s) => s.id === selectedService)?.title ||
    labels.topicLabel;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // 1. Получаем токен от reCAPTCHA
    if (!window.grecaptcha) {
      alert("Ошибка безопасности: капча не загружена");
      setIsSubmitting(false);
      return;
    }

    window.grecaptcha.ready(async () => {
      try {
        const token = await window.grecaptcha.execute(
          import.meta.env.VITE_RECAPTCHA_SITE_KEY,
          {
            action: "submit_contact_form",
          }
        );

        // 2. Добавляем токен в данные для отправки
        const payload = {
          name: formData.name,
          email: formData.email,
          services: selectedService ? [selectedService] : [],
          locale: locale?.recordId ? [locale.recordId] : [],
          message: formData.message,
          captchaToken: token,
        };

        const isDev = import.meta.env.DEV;
        let response;

        if (isDev) {
          const AIRTABLE_URL = `https://api.airtable.com/v0/${
            import.meta.env.VITE_AIRTABLE_BASE_ID
          }`;
          const headers = {
            Authorization: `Bearer ${import.meta.env.VITE_AIRTABLE_TOKEN}`,
            "Content-Type": "application/json",
          };

          console.log(">>> [Локальный тест] Начинаем процесс...");

          // 1. Поиск/создание контакта
          const searchRes = await fetch(
            `${AIRTABLE_URL}/Contacts?filterByFormula=({email}='${formData.email}')`,
            { headers }
          );
          const searchData = await searchRes.json();
          let contactId;

          if (searchData.records?.length > 0) {
            contactId = searchData.records[0].id;
            console.log(">>> Контакт найден:", contactId);
          } else {
            console.log(">>> Контакт не найден, создаем...");
            const newContactRes = await fetch(`${AIRTABLE_URL}/Contacts`, {
              method: "POST",
              headers,
              body: JSON.stringify({
                fields: {
                  email: formData.email,
                  name: formData.name,
                  locale: locale?.recordId ? [locale.recordId] : [],
                },
              }),
            });
            const newContact = await newContactRes.json();
            if (!newContactRes.ok) {
              console.error(">>> Ошибка при создании Контакта:", newContact);
              throw new Error("Airtable Contact Error");
            }
            contactId = newContact.id;
            console.log(">>> Контакт создан:", contactId);
          }

          // 2. Создание Lead
          const leadData = {
            fields: {
              name: formData.name,
              email: formData.email,
              service: selectedService ? [selectedService] : [],
              locale: locale?.recordId ? [locale.recordId] : [],
              message: formData.message,
              status: "New",
              date: new Date().toISOString(),
              contact: [contactId],
            },
          };

          console.log(">>> Отправляем Lead в Airtable:", leadData);

          response = await fetch(`${AIRTABLE_URL}/Leads`, {
            method: "POST",
            headers,
            body: JSON.stringify(leadData),
          });

          if (!response.ok) {
            const errorDetails = await response.json();
            // Выводим конкретную причину ошибки текстом
            console.error(
              ">>> ПРИЧИНА ОШИБКИ 422:",
              errorDetails.error?.message
            );
            console.error(">>> ТИП ОШИБКИ:", errorDetails.error?.type);
            throw new Error(errorDetails.error?.message || "Ошибка сервера");
          }

          console.log(">>> Успех! Lead создан.");
        } else {
          // В продакшене через защищенный API
          response = await fetch("/api/submit-form", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        }

        if (!response.ok) throw new Error("Ошибка");
        setIsSubmitted(true);
      } catch (error) {
        alert("Ошибка при отправке формы.");
      } finally {
        setIsSubmitting(false);
      }
    });
  };

  const handleWriteMore = () => {
    // Сбрасываем только сообщение, остальные данные из formData сохраняются в инпутах
    setFormData((prev) => ({
      ...prev,
      message: "",
    }));
    setIsSubmitted(false);
  };

  if (servicesLoading) return null; // Или можно показать лоадер

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      {!isSubmitted ? (
        <div className="form-grid">
          <div className="form-grid--two-columns">
            <div className="form-group">
              <label className="body-small">{labels.nameLabel}</label>
              <input
                name="name"
                type="text"
                placeholder={labels.placeholders.name}
                required
                value={formData.name}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label className="body-small">{labels.emailLabel}</label>
              <input
                name="email"
                type="email"
                placeholder={labels.placeholders.email}
                required
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-group full-width">
            <label className="body-small">{labels.topicLabel}</label>
            <div
              ref={dropdownRef}
              className={`form-dropdown ${isDropdownOpen ? "is-open" : ""}`}
            >
              <div
                className="form-dropdown__toggle"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                {currentServiceName}
              </div>
              {isDropdownOpen && (
                <div className="form-dropdown__list">
                  {allServices?.map((service) => (
                    <label key={service.id} className="form-dropdown__item">
                      <input
                        type="radio"
                        name="service_id"
                        value={service.id}
                        checked={selectedService === service.id}
                        onChange={() => {
                          setSelectedService(service.id);
                          setIsDropdownOpen(false);
                        }}
                      />
                      <span>{service.title}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="form-group full-width">
            <label className="body-small">{labels.messageLabel}</label>
            <textarea
              name="message"
              placeholder={labels.placeholders.message}
              rows="4"
              value={formData.message}
              onChange={handleInputChange}
            ></textarea>
          </div>

          <div className="form-footer full-width">
            <label className="checkbox-label body-small">
              <input
                name="privacy"
                type="checkbox"
                required
                checked={formData.privacy}
                onChange={handleInputChange}
              />
              <span>{labels.privacyLabel}</span>
            </label>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!isFormValid}
            >
              {isSubmitting ? labels.sending : labels.submitBtn}
            </button>
          </div>
        </div>
      ) : (
        <div className="contact-form__success-message">
          <h3 className="title-small">{labels.successTitle}</h3>
          <p className="body-medium">
            {labels.successMessage} <strong>{formData.email}</strong>.
          </p>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleWriteMore}
          >
            {labels.writeMore}
          </button>
        </div>
      )}
    </form>
  );
}
