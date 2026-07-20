import Link from "next/link"

import { COMPONENTS } from "@/lib/components"

export function ComponentsList() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-x-8 lg:gap-x-16 lg:gap-y-6 xl:gap-x-20">
      {COMPONENTS.map((component) => (
        <div key={component.name} className="flex items-center gap-2">
          <Link
            href={`/docs/components/${component.name}`}
            className="no-underline! inline-flex items-center gap-2 border-b border-transparent pb-0.5 text-lg font-medium transition-colors hover:border-foreground md:text-base"
          >
            {component.title}
          </Link>
          {component.new ? (
            <span className="inline-flex shrink-0 items-center rounded-full bg-green-500/15 px-1.5 py-0.5 text-[10px] font-medium leading-none text-green-600 dark:text-green-400">
              New
            </span>
          ) : null}
        </div>
      ))}
    </div>
  )
}
