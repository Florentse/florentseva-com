// src/pages/Home.jsx

import { Link } from "react-router-dom";

import usePageSections from "../hooks/usePageSections";
import useCurrentLocale from "../hooks/useCurrentLocale";
import usePopularServices from "../hooks/usePopularServices";
import useSelectedCases from "../hooks/useSelectedCases";

import StackLogos from "../components/common/StackLogos";
import PageLoader from "../components/common/PageLoader";
import CardLoader from "../components/common/CardLoader";

import "./Home.css";

const Hero = ({ data }) => (
  <section className="h-hero">
    <div className="container h-hero__container">
      <div className="h-hero__heading-wrap">
        <h1>{data.title}</h1>
      </div>
      <div className="h-hero__descr-wrap">
        <p className="body-large">{data.subtitle}</p>
      </div>
      <div className="btn-group">
        {data.primary_cta && (
          <button className="btn btn-primary">{data.primary_cta.label}</button>
        )}

        {data.secondary_cta && (
          <button className="btn btn-secondary">
            {data.secondary_cta.label}
          </button>
        )}
      </div>
    </div>
  </section>
);

const ServiceCard = ({ service, btnLabel }) => (
  <Link to={`/services/${service.slug}`} className="service-card">
    <h3 className="title-small">{service.title}</h3>
    <p className="body-medium">{service.description}</p>
    <div className="link-underline service-card__link">{btnLabel}</div>
  </Link>
);

const PopularServices = ({ data }) => {
  const { services, loading } = usePopularServices();
  const { locale } = useCurrentLocale();

  // Определяем текст кнопки на основе кода текущей локали
  const btnLabel = locale?.code === "ru" ? "Подробней" : "View service";

  return (
    <section className="h-services">
      <div className="container h-services__container">
        <div className="h-services__info-wrap">
          <h2 className="title-medium">{data.title}</h2>
          {data.subtitle && <p className="body-medium">{data.subtitle}</p>}
        </div>

        <div className="h-services__selected-services">
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

        <div className="btn-group">
          <Link to="/services" className="btn btn-secondary">{data.cta.label}</Link>

        </div>
      </div>
    </section>
  );
};

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

const SelectedCases = ({ data }) => {
  const { cases, loading } = useSelectedCases();
  const { locale } = useCurrentLocale();

  const btnLabel = locale?.code === "ru" ? "Подробнее" : "View case";

  return (
    <section className="h-cases">
      <div className="container h-cases__container">
        <h2 className="title-medium">{data.title}</h2>

        <div className="h-cases__grid">
          {loading ? (
            <>
              <CardLoader />
              <CardLoader />
            </>
          ) : (
            cases.map((item) => (
              <CaseCard key={item.id} item={item} btnLabel={btnLabel} />
            ))
          )}
        </div>

        {data.cta && (
          <Link to={data.cta.payload} className="btn btn-secondary">
            {data.cta.label}
          </Link>
        )}
      </div>
    </section>
  );
};

const BigText = ({ data }) => (
  <section className="h-big-text">
    <div className="container">
      <div className="h-big-text__text-wrap">
        {data.text && <p className="title-small">{data.text}</p>}
      </div>
    </div>
  </section>
);

const Process = ({ data }) => (
  <section className="h-process">
    <div className="container">
      <div className="h-process__heading-wrap">
        <h2>{data.title}</h2>
      </div>
      {data.items && (
        <div className="h-process__list">
          {data.items.map((item, index) => (
            <div key={index} className="h-process__item">
              <strong>{item.title}</strong>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  </section>
);

const Cta = ({ data }) => (
  <section className="cta">
    <div className="container cta__container">
      <div className="h-cta__title-wrap">
        <h3>{data.text}</h3>
      </div>
      <div className="btn-group">
        {data.primary_cta && (
          <button className="btn btn-primary">{data.primary_cta.label}</button>
        )}
        {data.secondary_cta && (
          <button className="btn btn-secondary">
            {data.secondary_cta.label}
          </button>
        )}
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
  "h-hero": Hero,
  "h-cta": Cta,
  "h-popular-services": PopularServices,
  "h-selected-cases": SelectedCases,
  "h-big-text": BigText,
  "h-process": Process,
};

export default function Home() {
  const { sections, loading } = usePageSections("home");

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
