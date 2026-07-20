export type BlockCategory = "Dashboard" | "Authentication" | "Other"

export type BlockMeta = {
  /** Registry name, e.g. "login-01" — matches `/present?component=<name>`. */
  name: string
  /** Display title. */
  title: string
  /** Short description shown under the title in the gallery. */
  description: string
  /** Grouping category — each category has its own `/blocks/<slug>` page. */
  category: BlockCategory
}

/** Ordered catalog of blocks. */
export const blocks: BlockMeta[] = [
  {
    name: "dashboard-01",
    title: "Dashboard 01",
    description:
      "A full dashboard shell — navigation sidebar, top bar, KPI cards, overview chart, and recent activity.",
    category: "Dashboard",
  },
  {
    name: "dashboard-02",
    title: "Dashboard 02",
    description:
      "An application shell — a collapsible sidebar with search, a nested nav item, a project list, a user footer, and a bottom tab bar.",
    category: "Dashboard",
  },
  {
    name: "stats-01",
    title: "Stats 01",
    description: "A dashboard with KPI stat cards and trend badges.",
    category: "Dashboard",
  },
  {
    name: "login-01",
    title: "Login 01",
    description: "A centered sign-in card with email and password.",
    category: "Authentication",
  },
  {
    name: "login-02",
    title: "Login 02",
    description: "A sign-in screen with social providers and a divider.",
    category: "Authentication",
  },
  {
    name: "signup-01",
    title: "Signup 01",
    description: "A registration screen with a terms checkbox.",
    category: "Authentication",
  },
]

/** Category order for the landing page + routes. */
export const blockCategories: BlockCategory[] = [
  "Dashboard",
  "Authentication",
  "Other",
]

/** Display metadata for each category page. */
export const blockCategoryMeta: Record<
  BlockCategory,
  { title: string; description: string }
> = {
  Dashboard: {
    title: "Dashboard",
    description:
      "Data-dense app shells — navigation sidebars, top bars, KPI cards, and charts.",
  },
  Authentication: {
    title: "Authentication",
    description:
      "Sign-in, sign-up, and account screens that drop into an (auth) route group.",
  },
  Other: {
    title: "Other",
    description:
      "Everything else — application shells, navigation, and utility screens.",
  },
}

/** Stable slug for a category (used for hrefs / route params). */
export function categorySlug(category: BlockCategory): string {
  return category.toLowerCase().replace(/\s+/g, "-")
}

/** Resolve a route slug back to its category (or `undefined` if unknown). */
export function categoryFromSlug(slug: string): BlockCategory | undefined {
  return blockCategories.find((c) => categorySlug(c) === slug)
}

/** Blocks belonging to a category, in catalog order. */
export function blocksByCategory(category: BlockCategory): BlockMeta[] {
  return blocks.filter((b) => b.category === category)
}
