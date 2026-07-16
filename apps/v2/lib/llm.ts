import { COMPONENTS } from "@/lib/components"
import { absoluteUrl } from "@/lib/utils"

/**
 * Replace the <ComponentsList /> MDX component with a plain markdown list of
 * all components (used on the components index page).
 */
export function replaceComponentsList(content: string) {
  const list = COMPONENTS.map(
    (c) =>
      `- [${c.title}](${absoluteUrl(`/docs/components/${c.name}`)}): ${c.description}`
  ).join("\n")

  return content.replace(/<ComponentsList\s*\/>/g, list)
}

/**
 * Turn the raw MDX of a docs page into clean Markdown suitable for copying or
 * feeding to an LLM. Strips layout-only JSX wrappers while preserving the inner
 * markdown and fenced code blocks.
 */
export function processMdxForLLMs(content: string) {
  content = replaceComponentsList(content)

  // Drop preview cards — they render live examples that don't translate to text.
  content = content.replace(/<ComponentPreviewCard[^>]*\/>/g, "")

  // Drop the tab triggers entirely (their labels are noise in plain markdown).
  content = content.replace(
    /<TabsTrigger[^>]*>[\s\S]*?<\/TabsTrigger>/g,
    ""
  )

  // Unwrap the remaining layout components, keeping their children.
  content = content.replace(
    /<\/?(Tabs|TabsList|TabsContent|PackageManagerTabs|PMTabContent|Steps|Step|Callout)(\s+[^>]*?)?\s*\/?>/g,
    ""
  )

  // Collapse excess blank lines left behind by the removals.
  content = content.replace(/\n{3,}/g, "\n\n")

  return content.trim() + "\n"
}
