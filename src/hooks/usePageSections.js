//src/hooks/usePageSections.js

import { useEffect, useState } from "react";
import { fetchTable } from "../services/airtable";
import useCurrentLocale from "./useCurrentLocale";

export default function usePageSections(pageSlug) {
  const { locale, loading: localeLoading } = useCurrentLocale();

  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (localeLoading || !locale) return;

    Promise.all([
      fetchTable("Pages"),
      fetchTable("Page Sections"),
      fetchTable("Page Section Translations"),
    ]).then(([pages, pageSections, translations]) => {
      // 1. страница
      const page = pages.find((p) => p.slug === pageSlug);
      if (!page) {
        setSections([]);
        setLoading(false);
        return;
      }

      // 2. recordId секций страницы (ИЗ Pages)
      const pageSectionRecordIds = Array.isArray(page["Page Sections"])
        ? page["Page Sections"]
        : [];

      // 3. сами секции
      const sectionsOfPage = pageSections.filter(
        (s) =>
          pageSectionRecordIds.includes(s.recordId) &&
          (s.is_active === "checked" || s.is_active === true)
      );

      // 4. переводы по текущей локали
      const translationsByLocale = translations.filter(
        (t) =>
          Array.isArray(t["locale"]) && // в CSV поле 'locale'
          t["locale"].includes(locale.recordId)
      );

      // 5. склейка
      const result = sectionsOfPage
        .map((section) => {
          const translation = translationsByLocale.find(
            (t) =>
              Array.isArray(t["section"]) &&
              t["section"].includes(section.recordId)
          );

          if (!translation) return null;

          let contentData = {};
          const rawContent = translation["content_json"];

          if (rawContent) {
            try {
              // 1. Предварительная очистка
              const cleanJson = rawContent
                .replace(/\u00a0/g, " ")
                .replace(/\u201c|\u201d/g, '"')
                .replace(/\\_/g, "_")
                .replace(/'/g, '"')
                .replace(/,\s*([\]}])/g, "$1")
                .replace(/[\u0000-\u001F]+/g, " ")
                .trim();

              contentData = JSON.parse(cleanJson);
            } catch (e) {
              // 2. Если упало, выводим в консоль текст, чтобы вы могли его поправить в Airtable
              console.error(
                `Ошибка в JSON секции ${section.section_key}:`,
                e.message
              );
              console.log("Проблемный текст из базы:", rawContent);
            }
          }

          return {
            id: section.recordId,
            key: section.section_key,
            order: section.order,
            ...contentData,
          };
        })
        .filter(Boolean)
        .sort((a, b) => a.order - b.order);

      setSections(result);
      setLoading(false);
    });
  }, [pageSlug, locale, localeLoading]);

  return { sections, loading };
}
