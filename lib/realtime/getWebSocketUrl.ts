/**
 * Tarayıcı ortamına, HTTPS/HTTP protokolüne ve env değişkenlerine göre dinamik WebSocket URL'i üretir.
 */

export function getWebSocketUrl(path: string): string {
  if (typeof window === "undefined") return "";

  // 1. Eğer özel bir WS Host / Cloud URL tanımlanmışsa öncelikli kullan
  const customHost = process.env.NEXT_PUBLIC_PARTYKIT_HOST;
  if (customHost) {
    const isSecure = customHost.startsWith("https://") || customHost.startsWith("wss://") || window.location.protocol === "https:";
    const cleanHost = customHost.replace(/^https?:\/\//, "").replace(/^wss?:\/\//, "");
    const protocol = isSecure ? "wss:" : "ws:";
    return `${protocol}//${cleanHost}${path.startsWith("/") ? path : `/${path}`}`;
  }

  // 2. Tarayıcının mevcut host ve protokolüne göre dinamik çözümle
  const host = window.location.hostname || "localhost";
  const port = process.env.NEXT_PUBLIC_PARTYKIT_PORT || "1999";
  const isHttps = window.location.protocol === "https:";
  const protocol = isHttps ? "wss:" : "ws:";

  // Eğer localhost veya yerel IP ise portu ekle
  const formattedPort = port ? `:${port}` : "";
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  return `${protocol}//${host}${formattedPort}${cleanPath}`;
}
