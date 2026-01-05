// src/components/Seo.jsx

import { Helmet } from "react-helmet-async";

export default function Seo({
  title,
  description,
  keywords,
  ogImage,
  ogType = "website",
  lang = "en",
  schemaData, // Для JSON-LD
}) {
  const siteName = "Florentseva"; 
  const currentUrl = window.location.href;

  return (
    <Helmet>
      <html lang={lang} />
      
      {/* Основные мета-теги */}
      {title && <title>{title}</title>}
      {description && <meta name="description" content={description} />}
      {keywords && <meta name="keywords" content={keywords} />}

      {/* Open Graph / Facebook */}
      <meta property="og:url" content={currentUrl} />
      <meta property="og:site_name" content={siteName} />
      {title && <meta property="og:title" content={title} />}
      {description && <meta property="og:description" content={description} />}
      {ogImage && <meta property="og:image" content={ogImage} />}
      <meta property="og:type" content={ogType} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      {title && <meta name="twitter:title" content={title} />}
      {description && <meta name="twitter:description" content={description} />}
      {ogImage && <meta name="twitter:image" content={ogImage} />}

      {/* Инструкции для ИИ и роботов */}
      <link rel="canonical" href={currentUrl} />

      {/* Структурированные данные (JSON-LD) для ИИ */}
      {schemaData && (
        <script type="application/ld+json">
          {JSON.stringify(schemaData)}
        </script>
      )}
    </Helmet>
  );
}