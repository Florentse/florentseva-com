import { createContext, useState, useEffect } from "react";
import useLocales from "../hooks/useLocales";

export const LocaleContext = createContext();

export function LocaleProvider({ children }) {
  const { locales, loading } = useLocales();
  const [currentLocale, setCurrentLocale] = useState(null);

useEffect(() => {
    if (!loading && locales.length > 0) {
      // Определяем код из URL: если начинается с /ru — значит 'ru', иначе 'en'
      const isRussianPath = window.location.pathname.startsWith("/ru");
      const targetCode = isRussianPath ? "ru" : "en";

      const foundLoc = locales.find((l) => l.code === targetCode);
      // Если по коду не нашли, берем тот, где is_default: true
      const finalLoc = foundLoc || locales.find((l) => l.is_default) || locales[0];

      // Обновляем состояние только если язык действительно другой
      if (!currentLocale || currentLocale.code !== finalLoc.code) {
        setCurrentLocale(finalLoc);
      }
    }
  }, [locales, loading, window.location.pathname]); // Добавили слежение за путем

  const changeLocale = (code) => {
    const found = locales.find((l) => l.code === code);
    if (found) {
      const cleanPath = window.location.pathname.replace(/^\/ru/, "");
      // Если выбрали ru — добавляем префикс, если en — убираем (корень)
      const newPath = code === "ru" ? `/ru${cleanPath}` : (cleanPath || "/");

      // Сохраняем в Cookie для Middleware (Vercel)
      document.cookie = `app_lang=${code}; path=/; max-age=31536000`; 
      
      // Перенаправляем
      window.location.href = newPath;
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
