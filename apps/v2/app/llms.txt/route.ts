import { NextResponse } from "next/server"
import { siteConfig } from "@/lib/config"
import { source } from "@/lib/source"

export const revalidate = false
export const dynamic = "force-static"

export async function GET() {
  const baseUrl = siteConfig.url
  const docPages = source.getPages()

  const links = docPages
    .map((page) => `- [${page.data.title}](${baseUrl}/llm${page.url.replace(/^\/docs/, "")}): ${page.data.description || ""}`)
    .join("\n")

  const content = `# ${siteConfig.name} Documentation for AI Agents

> ${siteConfig.description}

## Quick Links
- [Homepage](${baseUrl})
- [Documentation Index](${baseUrl}/docs)
- [Components](${baseUrl}/docs/components)
- [Blocks](${baseUrl}/blocks)

## Available Markdown Documentation Routes
${links}
`

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  })
}
