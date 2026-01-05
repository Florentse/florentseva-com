//src/hooks/useCaseSinglePage.js

import { useState, useEffect } from "react";
import { fetchTable } from "../services/airtable";
import useLocaleCurrent from "./useLocaleCurrent";

export default function useCaseSinglePage(slug) {
  const { locale, loading: localeLoading } = useLocaleCurrent();
  const [caseData, setCaseData] = useState(null);
  const [seo, setSeo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (localeLoading || !locale || !slug) return;

    setLoading(true);

    Promise.all([
      fetchTable("Cases"),
      fetchTable("Case Translations"),
      fetchTable("Services"),
      fetchTable("Service Translations"),
      fetchTable("Case Gallery"),
    ]).then(
      ([
        allCases,
        allTranslations,
        allServices,
        allServiceTranslations,
        allGallery,
      ]) => {
        // 1. Ищем базовую запись кейса по slug
        const baseCase = allCases.find((c) => c.slug === slug);

        if (!baseCase) {
          setCaseData(null);
          setSeo(null);
          setLoading(false);
          return;
        }

        // 2. Ищем перевод для этого кейса
        const translation = allTranslations.find(
          (t) =>
            Array.isArray(t.case) &&
            t.case.includes(baseCase.recordId) &&
            Array.isArray(t.locale) &&
            t.locale.includes(locale.recordId)
        );

        // Формируем SEO данные
        setSeo({
          title: baseCase.title, // Берем общий заголовок из Cases
          description: translation?.meta_description || "", // Из Case Translations
          ogImage: baseCase.open_graph?.[0]?.url || null, // Из Cases
          lang: locale.code
        });

        // 3. Собираем названия связанных услуг 
        const caseServices = Array.isArray(baseCase.services)
          ? baseCase.services
              .map((serviceId) => {
                // Находим базовую запись услуги, чтобы достать slug
                const baseService = allServices.find(
                  (s) => s.recordId === serviceId
                );
                // Находим перевод названия
                const sTrans = allServiceTranslations.find(
                  (st) =>
                    Array.isArray(st.service) &&
                    st.service.includes(serviceId) &&
                    Array.isArray(st.locale) &&
                    st.locale.includes(locale.recordId)
                );

                if (!baseService) return null;

                return {
                  title: sTrans ? sTrans.title : baseService.title,
                  slug: baseService.slug,
                };
              })
              .filter(Boolean)
          : [];

        const gallery = allGallery
          .filter(
            (item) =>
              Array.isArray(item.case) && item.case.includes(baseCase.recordId)
          )
          .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))
          .map((item) => ({
            url: item.image?.[0]?.url || "",
            alt: item.alt_text || baseCase.title,
          }));

        setCaseData({
          id: baseCase.recordId,
          slug: baseCase.slug,
          title: baseCase.title,
          description: translation ? translation.description : "",
          task: translation ? translation.task : "",
          solution: translation ? translation.solution : "",
          ctaText: translation ? translation.cta_text : "",
          metaDescription: translation ? translation.meta_description : "",
          year: baseCase.year,
          liveUrl: baseCase.live_url,
          cardImage: baseCase.card_image?.[0]?.url || "",
          heroImage: baseCase.hero_image?.[0]?.url || "",
          ogImage: baseCase.open_graph?.[0]?.url || "",
          services: caseServices,
          gallery: gallery,
        });

        setLoading(false);
      }
    );
  }, [slug, locale, localeLoading]);

  return { caseData, seo,loading };
}
