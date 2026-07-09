import { DocsMobileNav, DocsSidebar } from "@/components/docs-sidebar"

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="container-wrapper flex flex-1 flex-col px-2">
      <DocsMobileNav />
      <div className="container flex flex-1 items-start gap-8 px-0 lg:gap-10">
        <DocsSidebar />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  )
}
