import type { MetadataRoute } from "next"
import { siteConfig } from "@/lib/config"
import { source } from "@/lib/source"
import { blockCategories, blocksByCategory, categorySlug } from "@/lib/blocks"

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteConfig.url
  const currentDate = new Date()

  // Base static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/docs`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blocks`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/create`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ]

  // Dynamic documentation pages from Fumadocs source
  const docPages = source.getPages()
  const docRoutes: MetadataRoute.Sitemap = docPages.map((page) => ({
    url: `${baseUrl}${page.url}`,
    lastModified: currentDate,
    changeFrequency: "weekly",
    priority: page.url === "/docs/components" ? 0.9 : 0.8,
  }))

  // Dynamic block category pages
  const activeCategories = blockCategories.filter(
    (category) => blocksByCategory(category).length > 0
  )
  const blockCategoryRoutes: MetadataRoute.Sitemap = activeCategories.map(
    (category) => ({
      url: `${baseUrl}/blocks/${categorySlug(category)}`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.8,
    })
  )

  return [...staticRoutes, ...docRoutes, ...blockCategoryRoutes]
}
