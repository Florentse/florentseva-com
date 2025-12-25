import { useState, useEffect } from "react";
import { fetchTable } from "../services/airtable";
import useCurrentLocale from "./useCurrentLocale";

export default function useSelectedCases() {
  const { locale, loading: localeLoading } = useCurrentLocale();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (localeLoading || !locale) return;

    Promise.all([
      fetchTable("Cases"),
      fetchTable("Case Translations"),
    ]).then(([allCases, allTranslations]) => {
      const selected = allCases
        .filter((c) => c.is_selected === "checked" || c.is_selected === true)
        .map((c) => {
          const translation = allTranslations.find(
            (t) =>
              Array.isArray(t.case) &&
              t.case.includes(c.recordId) &&
              Array.isArray(t.locale) &&
              t.locale.includes(locale.recordId)
          );

          return {
            id: c.recordId,
            slug: c.slug,
            order: Number(c.order) || 0,
            image: c.card_image?.[0]?.url || "", 
            title: c.title,
            description: translation ? translation.description : "", 
          };
        })
        .sort((a, b) => a.order - b.order);

      setCases(selected);
      setLoading(false);
    });
  }, [locale, localeLoading]);

  return { cases, loading };
}