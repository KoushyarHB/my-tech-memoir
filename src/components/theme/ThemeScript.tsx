import Script from "next/script";
import { THEME_STORAGE_KEY } from "@/lib/theme";

// Default to dark if no preference is stored
const themeScript = `
(function () {
  try {
    var storageKey = ${JSON.stringify(THEME_STORAGE_KEY)};
    var stored = localStorage.getItem(storageKey);
    var resolved =
      stored === "light"
        ? "light"
        : stored === "dark"
          ? "dark"
          : "dark"; /* default: dark */

    if (resolved === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  } catch (e) {}
})();
`;

export default function ThemeScript() {
  return (
    <Script id="theme-init" strategy="beforeInteractive">
      {themeScript}
    </Script>
  );
}
