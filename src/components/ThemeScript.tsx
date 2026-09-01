const STORAGE_KEY = "brains-theme";

export function ThemeScript() {
  const script = `(function(){try{var t=localStorage.getItem("${STORAGE_KEY}");document.documentElement.setAttribute("data-theme",t==="dark"?"dark":"light")}catch(e){document.documentElement.setAttribute("data-theme","light")}})();`;
  return <script id="brains-theme" dangerouslySetInnerHTML={{ __html: script }} suppressHydrationWarning />;
}
