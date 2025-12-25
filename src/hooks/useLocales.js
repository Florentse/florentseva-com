//src/hooks/useLocales.js

import { useEffect, useState } from "react";
import { fetchTable } from "../services/airtable";

export default function useLocales() {
  const [locales, setLocales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTable("Locales")
      .then((data) => {
        setLocales(data);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return {
    locales,
    loading,
  };
}
