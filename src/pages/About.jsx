import React from "react";

import { Link } from "react-router-dom";

import usePageSections from "../hooks/usePageSections";
import useLocaleCurrent from "../hooks/useLocaleCurrent";

import PageLoader from "../components/common/PageLoader";

import aboutPhoto from "../assets/images/my-photo.png";

import "./About.css";

export default function About() {
  const { sections, loading } = usePageSections("about");

  if (loading) return <PageLoader />;

  return (
    <>
      {sections.map((section) => {
        // Секция Hero
        if (section.key === "a-hero") {
          return (
            <section key={section.id} className="a-hero">
              <div className="container">
                <div className="a-hero__text-wrap">
                  <h1 className="title-medium">{section.title}</h1>
                  <p className="body-large">{section.subtitle}</p>
                </div>
              </div>
            </section>
          );
        }

        // Секция Philosophy
        if (section.key === "a-philosophy") {
          return (
            <section key={section.id} className="a-philosophy">
              <div className="container">
                <div className="a-philosophy__wrap">
                  <p className=" body-medium font-weight-medium a-philosophy__quote">
                    {section.quote}
                  </p>
                  {section.author && (
                    <cite className=" body-small a-philosophy__author">
                      — {section.author}
                    </cite>
                  )}
                </div>
              </div>
            </section>
          );
        }

        // Секция Focus
        if (section.key === "a-focus") {
          return (
            <section key={section.id} className="a-focus">
              <div className="container">
                <h2 className="a-focus__title">{section.title}</h2>
                <div className="a-focus__grid">
                  {section.items?.map((item, idx) => (
                    <div key={idx} className="a-focus__card">
                      <h3 className="body-medium font-weight-medium">
                        {item.title}
                      </h3>
                      <p className="body-small">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          );
        }

        // Секция Experience
        if (section.key === "a-experience") {
          return (
            <section key={section.id} className="a-experience">
              <div className="container">
                <h2 className="a-experience__title title-medium">
                  {section.title_h2}
                </h2>
                <div className="a-experience__content">
                  <div className="a-experience__photo-wrap">
                    <img
                      src={aboutPhoto}
                      alt="Татьяна Флоренцева"
                      className="a-experience__photo"
                    />
                  </div>
                  <ul className="a-experience__list">
                    {section.items?.map((item, idx) => (
                      <li key={idx} className="a-experience__item">
                        <h3 className="body-medium font-weight-medium">
                          {item.h3}
                        </h3>
                        <p className="body-small">{item.p}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          );
        }

        // Секция CTA
        if (section.key === "a-cta") {
          return (
            <section key={section.id} className="a-cta">
              <div className="container a-cta__container">
                <div className="a-cta__title-wrap">
                  <p className="body-medium font-weight-medium">
                    {section.text}
                  </p>
                </div>
                <div className="btn-group">
                  {section.primary_cta && (
                    <Link
                      to={section.primary_cta.payload}
                      className="btn btn-primary btn-primary--invert"
                    >
                      {section.primary_cta.label}
                    </Link>
                  )}
                  {section.secondary_cta && (
                    <Link
                      to={section.secondary_cta.payload}
                      className="btn btn-secondary btn-secondary--invert"
                    >
                      {section.secondary_cta.label}
                    </Link>
                  )}
                </div>
              </div>
            </section>
          );
        }

        // Заглушка для неизвестных секций
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
