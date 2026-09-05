/**
 * Tarayıcı ortamına, HTTPS/HTTP protokolüne ve env değişkenlerine göre dinamik WebSocket URL'i üretir.
 */

export function getWebSocketUrl(path: string): string {
  if (typeof window === "undefined") return "";

  const host = window.location.hostname || "localhost";
  const isLocalhost =
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.startsWith("192.168.") ||
    host === "0.0.0.0";

  // 1. Yerel geliştirmede (localhost) yerel WebSocket sunucusuna bağlan (ws://localhost:1999)
  if (isLocalhost && !process.env.NEXT_PUBLIC_FORCE_CLOUD_PARTY) {
    const port = process.env.NEXT_PUBLIC_PARTYKIT_PORT || "1999";
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `ws://${host}:${port}${cleanPath}`;
  }

  // 2. Canlı / Deploy ortamında PartyKit Cloud URL'ini kullan
  const customHost = process.env.NEXT_PUBLIC_PARTYKIT_HOST;
  if (customHost) {
    const isSecure =
      customHost.startsWith("https://") ||
      customHost.startsWith("wss://") ||
      window.location.protocol === "https:";
    const cleanHost = customHost.replace(/^https?:\/\//, "").replace(/^wss?:\/\//, "");
    const protocol = isSecure ? "wss:" : "ws:";
    return `${protocol}//${cleanHost}${path.startsWith("/") ? path : `/${path}`}`;
  }

  // 3. Varsayılan dinamik çözümleme
  const isHttps = window.location.protocol === "https:";
  const protocol = isHttps ? "wss:" : "ws:";
  const port = process.env.NEXT_PUBLIC_PARTYKIT_PORT || "1999";
  const formattedPort = port ? `:${port}` : "";
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  return `${protocol}//${host}${formattedPort}${cleanPath}`;
}
