import { notFound } from "next/navigation"
import { NextResponse, type NextRequest } from "next/server"

import { processMdxForLLMs } from "@/lib/llm"
import { source } from "@/lib/source"

export const revalidate = false
export const dynamic = "force-static"
export const dynamicParams = false

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug?: string[] }> }
) {
  const { slug } = await params
  const page = source.getPage(slug)

  if (!page) {
    notFound()
  }

  const raw = await page.data.getText("raw")
  const content = processMdxForLLMs(raw)

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  })
}

export function generateStaticParams() {
  return source.generateParams()
}
