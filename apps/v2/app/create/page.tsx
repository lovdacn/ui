import type { Metadata } from "next"
import { CreateCustomizer } from "./customizer"

export const metadata: Metadata = {
  title: "Create",
  description:
    "Customize everything. Pick your style, base color, font, icons, and radius — then create your own version of lvcn.",
}

export default function CreatePage() {
  return (
    <div className="flex-1 flex flex-col min-h-0 w-full bg-background">
      <CreateCustomizer />
    </div>
  )
}
