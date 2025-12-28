//src/hooks/useCasesPublished.js

import { useState, useEffect } from "react";
import { fetchTable } from "../services/airtable";
import useLocaleCurrent from "./useLocaleCurrent";

export default function useCasesPublished() {
  const { locale, loading: localeLoading } = useLocaleCurrent();
  const [cases, setCases] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (localeLoading || !locale) return;

    Promise.all([
      fetchTable("Cases"),
      fetchTable("Case Translations"),
      fetchTable("Services"),
      fetchTable("Service Translations"),
    ]).then(
      ([
        allCases,
        allCaseTranslations,
        allServices,
        allServiceTranslations,
      ]) => {
        // 1. Подготовка списка услуг для фильтров (только те, что переведены на текущий язык)
        const translatedServices = allServices
          .filter(
            (s) => s.is_published === "checked" || s.is_published === true
          )
          .map((s) => {
            const trans = allServiceTranslations.find(
              (t) =>
                Array.isArray(t.service) &&
                t.service.includes(s.recordId) &&
                Array.isArray(t.locale) &&
                t.locale.includes(locale.recordId)
            );
            return {
              id: s.recordId,
              title: trans ? trans.title : "No title",
              order: Number(s.order) || 0,
            };
          })
          .sort((a, b) => a.order - b.order);

        const serviceMap = translatedServices.reduce((acc, s) => {
          acc[s.id] = s.title;
          return acc;
        }, {});

        // 2. Подготовка кейсов
        const published = allCases
          .filter(
            (c) => c.is_published === "checked" || c.is_published === true
          )
          .map((c) => {
            const translation = allCaseTranslations.find(
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
              serviceIds: Array.isArray(c.services) ? c.services : [], // ID связанных услуг из Airtable
              serviceNames: Array.isArray(c.services)
                ? c.services.map((id) => serviceMap[id]).filter(Boolean)
                : [],
            };
          })
          .sort((a, b) => b.order - a.order);

        // 1. Собираем ID всех услуг, которые реально привязаны к опубликованным кейсам
        const usedServiceIds = new Set(
          published.flatMap((c) => c.serviceIds || [])
        );

        // 2. Фильтруем список услуг для фильтров, оставляя только задействованные
        const filteredServicesForFilters = translatedServices.filter((s) =>
          usedServiceIds.has(s.id)
        );

        setCases(published);
        setServices(filteredServicesForFilters); // Устанавливаем только используемые услуги
        setLoading(false);
      }
    );
  }, [locale, localeLoading]);

  return { cases, services, loading };
}
