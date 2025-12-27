import { useState, useEffect } from "react";
import { fetchTable } from "../services/airtable";
import useCurrentLocale from "./useCurrentLocale";

export default function useSingleCase(slug) {
  const { locale, loading: localeLoading } = useCurrentLocale();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (localeLoading || !locale || !slug) return;

    setLoading(true);

    Promise.all([
      fetchTable("Cases"),
      fetchTable("Case Translations"),
      fetchTable("Services"),
      fetchTable("Service Translations"),
    ]).then(([allCases, allTranslations, allServices, allServiceTranslations]) => {
      // 1. Ищем базовую запись кейса по slug
      const baseCase = allCases.find((c) => c.slug === slug);

      if (!baseCase) {
        setCaseData(null);
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

      // 3. Собираем названия связанных услуг (теги)
      const caseServices = Array.isArray(baseCase.services)
        ? baseCase.services.map(serviceId => {
            const sTrans = allServiceTranslations.find(st => 
              Array.isArray(st.service) && st.service.includes(serviceId) &&
              Array.isArray(st.locale) && st.locale.includes(locale.recordId)
            );
            return sTrans ? sTrans.title : null;
          }).filter(Boolean)
        : [];

      setCaseData({
        id: baseCase.recordId,
        slug: baseCase.slug,
        title: translation ? translation.title : baseCase.title,
        description: translation ? translation.description : "",
        services: caseServices,
        image: baseCase.card_image?.[0]?.url || "",
        // Здесь можно добавить другие поля из Airtable (например, client, year, site_link)
      });
      
      setLoading(false);
    });
  }, [slug, locale, localeLoading]);

  return { caseData, loading };
}