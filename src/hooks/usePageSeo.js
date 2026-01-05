// src/hooks/usePageSeo.js

import { useEffect, useState } from "react";
import { fetchPageSeo } from "../services/airtable";
import useLocaleCurrent from "./useLocaleCurrent"; // Импортируем контекст

export default function usePageSeo(slug) {
  const [seo, setSeo] = useState(null);
  const { locale, loading: localeLoading } = useLocaleCurrent();

  useEffect(() => {
    // Ждем, пока загрузятся данные о локали из контекста
    if (localeLoading || !locale?.recordId) return;

    let isMounted = true;

    // Передаем slug страницы и recordId текущего языка
    fetchPageSeo(slug, locale.recordId).then((data) => {
      if (isMounted && data) {
        // Добавляем код языка (ru/en) в объект, чтобы Seo.jsx прописал <html lang="...">
        setSeo({ ...data, lang: locale.code });
      }
    });

    return () => {
      isMounted = false;
    };
  }, [slug, locale?.recordId, localeLoading]); // Перезапускаем при смене страницы или языка

  return seo;
}