import { BlockPreview } from "@/components/block-preview"
import { BlocksBetaNotice } from "@/components/blocks-beta-notice"
import { getFeaturedBlocks } from "@/lib/blocks"

export const dynamic = "force-static"

export default function BlocksPage() {
  const featuredBlocks = getFeaturedBlocks()

  return (
    <>
      <BlocksBetaNotice />
      <div className="flex flex-col gap-16 md:gap-24">
        {featuredBlocks.map((block) => (
          <BlockPreview key={block.name} block={block} />
        ))}
      </div>
    </>
  )
}
