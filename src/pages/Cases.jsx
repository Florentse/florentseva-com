import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";

import usePageSections from "../hooks/usePageSections";
import useLocaleCurrent from "../hooks/useLocaleCurrent";
import useCasesPublished from "../hooks/useCasesPublished";

import usePageSeo from "../hooks/usePageSeo";
import Seo from "../components/Seo";

import PageLoader from "../components/common/PageLoader";
import CardLoader from "../components/common/CardLoader";

import "./Cases.css";

const formatCaseDescription = (text) => {
  if (!text) return "";
  // Если текст содержит строки, начинающиеся с "-", превращаем их в <ul><li>
  if (text.includes("- ")) {
    const items = text
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map((line) => `<li>${line.replace(/^- /, "").trim()}</li>`)
      .join("");
    return `<ul>${items}</ul>`;
  }
  return text;
};

const CaseCard = ({ item, btnLabel }) => (
  <Link to={`/cases/${item.slug}`} className="case-card">
    <div className="case-card__tags">
      {item.serviceNames &&
        item.serviceNames.map((name, idx) => (
          <span key={idx} className="case-card__tag">
            {name}
          </span>
        ))}
    </div>
    <div className="case-card__text-wrap">
      <h3 className="title-small">{item.title}</h3>
      <div
        className="case-card__description body-medium"
        dangerouslySetInnerHTML={{
          __html: formatCaseDescription(item.description),
        }}
      />
    </div>
    <div className="case-card__image-wrap">
      {item.image && (
        <img src={item.image} alt={item.title} className="case-card__image" />
      )}
    </div>
    <div className="link-underline case-card__link">{btnLabel}</div>
  </Link>
);

export default function Cases() {
  const { sections, loading: pageLoading } = usePageSections("cases");
  const seoData = usePageSeo("cases");
  const { cases, services, loading: casesLoading } = useCasesPublished();
  const { locale } = useLocaleCurrent();
  const [activeFilter, setActiveFilter] = useState("all");
  const scrollRef = useRef(null);

  if (pageLoading) return <PageLoader />;

  const btnLabel = locale?.code === "ru" ? "Подробней" : "View case";

  const handleFilterClick = (id) => {
    setActiveFilter(id);

    if (scrollRef.current) {
      // Получаем значение офсета из CSS переменной (превращаем в число)
      const offset =
        parseInt(
          getComputedStyle(document.documentElement).getPropertyValue(
            "--scroll-top-offset"
          )
        ) || 0;
      const elementPosition =
        scrollRef.current.getBoundingClientRect().top + window.pageYOffset;

      window.scrollTo({
        top: elementPosition - offset,
        behavior: "smooth",
      });
    }
  };

  // Логика фильтрации кейсов по ID услуг
  const filteredCases =
    activeFilter === "all"
      ? cases
      : cases.filter((c) => c.serviceIds?.includes(activeFilter));

  return (
    <>
      {seoData && <Seo {...seoData} />}
      {sections.map((section) => {
        if (section.key === "c-hero") {
          return (
            <div key={section.id}>
              <section className="c-hero">
                <div className="container">
                  <div className="c-hero__text-wrap">
                    <h1>{section.title}</h1>
                    <p className="body-large">{section.subtitle}</p>
                  </div>
                </div>
              </section>
            </div>
          );
        }

        if (section.key === "c-cases-list") {
          return (
            <section key={section.id} className="s-cases-list" ref={scrollRef}>
              <div className="container c-cases-list__container">
                <div className="c-cases-list__filters-wrap">
                  <button
                    className={`btn-filter ${
                      activeFilter === "all" ? "btn-filter--active" : ""
                    }`}
                    onClick={() => handleFilterClick("all")}
                  >
                    {section.filters?.all_label || "All"}
                  </button>

                  {!casesLoading &&
                    services?.map((service) => (
                      <button
                        key={service.id}
                        className={`btn-filter ${
                          activeFilter === service.id
                            ? "btn-filter--active"
                            : ""
                        }`}
                        onClick={() => handleFilterClick(service.id)}
                      >
                        {service.title}
                      </button>
                    ))}
                </div>

                <div className="c-cases-list__grid">
                  {casesLoading ? (
                    <>
                      <CardLoader />
                      <CardLoader />
                      <CardLoader />
                    </>
                  ) : (
                    filteredCases.map((c) => (
                      <CaseCard key={c.id} item={c} btnLabel={btnLabel} />
                    ))
                  )}
                </div>
              </div>
            </section>
          );
        }

        return (
          <section
            key={section.id}
            style={{ border: "1px dashed red", padding: "10px" }}
          >
            <strong>Unknown section key:</strong> {section.key}
          </section>
        );
      })}
    </>
  );
}
