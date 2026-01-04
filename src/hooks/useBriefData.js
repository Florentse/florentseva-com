import { useState, useEffect } from "react";
import { fetchTable } from "../services/airtable";
import useLocaleCurrent from "./useLocaleCurrent";

export default function useBriefData() {
  const { locale, loading: localeLoading } = useLocaleCurrent();
  const [data, setData] = useState({
    categories: [],
    services: [],
    currencies: [],
    budgets: [],
    deadlines: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (localeLoading || !locale) return;
    setLoading(true);

    Promise.all([
      fetchTable("Service Categories"),
      fetchTable("Service Category Translations"),
      fetchTable("Services"),
      fetchTable("Service Translations"),
      fetchTable("Currencies"),
      fetchTable("Brief Budget"),
      fetchTable("Brief Budget Translations"),
      fetchTable("Brief Deadlines"),
      fetchTable("Brief Deadline Translations"),
    ]).then(
      ([
        allCats, allCatTrans,
        allServs, allServTrans,
        allCurrencies,
        allBudgets, allBudgetTrans,
        allDeadlines, allDeadlineTrans,
      ]) => {
        const localeId = locale.recordId;

        // 1. Валюты: добавляем id для связи с компонентом 
        const currencies = allCurrencies
          .filter(curr => Array.isArray(curr.visible_in_locales) && curr.visible_in_locales.includes(localeId))
          .map(curr => ({ ...curr, id: curr.recordId }));

        // 2. Категории [cite: 12, 14]
        const categories = allCats
          .filter(cat => cat.is_active === true || cat.is_active === "checked")
          .map(cat => {
            const trans = allCatTrans.find(t => t.locale_id_hidden?.[0] === localeId && t.category_id_hidden?.[0] === cat.recordId);
            return {
              id: cat.recordId,
              title: trans ? trans.title : "No title",
              description: trans ? trans.description : "",
              order: Number(cat.order) || 0,
              exclusionGroup: cat.brief_exclusion_group || [],
            };
          }).sort((a, b) => a.order - b.order);

        // 3. Услуги [cite: 16, 17]
        const services = allServs.map(s => {
          const trans = allServTrans.find(
            (t) =>
              t.locale_id_hidden?.[0] === localeId &&
              t.service_id_hidden?.[0] === s.recordId
          );
          return {
            id: s.recordId,
            categoryIds: Array.isArray(s.categories) ? s.categories : [],
            title: trans ? trans.title : "No title",
            description: trans ? trans.about_service || "" : "",
            order: Number(s.order) || 0, // Извлекаем порядок из Airtable
            exclusionGroup: s.brief_exclusion_group || [],
          };
        }).sort((a, b) => a.order - b.order); // Сортируем услуги по порядку

        // 4. Сроки [cite: 8, 10]
        const deadlines = allDeadlines
          .map(d => {
            const trans = allDeadlineTrans.find(t => t.locale_id_hidden?.[0] === localeId && t.deadline_id_hidden?.[0] === d.recordId);
            return {
              id: d.recordId,
              title: trans ? trans.title : "—",
              order: Number(d.sort_order) || 0,
            };
          }).sort((a, b) => a.order - b.order);

        // 5. Бюджеты: мапим текст из поля 'title' переводов [cite: 5, 7]
        const budgets = allBudgets.map(b => {
          const translations = allBudgetTrans.filter(t => t.locale_id_hidden?.[0] === localeId && t.budget_id_hidden?.[0] === b.recordId);
          const budgetTextsByCurrency = translations.reduce((acc, t) => {
            const currId = t.currency_id_hidden?.[0];
            if (currId) acc[currId] = t.title || ""; // Поле 'title' из таблицы переводов бюджета 
            return acc;
          }, {});
          return {
            id: b.recordId,
            order: Number(b.sort_order) || 0,
            budgetTextsByCurrency
          };
        }).sort((a, b) => a.order - b.order);

        setData({ categories, services, currencies, budgets, deadlines });
        setLoading(false);
      }
    );
  }, [locale, localeLoading]);

  return { ...data, loading };
}