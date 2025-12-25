import { BrowserRouter, Routes, Route } from "react-router-dom";

import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import useGlobalSections from "./hooks/useGlobalSections";
import useCurrentLocale from "./hooks/useCurrentLocale";

import Home from "./pages/Home";
import Services from "./pages/Services";
import Cases from "./pages/Cases";
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
  const { locale, changeLocale } = useCurrentLocale();

  return (
    <BrowserRouter>
      <div className="app-provider" data-lang={locale?.code || "en"}>
        <Header
          data={sections.header}
          currentLocale={locale?.code}
          onLocaleChange={changeLocale}
        />

        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/services" element={<Services />} />
            <Route path="/cases" element={<Cases />} />
            <Route path="/products" element={<Products />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/brief" element={<Brief />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        <Footer data={sections.footer} />
      </div>
    </BrowserRouter>
  );
}
