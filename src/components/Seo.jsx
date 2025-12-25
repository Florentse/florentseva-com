//src/components/Seo.jsx

import { Helmet } from "react-helmet-async";

export default function Seo({
  title,
  description,
  keywords,
  lang = "en",
}) {
  return (
    <Helmet>
      <html lang={lang} />
      {title && <title>{title}</title>}
      {description && (
        <meta name="description" content={description} />
      )}
      {keywords && <meta name="keywords" content={keywords} />}
    </Helmet>
  );
}
