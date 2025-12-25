import { createContext, useState, useEffect } from "react";
import useLocales from "../hooks/useLocales";

export const LocaleContext = createContext();

export function LocaleProvider({ children }) {
  const { locales, loading } = useLocales();
  const [currentLocale, setCurrentLocale] = useState(null);

  useEffect(() => {
    if (!loading && locales.length > 0 && !currentLocale) {
      // 1. Проверяем, есть ли сохраненный код языка в браузере
      const savedCode = localStorage.getItem("app_lang");
      const savedLoc = locales.find((l) => l.code === savedCode);

      // 2. Если есть — берем его, если нет — дефолтный из базы
      const defaultLoc =
        savedLoc || locales.find((l) => l.is_default) || locales[0];
      setCurrentLocale(defaultLoc);
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
