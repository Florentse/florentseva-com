// src/hooks/useServiceData.js
import { useState, useEffect } from "react";
import { fetchTable } from "../services/airtable";
import useCurrentLocale from "./useCurrentLocale";

const useServiceData = (slug) => {
  const { locale, loading: localeLoading } = useCurrentLocale();
  const [sections, setSections] = useState(null);
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

  return { sections, loading };
};

export default useServiceData;
