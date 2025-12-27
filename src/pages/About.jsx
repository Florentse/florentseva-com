import React from "react";

import { Link } from "react-router-dom";

import usePageSections from "../hooks/usePageSections";
import useCurrentLocale from "../hooks/useCurrentLocale";

import PageLoader from "../components/common/PageLoader";

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
                  <p className=" body-medium font-weight-medium a-philosophy__quote">{section.quote}</p>
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
                      <h3 className="body-medium font-weight-medium">{item.title}</h3>
                      <p className="body-small">{item.description}</p>
                    </div>
                  ))}
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
