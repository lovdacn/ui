import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const compiler = require("./lib/recipe-compiler.cjs") as {
  extractClippedSurfaceClasses: (classes: string) => string;
  extractShadowWrapperClasses: (classes: string) => string;
  filterNativeSafeStyleClasses: (marker: string, classes: string) => string;
  isNativeHostileClass: (className: string) => boolean;
  parseCssStyleSheet: (css: string) => Record<string, string>;
  tokenizeClassString: (classes: string) => string[];
};

describe("native recipe safety", () => {
  it("rejects resting and state ring utilities from cross-platform recipes", () => {
    expect(compiler.isNativeHostileClass("ring-1")).toBe(true);
    expect(compiler.isNativeHostileClass("ring-foreground/10")).toBe(true);
    expect(compiler.isNativeHostileClass("focus-visible:ring-2")).toBe(true);
    expect(
      compiler.filterNativeSafeStyleClasses(
        "cn-card",
        "border ring-1 ring-foreground/10 shadow-sm",
      ),
    ).toBe("border shadow-sm");
  });

  it("rejects clipping-prone recipe line height while preserving scalable alternatives", () => {
    expect(compiler.isNativeHostileClass("leading-none")).toBe(true);
    expect(compiler.isNativeHostileClass("leading-tight")).toBe(false);
  });

  it("does not combine recipe-owned outer shadow and clipping on one host", () => {
    expect(
      compiler.filterNativeSafeStyleClasses(
        "cn-menu-content",
        "rounded-md overflow-hidden border shadow-lg shadow-black/5",
      ),
    ).toBe("rounded-md border shadow-lg shadow-black/5");
    expect(
      compiler.filterNativeSafeStyleClasses(
        "cn-accordion-content",
        "rounded-md overflow-hidden border",
      ),
    ).toBe("rounded-md overflow-hidden border");
  });

  it("keeps a recipe-owned outer shadow on one unclipped host", () => {
    // Card used to keep `overflow-hidden` alongside its shadow. On Android that
    // forces the clip path and the border stroke to rasterize separately, which
    // thins the corner arcs, and it clips the shadow it is meant to cast. Border,
    // radius and shadow now share one node, as upstream react-native-reusables does.
    const safe = compiler.filterNativeSafeStyleClasses(
      "cn-card",
      "bg-card overflow-hidden rounded-2xl shadow-lg shadow-black/5 text-sm",
    );
    expect(safe).toBe("bg-card rounded-2xl shadow-lg shadow-black/5 text-sm");

    // The two-host helpers stay available for a surface that genuinely needs a
    // separate clipped layer, but such a wrapper must own a background itself.
    expect(compiler.extractShadowWrapperClasses(safe)).toBe(
      "rounded-2xl shadow-lg shadow-black/5",
    );
    expect(compiler.extractClippedSurfaceClasses(safe)).toBe("bg-card rounded-2xl text-sm");
  });

  it("rewrites a recipe fixed height into a minimum height on text-bearing surfaces", () => {
    // A 20px badge box clips its own label once an icon or a larger font scale
    // pushes the content past 20px; min-height keeps the compact resting look.
    expect(compiler.filterNativeSafeStyleClasses("cn-badge", "h-5 gap-1 rounded-full")).toBe(
      "min-h-5 gap-1 rounded-full",
    );
    // A glyph or track surface has no text to grow around, so its box is intent.
    expect(compiler.filterNativeSafeStyleClasses("cn-checkbox", "h-4 w-4 rounded-sm")).toBe(
      "h-4 w-4 rounded-sm",
    );
  });

  it("routes web-only state selectors out of cross-platform literals", () => {
    expect(compiler.isNativeHostileClass("focus-visible:border-ring")).toBe(true);
    expect(compiler.isNativeHostileClass("aria-invalid:border-destructive")).toBe(true);
    expect(compiler.isNativeHostileClass("bg-clip-padding")).toBe(true);
    expect(compiler.isNativeHostileClass("transition-all")).toBe(true);
    // Real native accessibility state must survive.
    expect(compiler.isNativeHostileClass("aria-expanded:bg-secondary")).toBe(false);
  });

  it("keeps arbitrary values with spaces intact until the safety filter rejects them", () => {
    const arbitrary =
      "bg-secondary hover:bg-[color-mix(in_oklch, var(--secondary), var(--foreground)_5%)] aria-expanded:bg-secondary";
    expect(compiler.tokenizeClassString(arbitrary)).toEqual([
      "bg-secondary",
      "hover:bg-[color-mix(in_oklch, var(--secondary), var(--foreground)_5%)]",
      "aria-expanded:bg-secondary",
    ]);
    expect(compiler.filterNativeSafeStyleClasses("cn-button", arbitrary)).toBe(
      "bg-secondary aria-expanded:bg-secondary",
    );

    const parsed = compiler.parseCssStyleSheet(
      `.cn-button { @apply ${arbitrary}; }`,
    );
    expect(parsed["cn-button"]).toContain(
      "hover:bg-[color-mix(in_oklch, var(--secondary), var(--foreground)_5%)]",
    );
  });
});
