import { createContext, useState, useEffect } from "react";
import useLocales from "../hooks/useLocales";

export const LocaleContext = createContext();

export function LocaleProvider({ children }) {
  const { locales, loading } = useLocales();
  const [currentLocale, setCurrentLocale] = useState(null);

  useEffect(() => {
    if (!loading && locales.length > 0 && !currentLocale) {
      // 1. Проверяем ручной выбор в localStorage
      const savedCode = localStorage.getItem("app_lang");

      // 2. Если в localStorage пусто, проверяем язык браузера
      let targetCode = savedCode;
      if (!targetCode) {
        const browserLang = navigator.language || navigator.userLanguage;
        if (browserLang.startsWith("ru")) {
          targetCode = "ru"; // Код должен совпадать с тем, что в вашей базе Airtable
        }
      }

      const foundLoc = locales.find((l) => l.code === targetCode);

      // 3. Берем найденный (из памяти или браузера), иначе дефолтный из базы, иначе первый попавшийся
      const finalLoc =
        foundLoc || locales.find((l) => l.is_default) || locales[0];

      setCurrentLocale(finalLoc);
    }
  }, [locales, loading, currentLocale]);

  // Смена языка:
  const changeLocale = (code) => {
    const found = locales.find((l) => l.code === code);
    if (found) {
      localStorage.setItem("app_lang", code);

      window.location.reload();
    }
  };

  return (
    <LocaleContext.Provider
      value={{
        locale: currentLocale,
        loading: loading || !currentLocale,
        changeLocale,
      }}
    >
      {children}
    </LocaleContext.Provider>
  );
}
