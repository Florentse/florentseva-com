// src/pages/ServiceTemplate.jsx

import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";

import useLocaleCurrent from "../hooks/useLocaleCurrent";
import useServiceSinglePage from "../hooks/useServiceSinglePage";

import PageLoader from "../components/common/PageLoader";
import CardLoader from "../components/common/CardLoader";

import "./Services.css";

const LABELS = {
  en: {
    order: "Order service",
    brief: "Fill out brief",
    home: "Home",
    services: "Services",
    solutionsTitle: "Solutions & Capabilities",
    solutionsSub:
      "A range of technical and creative solutions tailored to your specific project goals.",
    processTitle: "Main implementation steps:",
    faqsTitle: "FAQ",
  },
  ru: {
    order: "Заказать услугу",
    brief: "Заполнить бриф",
    home: "Главная",
    services: "Услуги",
    solutionsTitle: "Решения и возможности",
    solutionsSub:
      "Широкий спектр технических и творческих решений, разработанных с учетом конкретных целей вашего проекта.",
    processTitle: "Основные этапы реализации:",
    faqsTitle: "FAQ",
  },
};

const Hero = ({ data, labels }) => (
  <section className="s-hero">
    <div className="container s-hero__container">
      <div className="s-hero__breadcrumbs">
        <Link to="/">{labels.home}</Link> /{" "}
        <Link to="/services">{labels.services}</Link> /
      </div>
      <div className="s-hero__content-wrap">
        <h1 className="title-medium">{data?.title || "..."}</h1>
        <p className="body-large">{data?.about}</p>
        <div className="btn-group">
          <button className="btn btn-primary">{labels.order}</button>
          <button className="btn btn-secondary">{labels.brief}</button>
        </div>
      </div>
    </div>
  </section>
);

const Quote = ({ data }) => (
  <section className="s-guote">
    <div className="container">
      <div className="s-quote__text-wrap">
        <p className="body-large">{data.quote}</p>
      </div>
    </div>
  </section>
);

const formatSolutionsList = (text) => {
  if (!text) return "";

  // 1. Сначала заменяем Markdown-жирный (**текст**) на HTML (<strong>текст</strong>)
  const withBold = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // 2. Затем формируем список <ul><li>, если есть строки с дефисом
  if (withBold.includes("- ")) {
    const items = withBold
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map((line) => `<li>${line.replace(/^- /, "").trim()}</li>`)
      .join("");
    return `<ul>${items}</ul>`;
  }

  return withBold;
};

const Solutions = ({ data, labels }) => {
  return (
    <section className="s-solutions">
      <div className="container s-solutions__container">
        <div className="s-solutions__text-wrap">
          <h2 className="title-medium">{labels.solutionsTitle}</h2>
          <p className="body-medium">{labels.solutionsSub}</p>
        </div>

        <div className="s-solutions__content">
          <div
            className="s-solutions__list-wrap"
            dangerouslySetInnerHTML={{
              __html: formatSolutionsList(data.content),
            }}
          />
        </div>
      </div>
    </section>
  );
};

const Process = ({ data, labels }) => (
  <section className="s-process">
    <div className="container">
      <div className="s-process__heading-wrap">
        <h2>{labels.processTitle}</h2>
      </div>
      {data.items && (
        <div className="s-process__list">
          {data.items.map((item, index) => (
            <div key={index} className="s-process__item">
              <p className="s-process__item-number">#0{item.order}</p>
              <h3 className="body-medium font-weight-medium">{item.title}</h3>
              <p className="body-small s-process__item-description">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  </section>
);

const FAQItem = ({ item }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`faqs__dropdown ${isOpen ? "is-open" : ""}`}>
      <button
        className="faqs__dropdown-button"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{item.question}</span>
        <svg
          className="faqs__icon"
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          fill="none"
          viewBox="0 0 24 24"
        >
          <g clipPath="url(#a)">
            <path fill="currentColor" d="M0 11h24v2H0v-2Z" />
            <path
              fill="currentColor"
              className="faqs__icon-vertical"
              d="M11 24V0h2v24h-2Z"
            />
          </g>
          <defs>
            <clipPath id="a">
              <path fill="#fff" d="M0 0h24v24H0z" />
            </clipPath>
          </defs>
        </svg>
      </button>
      <div className="faqs__dropdown-content">
        <div className="fags__dropdown-content-layout">{item.answer}</div>
      </div>
    </div>
  );
};

const FAQs = ({ data, labels }) => {
  return (
    <section className="faqs">
      <div className="container faqs__container">
        <div className="faqs__text-wrap">
          <h2 className="title-medium">{labels.faqsTitle}</h2>
        </div>

        <div className="faqs__accordion">
          {data.items?.map((item, index) => (
            <FAQItem key={index} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
};

const Cta = ({ data, labels }) => (
  <section className="cta">
    <div className="container cta__container">
      <div className="cta__title-wrap">
        <h3>{data.text}</h3>
      </div>
      <div className="btn-group">
        <button className="btn btn-primary">{labels.order}</button>
        <button className="btn btn-secondary">{labels.brief}</button>
      </div>
    </div>
  </section>
);

// Если ключ в базе не совпал с SECTION_COMPONENTS, увидим эту ошибку
const DefaultSection = ({ data }) => (
  <section style={{ border: "1px dashed red", padding: "10px" }}>
    <strong>Unknown section key:</strong> {data.key}
  </section>
);

const SECTION_COMPONENTS = {
  "s-hero": Hero,
  "s-quote": Quote,
  "s-solutions": Solutions,
  "s-process": Process,
  faqs: FAQs,
  cta: Cta,
};

export default function ServiceTemplate() {
  const { slug } = useParams();
  const { locale } = useLocaleCurrent(); // Добавлена эта строка
  const { sections, loading } = useServiceSinglePage(slug);

  const labels = LABELS[locale?.code] || LABELS.en;

  if (loading) return <PageLoader />;
  if (!sections) return <div>Service not found</div>;

  return (
    <main>
      {sections.map((section, index) => {
        const Component = SECTION_COMPONENTS[section.key] || DefaultSection;
        return (
          <Component
            key={`${section.key}-${index}`}
            data={section.data}
            labels={labels}
          />
        );
      })}
    </main>
  );
}
