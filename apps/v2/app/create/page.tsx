import type { Metadata } from "next"
import { CreateCustomizer } from "./customizer"

export const metadata: Metadata = {
  title: "Create",
  description:
    "Customize everything. Pick your style, base color, font, icons, and radius — then create your own version of lvcn.",
}

export default function CreatePage() {
  return (
    <div className="container-wrapper flex-1">
      <div className="container flex min-h-0 flex-1 flex-col py-6 md:py-8">
        <div className="mb-6 space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight">Create your project</h1>
          <p className="text-muted-foreground">
            Customize your design system. Shuffle for inspiration, lock what you like, then copy the command.
          </p>
        </div>
        <CreateCustomizer />
      </div>
    </div>
  )
}
