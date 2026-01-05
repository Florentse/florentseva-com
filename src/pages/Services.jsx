import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";

import usePageSections from "../hooks/usePageSections";
import useLocaleCurrent from "../hooks/useLocaleCurrent";
import useServicesPublished from "../hooks/useServicesPublished";

import usePageSeo from "../hooks/usePageSeo";
import Seo from "../components/Seo";

import StackLogos from "../components/common/StackLogos";
import PageLoader from "../components/common/PageLoader";
import CardLoader from "../components/common/CardLoader";

import "./Services.css";

const ServiceCard = ({ service, btnLabel }) => (
  <Link
    to={`/services/${service.slug}`}
    className="service-card"
    style={{ paddingTop: "1.25rem" }}
  >
    <div className="services-card__category-tags-list">
      {service.categories &&
        service.categories.map((catName, index) => (
          <p key={index} className="service-card__category-tag">
            {catName}
          </p>
        ))}
    </div>

    <h3 className="title-small">{service.title}</h3>
    <p className="body-medium">{service.description}</p>
    <div className="link-underline service-card__link">{btnLabel}</div>
  </Link>
);

export default function Services() {
  const { sections, loading: pageLoading } = usePageSections("services");
  const seoData = usePageSeo("services");
  const {
    services,
    categories,
    loading: servicesLoading,
  } = useServicesPublished();
  const { locale } = useLocaleCurrent();
  const [activeFilter, setActiveFilter] = useState("all");
  const scrollRef = useRef(null);

  if (pageLoading) return <PageLoader />;

  const btnLabel = locale?.code === "ru" ? "Подробней" : "View service";

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

  const filteredServices =
    activeFilter === "all"
      ? services
      : services.filter((service) =>
          service.categoryIds?.includes(activeFilter)
        );

  return (
    <>
      {seoData && <Seo {...seoData} />}
      {sections.map((section, index) => {
        // --- Секция HERO ---
        if (section.key === "s-hero") {
          return (
            <div key={section.id}>
              <section className="s-hero">
                <div className="container">
                  <div className="s-hero__text-wrap">
                    <h1>{section.title}</h1>
                    <p className="body-large">{section.subtitle}</p>
                  </div>
                </div>
              </section>
              {/* Логотипы стека сразу после Hero */}
              <StackLogos />
            </div>
          );
        }

        // --- Секция СПИСОК УСЛУГ ---
        if (section.key === "s-services-list") {
          return (
            <section
              key={section.id}
              className="s-services-list"
              ref={scrollRef}
            >
              <div className="container s-services-list__container">
                <div className="s-services-list__filters-wrap">
                  <button
                    className={`btn-filter ${
                      activeFilter === "all" ? "btn-filter--active" : ""
                    }`}
                    onClick={() => handleFilterClick("all")}
                  >
                    {section.filters?.all_label || "All"}
                  </button>

                  {!servicesLoading &&
                    categories.map((cat) => (
                      <button
                        key={cat.id}
                        className={`btn-filter ${
                          activeFilter === cat.id ? "btn-filter--active" : ""
                        }`}
                        onClick={() => handleFilterClick(cat.id)}
                      >
                        {cat.title}
                      </button>
                    ))}
                </div>

                <div className="s-services-list__grid">
                  {servicesLoading ? (
                    <>
                      <CardLoader />
                      <CardLoader />
                      <CardLoader />
                    </>
                  ) : (
                    filteredServices.map((service) => (
                      <ServiceCard
                        key={service.id}
                        service={service}
                        btnLabel={btnLabel}
                      />
                    ))
                  )}
                </div>
              </div>
            </section>
          );
        }

        // --- Заглушка для неизвестных секций ---
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
