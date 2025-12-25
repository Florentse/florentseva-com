//src/hooks/useCurrentLocale.js

import { useContext } from "react";
import { LocaleContext } from "../context/LocaleContext";

export default function useCurrentLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useCurrentLocale must be used within a LocaleProvider");
  }
  return context;
}