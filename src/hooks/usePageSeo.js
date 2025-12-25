//src/hooks/useLocales.js

import { useEffect, useState } from "react";
import { fetchPageSeo } from "../services/airtable";

export default function usePageSeo(slug, lang = "en") {
  const [seo, setSeo] = useState(null);

  useEffect(() => {
    let isMounted = true;

    fetchPageSeo(slug, lang).then((data) => {
      if (isMounted) setSeo(data);
    });

    return () => {
      isMounted = false;
    };
  }, [slug, lang]);

  return seo;
}
