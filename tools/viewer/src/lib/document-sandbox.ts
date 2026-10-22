const OPAQUE_HISTORY_ADAPTER = `<script data-kb-opaque-history-adapter>
(() => {
  const nativeReplaceState = window.history.replaceState.bind(window.history);
  window.history.replaceState = (state, unused, url) => {
    if (typeof url === "string" && url.startsWith("#")) return;
    return nativeReplaceState(state, unused, url);
  };
})();
</script>`;

// Ссылка «#gg» в srcdoc без allow-same-origin разрешается от адреса родителя: браузер
// уводит фрейм на /documents/<id>#gg, и вместо документа внутри грузится витрина.
// Обработчик сам прокручивает к цели и раскрывает свёрнутые <details> вокруг неё.
// location.hash не трогаем: в opaque-origin запись адреса и есть источник поломки.
const OPAQUE_ANCHOR_ADAPTER = `<script data-kb-opaque-anchor-adapter>
(() => {
  document.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const start = event.target;
    const link = start && typeof start.closest === "function" ? start.closest('a[href^="#"]') : null;
    if (!link) return;
    const target = (link.getAttribute("target") || "").trim().toLowerCase();
    if (target && target !== "_self") return;
    const hash = link.getAttribute("href") || "";
    event.preventDefault();
    if (hash === "#") {
      window.scrollTo(0, 0);
      return;
    }
    let id = hash.slice(1);
    try {
      id = decodeURIComponent(id);
    } catch (error) {}
    const element = document.getElementById(id) || document.getElementsByName(id)[0];
    if (!element) return;
    for (let node = element; node; node = node.parentElement) {
      if (node.tagName === "DETAILS") node.open = true;
    }
    element.scrollIntoView({ block: "start" });
  });
})();
</script>`;

/**
 * `about:srcdoc` gets an opaque origin when its sandbox omits `allow-same-origin`.
 * Chromium rejects fragment writes through `history.replaceState` in that mode, although
 * presentation navigation itself works. In-page links like `href="#gg"` resolve against the
 * parent URL and navigate the frame away from the document. Install both compatibility shims
 * at the start of `<head>` so document scripts keep running without weakening the sandbox.
 */
export function adaptDocumentHtmlForOpaqueSandbox(html: string): string {
  const head = /<head(?:\s[^>]*)?>/i.exec(html);
  if (!head) return html;
  const insertAt = head.index + head[0].length;
  return `${html.slice(0, insertAt)}${OPAQUE_HISTORY_ADAPTER}${OPAQUE_ANCHOR_ADAPTER}${html.slice(insertAt)}`;
}
