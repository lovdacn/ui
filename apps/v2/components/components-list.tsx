import Link from "next/link"

import { COMPONENTS } from "@/lib/components"

export function ComponentsList() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-x-8 lg:gap-x-16 lg:gap-y-6 xl:gap-x-20">
      {COMPONENTS.map((component) => (
        <div key={component.name} className="flex items-center">
          <Link
            href={`/docs/components/${component.name}`}
            className="no-underline! inline-flex items-center gap-2 border-b border-transparent pb-0.5 text-lg font-medium transition-colors hover:border-foreground md:text-base"
          >
            {component.title}
          </Link>
        </div>
      ))}
    </div>
  )
}
