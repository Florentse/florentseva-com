import React from "react";
import { useParams, Link } from "react-router-dom";
import useLocaleCurrent from "../hooks/useLocaleCurrent";
import useCaseSinglePage from "../hooks/useCaseSinglePage";
import PageLoader from "../components/common/PageLoader";

import Seo from "../components/Seo";

import NotFound from "./NotFound";
import "./Cases.css";

const formatDescription = (text) => {
  if (!text) return "";

  let formattedText = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  if (formattedText.includes("- ")) {
    const items = formattedText
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map((line) => `<li>${line.replace(/^- /, "").trim()}</li>`)
      .join("");
    return `<ul>${items}</ul>`;
  }

  return formattedText;
};

const LABELS = {
  en: {
    home: "Home",
    cases: "Case studies",
    year: "Year",
    services: "Services",
    site: "Live site",
    task: "The task",
    solution: "The solution",
    order: "Contact",
    brief: "Fill out brief",
  },
  ru: {
    home: "Главная",
    cases: "Кейсы",
    year: "Год",
    services: "Услуги",
    site: "Сайт",
    task: "Задача",
    solution: "Решение",
    order: "Связаться",
    brief: "Заполнить бриф",
  },
};

export default function CaseTemplate() {
  const { slug } = useParams();
  const { caseData, seo, loading } = useCaseSinglePage(slug);
  const { locale } = useLocaleCurrent();

  const currentLang = locale?.code === "ru" ? "ru" : "en";
  const labels = LABELS[currentLang];

  if (loading) return <PageLoader />;
  if (!caseData) return <NotFound />;

  return (

    <>
    {/* Конфигурация SEO для кейса */}
      {seo && (
        <Seo
          {...seo}
          ogType="article"
          schemaData={{
            "@context": "https://schema.org",
            "@type": "CreativeWork",
            "name": seo.title,
            "headline": seo.title,
            "description": seo.description,
            "image": seo.ogImage,
            "author": {
              "@type": "Person",
              "name": "Tatiana Florentseva"
            }
          }}
        />
      )}

      <section
        className="case-hero"
      >
        <div className="container case-hero__container">
          <div className="case-hero__content">
            <div className="с-hero__breadcrumbs">
              <Link to="/">{labels.home}</Link> /{" "}
              <Link to="/cases">{labels.cases}</Link> /
            </div>
            <h1 className="case-hero__title">{caseData.title}</h1>

            <div className="case-hero__info">
              {caseData.year && (
                <div className="case-hero__column">
                  <p className="title-small">{labels.year}</p>
                  <p className="body-small">{caseData.year}</p>
                </div>
              )}

              <div className="case-hero__column">
                <p className="title-small">{labels.services}</p>
                <div className="case-hero__services-list">
                  {caseData.services?.map((service, idx) => (
                    <Link
                      key={idx}
                      to={`/services/${service.slug}`}
                      className="link-underline case-hero__service-btn"
                    >
                      {service.title}
                    </Link>
                  ))}
                </div>
              </div>

              {caseData.liveUrl && (
                <div className="case-hero__column">
                  <p className="title-small">{labels.site}</p>
                  <a
                    href={caseData.liveUrl}
                    className="link-underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {caseData.liveUrl.replace(/^https?:\/\//, "")}{" "}
                    {/* Убираем http/https для красоты */}
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="case-hero__img">
            <img src={caseData.cardImage} alt="" />
          </div>
        </div>
      </section>

      <section className="case-content">
        <div className="container">
          <div className="case-main-grid">
            {/* Основной текст: Задача и Решение */}
            <div className="case-text-blocks">
              {caseData.task && (
                <div className="case-info-block">
                  <h2 className="title-small">{labels.task}</h2>
                  <div
                    className="body-medium case-task-text"
                    dangerouslySetInnerHTML={{
                      __html: formatDescription(caseData.task),
                    }}
                  />
                </div>
              )}

              {caseData.solution && (
                <div className="case-info-block">
                  <h2 className="title-small">{labels.solution}</h2>
                  <div
                    className="body-medium"
                    dangerouslySetInnerHTML={{
                      __html: formatDescription(caseData.solution),
                    }}
                  />
                </div>
              )}

              {caseData.gallery?.length > 0 && (
                <div className="case-gallery">
                  {caseData.gallery.map((img, idx) => (
                    <div key={idx} className="case-gallery__item">
                      <img src={img.url} alt={img.alt} loading="lazy" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="c-cta">
        <div className="container c-cta__container">
          <div className="c-cta__title-wrap">
            <h3 className="body-medium font-weight-medium">
              {caseData.ctaText}
            </h3>
          </div>
          <div className="btn-group">
            <Link to="/contact" className="btn btn-primary btn-primary--invert">
              {labels.order}
            </Link>
            <Link
              to="/brief"
              className="btn btn-secondary btn-secondary--invert"
            >
              {labels.brief}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
