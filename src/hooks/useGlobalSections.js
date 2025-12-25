//src/hooks/useGlobalSections.js

import { useEffect, useState } from "react";
import { fetchTable } from "../services/airtable";
import useCurrentLocale from "./useCurrentLocale";

export default function useGlobalSections(keys) {
  const { locale, loading: localeLoading } = useCurrentLocale();
  const [sections, setSections] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (localeLoading || !locale) return;

    Promise.all([
      fetchTable("Page Sections"),
      fetchTable("Page Section Translations"),
    ]).then(([allSections, allTranslations]) => {
      const found = {};
      
      keys.forEach(key => {
        const section = allSections.find(s => s.section_key === key);
        if (!section) return;

        const translation = allTranslations.find(t => 
          Array.isArray(t.section) && t.section.includes(section.recordId) &&
          Array.isArray(t.locale) && t.locale.includes(locale.recordId)
        );

        if (translation?.content_json) {
          try {
            const cleanJson = translation.content_json
              .replace(/\u00a0/g, " ")
              .replace(/\u201c|\u201d/g, '"')
              .replace(/\\_/g, "_") 
              .replace(/'/g, '"')
              .replace(/,\s*([\]}])/g, "$1")
              .replace(/[\u0000-\u001F]+/g, " ")
              .trim();
            found[key] = JSON.parse(cleanJson);
          } catch (e) {
            console.error(`Error parsing global section ${key}:`, e);
          }
        }
      });

      setSections(found);
      setLoading(false);
    });
  }, [locale, localeLoading, JSON.stringify(keys)]);

  return { sections, loading };
}