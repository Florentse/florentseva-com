import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import "./Header.css";

export default function Header({ data, currentLocale, onLocaleChange }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleLabels = {
    ru: { open: "Меню", close: "Закрыть" },
    en: { open: "Menu", close: "Close" },
  };
  const labels = toggleLabels[currentLocale] || toggleLabels.en;

  if (!data) return null;

  return (
    <header className={`header ${isOpen ? "is-menu-open" : ""}`}>
      <div className="container header__container">
        <Link to={data.logo.payload} className="header__logo">
          {data.logo.text}
        </Link>

        {/* Кнопка переключения для мобильных */}
        <button className="header__toggle" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? labels.close : labels.open}
        </button>

        {/* Обертка, которая будет сворачиваться */}
        <div className="header__content">
          <nav className="header__nav">
            {data.menu.map((item, idx) => (
              <NavLink
                key={idx}
                to={item.payload}
                className={({ isActive }) =>
                  `header__link ${isActive ? "header__link--active" : ""}`
                }
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="header__actions">
            {data.language_switcher?.enabled && (
              <div className="lang-switcher">
                {data.language_switcher.items.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      onLocaleChange(lang.code);
                      setIsOpen(false);
                    }}
                    className={`lang-btn ${
                      currentLocale === lang.code ? "active" : ""
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
            {data.cta && (
              <Link
                to={data.cta.payload}
                className="btn btn-secondary"
                onClick={() => setIsOpen(false)}
              >
                {data.cta.label}
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
