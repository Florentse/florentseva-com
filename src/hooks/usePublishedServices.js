// src/hooks/usePublishedServices.js

import { useState, useEffect } from "react";
import { fetchTable } from "../services/airtable";
import useCurrentLocale from "./useCurrentLocale";

export default function usePublishedServices() {
  const { locale, loading: localeLoading } = useCurrentLocale();
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]); // Состояние для категорий
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (localeLoading || !locale) return;

    Promise.all([
      fetchTable("Services"),
      fetchTable("Service Translations"),
      fetchTable("Service Categories"),
      fetchTable("Service Category Translations"),
    ]).then(([allServices, allTranslations, allCategories, allCatTranslations]) => {
      
      // 1. Подготовка активных категорий
      const activeCategories = allCategories
        .filter(cat => cat.is_active === "checked" || cat.is_active === true)
        .map(cat => {
          const trans = allCatTranslations.find(t => 
            Array.isArray(t.category) && t.category.includes(cat.recordId) &&
            Array.isArray(t.locale) && t.locale.includes(locale.recordId)
          );
          return {
            id: cat.recordId,
            title: trans ? trans.title : "No title",
            slug: cat.slug,
            order: Number(cat.order) || 0
          };
        })
        .sort((a, b) => a.order - b.order);

      const catMap = activeCategories.reduce((acc, cat) => {
        acc[cat.id] = cat.title;
        return acc;
      }, {});

      // 2. Подготовка услуг
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
            categoryIds: Array.isArray(s.categories) ? s.categories : [],
            categories: Array.isArray(s.categories)
              ? s.categories.map(id => catMap[id]).filter(Boolean)
              : [],
          };
        })
        .sort((a, b) => a.order - b.order);

      setCategories(activeCategories);
      setServices(published);
      setLoading(false);
    });
  }, [locale, localeLoading]);

  return { services, categories, loading }; // Теперь возвращаем и categories
}