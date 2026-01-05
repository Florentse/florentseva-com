// src/hooks/useServiceSinglePage.js

import { useState, useEffect } from "react";
import { fetchTable } from "../services/airtable";
import useLocaleCurrent from "./useLocaleCurrent";

const useServiceSinglePage = (slug) => {
  const { locale, loading: localeLoading } = useLocaleCurrent();
  const [sections, setSections] = useState(null);
  const [seo, setSeo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (localeLoading || !locale || !slug) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const [allServices, allTranslations, allProcesses, allFaqs] =
          await Promise.all([
            fetchTable("Services"),
            fetchTable("Service Translations"),
            fetchTable("Service Process Steps"),
            fetchTable("Service FAQs"),
          ]);

        const currentService = allServices.find((s) => s.slug === slug);

        if (!currentService) {
          setSections(null);
          return;
        }

        const sId = currentService.recordId;

        const translation = allTranslations.find(
          (t) =>
            Array.isArray(t.service) &&
            t.service.includes(sId) &&
            Array.isArray(t.locale) &&
            t.locale.includes(locale.recordId)
        );

        // Формируем SEO-данные из полей перевода услуги
        if (translation) {
          setSeo({
            title: translation.title,
            description: translation.about_service,
            ogImage: translation.open_graph?.[0]?.url || null,
            lang: locale.code
          });
        }

        const processes = allProcesses
          .filter(
            (p) =>
              Array.isArray(p.service) &&
              p.service.includes(sId) &&
              Array.isArray(p.locale) &&
              p.locale.includes(locale.recordId)
          )
          .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));

        const faqs = allFaqs
          .filter(
            (f) =>
              Array.isArray(f.service) &&
              f.service.includes(sId) &&
              Array.isArray(f.locale) &&
              f.locale.includes(locale.recordId)
          )
          .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));

        const data = [
          {
            key: "s-hero",
            data: {
              title: translation?.title || "No title",
              about: translation?.about_service || "",
            },
          },
          { key: "s-quote", data: { quote: translation?.quote || "" } },
          {
            key: "s-solutions",
            data: { content: translation?.solutions || "" },
          },
          { key: "s-process", data: { items: processes } },
          { key: "faqs", data: { items: faqs } },
          { key: "cta", data: { text: translation?.get_in_touch_text || "" } },
        ];

        setSections(data);
      } catch (err) {
        // Ошибка обрабатывается без лишнего логирования
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [slug, locale, localeLoading]);

  return { sections, seo, loading };
};

export default useServiceSinglePage;
