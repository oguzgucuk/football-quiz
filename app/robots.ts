import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://alimball.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/play/",
          "/auction/",
          "/test-party/",
        ],
      },
      {
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "ClaudeBot",
          "anthropic-ai",
          "PerplexityBot",
          "Google-Extended",
          "CCBot",
        ],
        allow: ["/", "/players", "/sandbox", "/store", "/llms.txt"],
        disallow: ["/admin/", "/api/", "/play/", "/auction/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
