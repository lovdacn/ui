import type { MetadataRoute } from "next"
import { siteConfig } from "@/lib/config"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = siteConfig.url

  // List of major AI agent and web crawler user agents to explicitly allow
  const aiAndCrawlerUserAgents = [
    "*",
    "Googlebot",
    "Bingbot",
    "GPTBot",
    "ChatGPT-User",
    "ClaudeBot",
    "anthropic-ai",
    "PerplexityBot",
    "Google-Extended",
    "Applebot-Extended",
    "Cohere-ai",
    "Meta-ExternalAgent",
    "Bytespider",
    "CCBot",
  ]

  return {
    rules: aiAndCrawlerUserAgents.map((userAgent) => ({
      userAgent,
      allow: "/",
      disallow: ["/api/"],
    })),
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
