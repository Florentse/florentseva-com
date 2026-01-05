import React, { useState, useEffect, useRef } from "react";
import useLocaleCurrent from "../hooks/useLocaleCurrent";
import useBriefData from "../hooks/useBriefData";
import PageLoader from "../components/common/PageLoader";

import "./Brief.css";

const FORM_LABELS = {
  en: {
    heading: "Brief for your web project",
    title_category: "You are interested in",
    title_project_details: "Project details",
    projectNameLabel: "Company/Project Name",
    projectSiteLinkLabel: "Website link (if any)",
    projectBusinessLabel: "Your business industry",
    projectBusinessHint:
      "For example: legal and law, food and beverages, clothing store, etc.",
    projectBriefLabel: "Link to brief or terms of reference (if any)",
    projectBriefHint:
      "For example: link to Google Docs, file in cloud storage, etc.",
    projectBranbookLabel: "Link to brandbook (if any)",
    projectBranbookHint:
      "For example: link to Google Docs, file in cloud storage, etc.",
    projectFigmaLabel: "Link to Figma (if any)",
    projectFigmaHint:
      "For example: link to your project in Figma or another design system",
    projectDeadlineLabel: "Desired project implementation timeline",
    projectDeadlineSelectPlaceholder: "Select a timeline",
    projectBudgetLabel: "Project budget",
    projectBudgetSelectPlaceholder: "Select a budget",
    projectMessageLabel: "Would you like to add anything else?",
    projectMessageHint: "For example, special wishes, absolute 'no-go's', etc.",
    title_user_details: "Your details",
    userNameLabel: "Name",
    userEmailLabel: "Email",
    userRoleLabel: "Your role in the project",
    userTelegramLabel: "Telegram",
    userMessageLabel: "Would you like to add anything else?",
    userMessageHint:
      "For example: convenient time to contact, additional details, etc.",
    privacyLabel: "Accept the privacy policy",
    submitBtn: "Submit",
    sending: "Sending...",
    successTitle: "Your application has been successfully sent!",
    successMessage:
      "You will receive a response within 3 working days to your email",
    writeMore: "Write more",
    placeholders: {
      projectName: "Brand/Company name",
      projectSiteLink: "www.example.com",
      projectBusiness: "Industry",
      projectBrief: "URL",
      projectBranbook: "URL",
      projectFigma: "URL",
      projectMessage: "Goals and requirements",
      name: "Full name",
      role: "Founder / Manager",
      email: "mail@example.com",
      telegram: "@username",
      message: "Additional info",
    },
  },
  ru: {
    heading: "Бриф для вашего веб-проекта",
    title_category: "Вас интересует",
    title_project_details: "Детали проекта",
    projectNameLabel: "Название компании/проекта",
    projectSiteLinkLabel: "Cсылка на сайт (если есть)",
    projectBusinessLabel: "Отрасль вашего бизнеса",
    projectBusinessHint:
      "Например: адвокатура и право, еда и напитки, магазин одежды и т.д.",
    projectBriefLabel: "Ссылка на бриф или ТЗ (если есть)",
    projectBriefHint:
      "Например: ссылка на Google Docs, файл в облачном хранилище и т.д.",
    projectBranbookLabel: "Ссылка на брендбук (если есть)",
    projectBranbookHint:
      "Например: ссылка на Google Docs, файл в облачном хранилище и т.д.",
    projectFigmaLabel: "Ссылка на Figma (если есть)",
    projectFigmaHint:
      "Например: ссылка на ваш проект в Figma или другой дизайн-системе",
    projectDeadlineLabel: "Желаемые сроки реализации проекта",
    projectDeadlineSelectPlaceholder: "Выберите срок",
    projectBudgetLabel: "Бюджет проекта",
    projectBudgetSelectPlaceholder: "Выберите бюджет",
    projectMessageLabel: "Хотите ли вы что-то еще сообщить?",
    projectMessageHint:
      "Например, особые пожелания, абсолютные «нельзя» и т. д.",
    title_user_details: "Ваши данные",
    userNameLabel: "Ваше имя",
    userRoleLabel: "Ваша роль в проекте",
    userEmailLabel: "Email",
    userTelegramLabel: "Telegram",
    userMessageLabel: "Хотите ли вы что-то еще сообщить?",
    userMessageHint:
      "Например: удобное время для связи, дополнительные детали и т.д.",
    privacyLabel: "Соглашаюсь с политикой конфиденциальности",
    submitBtn: "Отправить",
    sending: "Отправка...",
    successTitle: "Ваша заявка успешно отправлена!",
    successMessage: "Вы получите ответ в течении 3х рабочих дней на ваш емаил",
    writeMore: "Написать еще",
    placeholders: {
      projectName: "Название бренда",
      projectSiteLink: "www.example.com",
      projectBusiness: "Сфера",
      projectBrief: "Ссылка",
      projectBranbook: "Ссылка",
      projectFigma: "Ссылка",
      projectMessage: "Цели и задачи",
      name: "Имя Фамилия",
      role: "Основатель / Менеджер",
      email: "mail@example.com",
      telegram: "@username",
      message: "Комментарий",
    },
  },
};

export default function Brief() {
  const { locale } = useLocaleCurrent();
  const { categories, services, currencies, budgets, deadlines, loading } =
    useBriefData();
  const dropdownRef = useRef(null);

  const [selectedCats, setSelectedCats] = useState([]);
  const [selectedServs, setSelectedServs] = useState([]);
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  const [selectedBudget, setSelectedBudget] = useState("");
  const [selectedDeadline, setSelectedDeadline] = useState("");

  const [projectDetails, setProjectDetails] = useState({
    projectName: "",
    projectSiteLink: "",
    projectBusiness: "",
    projectBrief: "",
    projectBranbook: "",
    projectFigma: "",
    projectMessage: "",
  });

  const [userDetails, setUserDetails] = useState({
    name: "",
    role: "",
    email: "",
    telegram: "",
    userMessage: "",
    privacy: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Закрытие дропдаунов при клике вне их области
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Если клик был НЕ по переключателю и НЕ по списку — закрываем всё
      if (!e.target.closest(".form-dropdown")) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (currencies.length > 0 && !selectedCurrency) {
      const defaultCurr = currencies.find((c) => c.is_default) || currencies[0];
      setSelectedCurrency(defaultCurr.id);
    }
  }, [currencies, selectedCurrency]);

  const isExcluded = (item, selectedIds, allData) => {
    return selectedIds.some((selectedId) => {
      const selectedItem = allData.find((i) => i.id === selectedId);
      return selectedItem?.exclusionGroup?.includes(item.id);
    });
  };

  const toggleCategory = (catId) => {
    if (isExcluded({ id: catId }, selectedCats, categories)) return;
    setSelectedCats((prev) => {
      if (prev.includes(catId)) {
        const catServices = services
          .filter((s) => s.categoryIds.includes(catId))
          .map((s) => s.id);
        setSelectedServs((servs) =>
          servs.filter((id) => !catServices.includes(id))
        );
        return prev.filter((id) => id !== catId);
      }
      return [...prev, catId];
    });
  };

  const toggleService = (servId) => {
    if (isExcluded({ id: servId }, selectedServs, services)) return;
    setSelectedServs((prev) =>
      prev.includes(servId)
        ? prev.filter((id) => id !== servId)
        : [...prev, servId]
    );
  };

  const handleProjectChange = (e) => {
    const { name, value } = e.target;
    setProjectDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleUserChange = (e) => {
    const { name, value, type, checked } = e.target;
    setUserDetails((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isFormValid =
    userDetails.name.trim() !== "" &&
    userDetails.email.includes("@") &&
    userDetails.privacy === true &&
    (isMobile ? selectedServs.length > 0 : selectedCats.length > 0) &&
    selectedBudget !== "" &&
    selectedDeadline !== "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;
    setIsSubmitting(true);

    window.grecaptcha.ready(async () => {
      try {
        const token = await window.grecaptcha.execute(
          import.meta.env.VITE_RECAPTCHA_SITE_KEY,
          { action: "submit_brief" }
        );
        const finalProjectData = {
          ...projectDetails,
          userMessage: userDetails.userMessage,
          selected_budget_text: budgets.find((b) => b.id === selectedBudget)
            ?.budgetTextsByCurrency[selectedCurrency],
          selected_deadline_text: deadlines.find(
            (d) => d.id === selectedDeadline
          )?.title,
        };
        const payload = {
          name: userDetails.name,
          email: userDetails.email,
          role: userDetails.role,
          telegram: userDetails.telegram,
          selected_services: selectedServs,
          currency_id: selectedCurrency,
          locale_id: locale?.recordId,
          project_data: finalProjectData,
          captchaToken: token,
        };
        const response = await fetch("/api/submit-brief", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error("Submission failed");
        setIsSubmitted(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (error) {
        alert("Error sending brief.");
      } finally {
        setIsSubmitting(false);
      }
    });
  };

  if (loading) return <PageLoader />;
  const labels = FORM_LABELS[locale?.code] || FORM_LABELS.en;

  return (
    <section className="brief">
      <div className="container">
        <div className="brief__title-wrap">
          <h1 className="brief__title">{labels.heading}</h1>
        </div>

        <form className="brief-form" onSubmit={handleSubmit}>
          {isSubmitted ? (
            <div className="brief-form__success-message">
              <h2 className="brief-form__success-title">
                {labels.successTitle}
              </h2>
              <p className="brief-form__success-text">
                {labels.successMessage} <strong>{userDetails.email}</strong>.
              </p>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => setIsSubmitted(false)}
              >
                {labels.writeMore}
              </button>
            </div>
          ) : (
            <div className="brief-form__content">
              {/* 1. ВЫБОР КАТЕГОРИЙ [cite: 20, 21] */}
              {!isMobile && (
                <div className="brief-form__step is-category-select">
                  <h2 className="body-small">{labels.title_category}</h2>
                  <div className="brief-form__category-select-group">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        className={`brief-form__category-select-btn ${
                          selectedCats.includes(cat.id) ? "is-active" : ""
                        } ${
                          isExcluded(cat, selectedCats, categories)
                            ? "is-disabled"
                            : ""
                        }`}
                        onClick={() => toggleCategory(cat.id)}
                      >
                        {cat.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. ВЫБОР УСЛУГ [cite: 23, 24, 25, 26] */}
              <div className="brief-form__step is-services-select">
                {/* На мобилках показываем все категории, на десктопе - только выбранные */}
                {categories
                  .filter((cat) =>
                    isMobile ? true : selectedCats.includes(cat.id)
                  )
                  .map((cat) => (
                    <div
                      key={cat.id}
                      className="brief-form__selected-category-item"
                    >
                      <div className="brief-form__selected-category-info">
                        <h3 className="title-small">{cat.title}</h3>
                        <p className="body-medium">{cat.description}</p>
                      </div>
                      <div className="brief-form__selected-services-list">
                        {services
                          .filter((s) => s.categoryIds.includes(cat.id))
                          .map((s) => (
                            <div
                              key={s.id}
                              className="brief-form__selected-service-item"
                            >
                              <button
                                type="button"
                                className={`brief-form__selected-service-btn ${
                                  selectedServs.includes(s.id)
                                    ? "is-active"
                                    : ""
                                } ${
                                  isExcluded(s, selectedServs, services)
                                    ? "is-disabled"
                                    : ""
                                }`}
                                onClick={() => toggleService(s.id)}
                              >
                                <span className="square"></span>
                                <p className="body-medium">{s.title}</p>
                              </button>
                              <div className="brief-form__selected-service-info">
                                <span className="hint-icon">?</span>
                                <div className="brief-form__selected-service-tooltip">
                                  <p className="body-small">
                                    {s.description || s.title}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
              </div>

              {/* 3. ДЕТАЛИ ПРОЕКТА [cite: 28, 29, 30, 31] */}
              <div className="brief-form__step is-project-details">
                <h2 className="title-small">{labels.title_project_details}</h2>
                <div className="brief-form__details-group">
                  <div className="form-grid--two-columns">
                    <div className="form-group">
                      <label className="brief-form__input-label">
                        {labels.projectNameLabel} *
                      </label>
                      <input
                        type="text"
                        name="projectName"
                        placeholder={labels.placeholders.projectName}
                        value={projectDetails.projectName}
                        onChange={handleProjectChange}
                        className="brief-form__input"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="brief-form__input-label">
                        {labels.projectSiteLinkLabel}
                      </label>
                      <input
                        type="text"
                        name="projectSiteLink"
                        placeholder={labels.placeholders.projectSiteLink}
                        value={projectDetails.projectSiteLink}
                        onChange={handleProjectChange}
                        className="brief-form__input"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="brief-form__input-label">
                      {labels.projectBusinessLabel} *
                    </label>
                    <input
                      type="text"
                      name="projectBusiness"
                      placeholder={labels.placeholders.projectBusiness}
                      value={projectDetails.projectBusiness}
                      onChange={handleProjectChange}
                      className="brief-form__input"
                    />
                    <p className="brief-form__input-hint">
                      {labels.projectBusinessHint}
                    </p>
                  </div>

                  <div className="form-group">
                    <label className="brief-form__input-label">
                      {labels.projectBriefLabel}
                    </label>
                    <input
                      type="text"
                      name="projectBrief"
                      placeholder={labels.placeholders.projectBrief}
                      value={projectDetails.projectBrief}
                      onChange={handleProjectChange}
                      className="brief-form__input"
                    />
                    <p className="brief-form__input-hint">
                      {labels.projectBriefHint}
                    </p>
                  </div>

                  <div className="form-grid--two-columns">
                    <div className="form-group">
                      <label className="brief-form__input-label">
                        {labels.projectBranbookLabel}
                      </label>
                      <input
                        type="text"
                        name="projectBranbook"
                        placeholder={labels.placeholders.projectBranbook}
                        value={projectDetails.projectBranbook}
                        onChange={handleProjectChange}
                        className="brief-form__input"
                      />
                    </div>
                    <div className="form-group">
                      <label className="brief-form__input-label">
                        {labels.projectFigmaLabel}
                      </label>
                      <input
                        type="text"
                        name="projectFigma"
                        placeholder={labels.placeholders.projectFigma}
                        value={projectDetails.projectFigma}
                        onChange={handleProjectChange}
                        className="brief-form__input"
                      />
                    </div>
                  </div>

                  {/* ДРОПДАУН СРОКИ [cite: 29] */}
                  <div className="form-group" ref={dropdownRef}>
                    <label className="brief-form__input-label">
                      {labels.projectDeadlineLabel} *
                    </label>
                    <div
                      className={`form-dropdown ${
                        activeDropdown === "deadline" ? "is-open" : ""
                      }`}
                    >
                      <div
                        className="form-dropdown__toggle"
                        onClick={() =>
                          setActiveDropdown(
                            activeDropdown === "deadline" ? null : "deadline"
                          )
                        }
                      >
                        {deadlines.find((d) => d.id === selectedDeadline)
                          ?.title || labels.projectDeadlineSelectPlaceholder}
                      </div>

                      {/* ДОБАВЛЕНО УСЛОВИЕ */}
                      {activeDropdown === "deadline" && (
                        <div className="form-dropdown__list">
                          {deadlines.map((d) => (
                            <label key={d.id} className="form-dropdown__item">
                              <input
                                type="radio"
                                name="deadline"
                                value={d.id}
                                checked={selectedDeadline === d.id}
                                onChange={() => {
                                  setSelectedDeadline(d.id);
                                  setActiveDropdown(null);
                                }}
                              />
                              <span>{d.title}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* БЮДЖЕТ И ВАЛЮТА [cite: 30, 31] */}
                  <div className="form-group">
                    <label className="brief-form__input-label">
                      {labels.projectBudgetLabel} *
                    </label>
                    <div className="form-flex-row">
                      {/* БЮДЖЕТ ПРОЕКТА */}
                      <div
                        className={`form-dropdown ${
                          activeDropdown === "budget" ? "is-open" : ""
                        }`}
                      >
                        <div
                          className="form-dropdown__toggle"
                          onClick={() =>
                            setActiveDropdown(
                              activeDropdown === "budget" ? null : "budget"
                            )
                          }
                        >
                          {budgets.find((b) => b.id === selectedBudget)
                            ?.budgetTextsByCurrency[selectedCurrency] ||
                            labels.projectBudgetSelectPlaceholder}
                        </div>

                        {/* Список показываем только если activeDropdown === "budget" */}
                        {activeDropdown === "budget" && (
                          <div className="form-dropdown__list">
                            {budgets.map((b) => (
                              <label
                                key={b.id}
                                className="form-dropdown__item"
                                onClick={() => {
                                  setSelectedBudget(b.id);
                                  setActiveDropdown(null);
                                }}
                              >
                                <input
                                  type="radio"
                                  name="budget"
                                  readOnly
                                  checked={selectedBudget === b.id}
                                />
                                <span>
                                  {b.budgetTextsByCurrency[selectedCurrency] ||
                                    "—"}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="brief-form__currency-switch">
                        {currencies.map((curr) => (
                          <div
                            key={curr.id}
                            className={`brief-form__currency-option ${
                              selectedCurrency === curr.id ? "is-active" : ""
                            }`}
                            onClick={() => setSelectedCurrency(curr.id)}
                          >
                            {curr.code}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="brief-form__input-label">
                      {labels.projectMessageLabel}
                    </label>
                    <textarea
                      name="projectMessage"
                      placeholder={labels.placeholders.projectMessage}
                      value={projectDetails.projectMessage}
                      onChange={handleProjectChange}
                      rows={4}
                      className="brief-form__input"
                    />
                    <p className="brief-form__input-hint">
                      {labels.projectMessageHint}
                    </p>
                  </div>
                </div>
              </div>

              {/* 4. ДАННЫЕ ПОЛЬЗОВАТЕЛЯ [cite: 32, 33] */}
              <div className="brief-form__step is-user-details">
                <h2 className="title-small">{labels.title_user_details}</h2>
                <div className="brief-form__details-group">
                  <div className="form-grid--two-columns">
                    <div className="form-group">
                      <label className="brief-form__input-label">
                        {labels.userNameLabel} *
                      </label>
                      <input
                        type="text"
                        name="name"
                        placeholder={labels.placeholders.name}
                        value={userDetails.name}
                        onChange={handleUserChange}
                        className="brief-form__input"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="brief-form__input-label">
                        {labels.userRoleLabel}
                      </label>
                      <input
                        type="text"
                        name="role"
                        placeholder={labels.placeholders.role}
                        value={userDetails.role}
                        onChange={handleUserChange}
                        className="brief-form__input"
                      />
                    </div>
                  </div>
                  <div className="form-grid--two-columns">
                    <div className="form-group">
                      <label className="brief-form__input-label">
                        {labels.userEmailLabel} *
                      </label>
                      <input
                        type="email"
                        name="email"
                        placeholder={labels.placeholders.email}
                        value={userDetails.email}
                        onChange={handleUserChange}
                        className="brief-form__input"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="brief-form__input-label">
                        {labels.userTelegramLabel}
                      </label>
                      <input
                        type="text"
                        name="telegram"
                        placeholder={labels.placeholders.telegram}
                        value={userDetails.telegram}
                        onChange={handleUserChange}
                        className="brief-form__input"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="brief-form__input-label">
                      {labels.userMessageLabel}
                    </label>
                    <textarea
                      name="userMessage"
                      placeholder={labels.placeholders.message}
                      value={userDetails.userMessage}
                      onChange={handleUserChange}
                      rows={4}
                      className="brief-form__input"
                    />
                    <p className="brief-form__input-hint">
                      {labels.userMessageHint}
                    </p>
                  </div>
                </div>
              </div>

              <div className="form-footer brief-form__footer">
                <label className="checkbox-label body-small">
                  <input
                    name="privacy"
                    type="checkbox"
                    required
                    checked={userDetails.privacy}
                    onChange={handleUserChange}
                  />
                  <span>{labels.privacyLabel}</span>
                </label>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!isFormValid || isSubmitting}
                >
                  {isSubmitting ? labels.sending : labels.submitBtn}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </section>
  );
}
