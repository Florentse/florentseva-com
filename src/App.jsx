import { BrowserRouter, Routes, Route } from "react-router-dom";

import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import useGlobalSections from "./hooks/useGlobalSections";
import useLocaleCurrent from "./hooks/useLocaleCurrent";

import ScrollToTop from "./components/common/ScrollToTop";

import CookiesConsent from "./components/common/CookiesConsent";

import Home from "./pages/Home";
import Services from "./pages/Services";
import ServiceTemplate from "./pages/ServiceTemplate";
import Cases from "./pages/Cases";
import CaseTemplate from "./pages/CaseTemplate";
import Products from "./pages/Products";
import Blog from "./pages/Blog";
import About from "./pages/About";
import Contact from "./pages/Contact";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Brief from "./pages/Brief";
import NotFound from "./pages/NotFound";

export default function App() {
  const { sections, loading: globalLoading } = useGlobalSections([
    "header",
    "footer",
  ]);
  const { locale, changeLocale } = useLocaleCurrent();

  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="app-provider" data-lang={locale?.code || "en"}>
        <Header
          data={sections.header}
          currentLocale={locale?.code}
          onLocaleChange={changeLocale}
        />

        <main>
          <Routes>
            {/* Группа маршрутов без префикса (EN по умолчанию) */}
            <Route path="/">
              <Route index element={<Home />} />
              <Route path="services" element={<Services />} />
              <Route path="services/:slug" element={<ServiceTemplate />} />
              <Route path="cases" element={<Cases />} />
              <Route path="cases/:slug" element={<CaseTemplate />} />
              <Route path="products" element={<Products />} />
              <Route path="blog" element={<Blog />} />
              <Route path="about" element={<About />} />
              <Route path="contact" element={<Contact />} />
              <Route path="privacy-policy" element={<PrivacyPolicy />} />
              <Route path="brief" element={<Brief />} />
            </Route>

            {/* Группа маршрутов с префиксом /ru */}
            <Route path="/ru">
              <Route index element={<Home />} />
              <Route path="services" element={<Services />} />
              <Route path="services/:slug" element={<ServiceTemplate />} />
              <Route path="cases" element={<Cases />} />
              <Route path="cases/:slug" element={<CaseTemplate />} />
              <Route path="products" element={<Products />} />
              <Route path="blog" element={<Blog />} />
              <Route path="about" element={<About />} />
              <Route path="contact" element={<Contact />} />
              <Route path="privacy-policy" element={<PrivacyPolicy />} />
              <Route path="brief" element={<Brief />} />
            </Route>
          </Routes>
        </main>

        <Footer data={sections.footer} />
        <CookiesConsent />
      </div>
    </BrowserRouter>
  );
}
