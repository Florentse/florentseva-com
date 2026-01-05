import React from "react";
import useLocaleCurrent from "../hooks/useLocaleCurrent";


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

  const sectionStyle = {
    flexGrow: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center"
  };

  const containerStyle = {
    flexGrow: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "1rem",
    textAlign: "center"
  };

  return (
    <section style={sectionStyle} className="not-found">
      <div style={containerStyle} className="container">
        <h1 className="title-large">{data.title}</h1>
        <p className="body-large">{data.lastUpdated}</p>
        <a href="/" className="link-underline">
          {data.button}
        </a>
      </div>
    </section>
  );
}