import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { LocaleProvider } from "./context/LocaleContext";
import { Analytics } from "@vercel/analytics/react";

import App from "./App.jsx";
import "./styles/base.css";
import "./styles/variables.css";
import "./styles/global.css";
import "./styles/colors.css";
import "./styles/spacing.css";
import "./styles/typography.css";
import "./styles/buttons.css";
import "./styles/form.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HelmetProvider>
      <LocaleProvider>
        <App />
        <Analytics />
      </LocaleProvider>
    </HelmetProvider>
  </StrictMode>
);
