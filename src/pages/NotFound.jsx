import React from "react";
import useLocaleCurrent from "../hooks/useLocaleCurrent";
import "./PrivacyPolicy.css";

import PageLoader from "../components/common/PageLoader";

const CONTENT = {
  ru: {
    title: "404",
    lastUpdated: "Страница не найдена",
    button: "Вернуться на главную",
  },
  en: {
    title: "404",
    lastUpdated: "Page not found",
    button: "Return to homepage",
  },
};

export default function NotFound() {
  const { locale } = useLocaleCurrent();
  const data = CONTENT[locale?.code] || CONTENT.en;
  return (
    <div>
      <section className="404">
        <div className="container">
          <h1 className="title-large 404__title">404</h1>
          <p className="body-large 404__subtitle">Page not found</p>
          <a href="/" className="button 404__button">
            Return to homepage
          </a>
        </div>
      </section>
    </div>
  );
}
