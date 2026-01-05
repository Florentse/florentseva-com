// src/components/common/CookiesConsent.jsx

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import useLocaleCurrent from "../../hooks/useLocaleCurrent";
import "./CookiesConsent.css";

const LABELS = {
  ru: {
    text: "Этот сайт использует файлы cookie и аналогичные технологии для улучшения пользовательского опыта, анализа трафика и обеспечения безопасности. Нажимая «Принять», вы соглашаетесь на сбор и обработку данных в соответствии с Политикой конфиденциальности.",
    link: "Политика конфиденциальности",
    btn: "Принять",
  },
  en: {
    text: "This website uses cookies and similar technologies to enhance your experience, analyze performance, and ensure security. By clicking 'Accept', you consent to the data collection and processing described in our Privacy Policy.",
    link: "Privacy Policy",
    btn: "Accept",
  },
};

export default function CookiesConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const { locale } = useLocaleCurrent();
  const labels = LABELS[locale?.code] || LABELS.en;

  useEffect(() => {
    // Проверяем, давал ли пользователь согласие ранее
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie-consent", "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="cookies-consent">
      <div className="cookies-consent__container">
        <p className="body-small">
          {labels.text}{" "}
          <Link to="/privacy-policy" className="link-cookies-consent">
            {labels.link}
          </Link>
        </p>
        <button className="btn btn-primary btn-small" onClick={handleAccept}>
          {labels.btn}
        </button>
      </div>
    </div>
  );
}
