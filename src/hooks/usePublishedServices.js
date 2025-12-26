// src/hooks/usePublishedServices.js

import { useState, useEffect } from "react";
import { fetchTable } from "../services/airtable";
import useCurrentLocale from "./useCurrentLocale";

export default function usePublishedServices() {
  const { locale, loading: localeLoading } = useCurrentLocale();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (localeLoading || !locale) return;

    Promise.all([
      fetchTable("Services"),
      fetchTable("Service Translations"),
    ]).then(([allServices, allTranslations]) => {
      const published = allServices
        .filter((s) => s.is_published === "checked" || s.is_published === true)
        .map((s) => {
          const translation = allTranslations.find(
            (t) =>
              Array.isArray(t.service) &&
              t.service.includes(s.recordId) &&
              Array.isArray(t.locale) &&
              t.locale.includes(locale.recordId)
          );

          return {
            id: s.recordId,
            slug: s.slug,
            order: Number(s.order) || 0,
            title: translation ? translation.title : "No title",
            description: translation ? translation.about_service : "",
          };
        })
        .sort((a, b) => a.order - b.order);

      setServices(published);
      setLoading(false);
    });
  }, [locale, localeLoading]);

  return { services, loading };
}