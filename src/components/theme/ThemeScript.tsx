import { THEME_STORAGE_KEY } from "@/lib/theme";

// Runs synchronously before first paint — must not use next/script
const themeScript = `(function(){try{var s=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});var d=s==="light"?"light":"dark";if(d==="dark"){document.documentElement.classList.add("dark")}else{document.documentElement.classList.remove("dark")}}catch(e){}})();`;

export default function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{ __html: themeScript }}
    />
  );
}
