/**
 * A weak, cheap device signal, used only as one input to a rate-limit key.
 *
 * Explicitly not an identity system and not tracking. It is never stored on
 * this site, it goes to one endpoint that hashes it with a server secret, and
 * it exists so that clearing a cookie is not sufficient on its own to reset a
 * free-read quota.
 *
 * It is easily defeated, and that is accounted for rather than denied: Safari
 * and Firefox actively degrade these signals, incognito changes some of them,
 * and identical corporate machines collide with each other. The server treats
 * it as one of three signals for that reason, and the global spend ceiling,
 * not this, is what actually caps cost.
 *
 * No canvas or WebGL probing. Those raise the strength of the signal a little
 * and its privacy and consent profile a great deal, which is the wrong trade
 * for a quota on a free tool.
 */
/**
 * A stable per-browser id, kept in localStorage.
 *
 * Replaces the third-party cookie this used to lean on. A cookie set by the
 * app's domain and read from a request originating on the marketing domain is
 * exactly the pattern browsers now block by default, so it could never have
 * worked outside a permissive dev setup.
 *
 * Cleared whenever the visitor clears site data, which is fine: this is a
 * quota key, not an identity, and the server treats it as one weak signal
 * among several.
 */
export function visitorId(): string {
  if (typeof window === "undefined") return "";
  const KEY = "brains_visitor";
  try {
    const existing = window.localStorage.getItem(KEY);
    if (existing) return existing;
    const id =
      globalThis.crypto?.randomUUID?.() ??
      `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(KEY, id);
    return id;
  } catch {
    // Private modes can throw on localStorage access. The other signals still
    // apply, so this degrades rather than breaking submission.
    return "";
  }
}

export function deviceSignal(): string {
  if (typeof window === "undefined") return "";

  const parts = [
    navigator.userAgent,
    navigator.language,
    String(screen.width),
    String(screen.height),
    String(screen.colorDepth),
    String(new Date().getTimezoneOffset()),
    String(navigator.hardwareConcurrency ?? "-"),
  ];

  // djb2 again. The server salts and re-hashes; this only has to be stable
  // and compact, and shipping the raw values would be worse on every axis.
  let hash = 5381;
  const input = parts.join("|");
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) | 0;
  }
  return String(hash >>> 0);
}
