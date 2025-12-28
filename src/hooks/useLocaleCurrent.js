//src/hooks/useLocaleCurrent.js

import { useContext } from "react";
import { LocaleContext } from "../context/LocaleContext";

export default function useLocaleCurrent() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocaleCurrent must be used within a LocaleProvider");
  }
  return context;
}