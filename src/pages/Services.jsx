import React from "react";

import { Link } from "react-router-dom";

import usePageSections from "../hooks/usePageSections";
import useCurrentLocale from "../hooks/useCurrentLocale";
import usePublishedServices from "../hooks/usePublishedServices";

import StackLogos from "../components/common/StackLogos";
import PageLoader from "../components/common/PageLoader";
import CardLoader from "../components/common/CardLoader";

import "./Services.css";

const ServicesHero = ({ data }) => (
  <section className="s-hero">
    <div className="container">
      <div className="s-hero__text-wrap">
        <h1>{data.title}</h1>
        <p className="body-large">{data.subtitle}</p>
      </div>
    </div>
  </section>
);

const ServiceCard = ({ service, btnLabel }) => (
  <Link
    to={`/services/${service.slug}`}
    className="service-card"
    style={{ paddingTop: "1.25rem" }}
  >
    <div className="services-card__category-tags-list">
      <p className="service-card__category-tag">category-tag</p>
    </div>

    <h3 className="title-small">{service.title}</h3>
    <p className="body-medium">{service.description}</p>
    <div className="link-underline service-card__link">{btnLabel}</div>
  </Link>
);

const ServicesList = ({ data }) => {
  const { services, loading } = usePublishedServices();
  const { locale } = useCurrentLocale();

  const btnLabel = locale?.code === "ru" ? "Подробней" : "View service";

  return (
    <section className="s-services-list">
      <div className="container s-services-list__container">
        <div className="s-services-list__filters-wrap">
          <button className="btn-filter btn-filter--active">
            {data.filters.all_label}
          </button>
        </div>

        <div className="s-services-list__grid">
          {loading ? (
            <>
              <CardLoader />
              <CardLoader />
              <CardLoader />
            </>
          ) : (
            services.map((service) => (
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
};

const DefaultSection = ({ data }) => (
  <section style={{ border: "1px dashed red", padding: "10px" }}>
    <strong>Unknown section key:</strong> {data.key}
  </section>
);

const SECTION_COMPONENTS = {
  "s-hero": ServicesHero,
  "s-services-list": ServicesList,
};

export default function Services() {
  const { sections, loading } = usePageSections("services");

  if (loading) return <PageLoader />;

  return (
    <main>
      {sections.map((section, index) => {
        const Component = SECTION_COMPONENTS[section.key] || DefaultSection;
        return (
          <div key={section.id}>
            <Component data={section} />
            {index === 0 && <StackLogos />}
          </div>
        );
      })}
    </main>
  );
}
