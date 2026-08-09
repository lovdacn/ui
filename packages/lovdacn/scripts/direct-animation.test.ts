import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const WORKSPACE_ROOT = path.resolve(
  fileURLToPath(new URL("../../../", import.meta.url)),
);

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(WORKSPACE_ROOT, relativePath), "utf8");
}

describe("Agent 3 direct-animation contracts", () => {
  it("maps every native Sheet side to its matching enter and exit builder", () => {
    const source = readSource("apps/preview/src/components/ui/sheet.tsx");

    for (const mapping of [
      "left: SlideInLeft",
      "right: SlideInRight",
      "top: SlideInUp",
      "bottom: SlideInDown",
      "left: SlideOutLeft",
      "right: SlideOutRight",
      "top: SlideOutUp",
      "bottom: SlideOutDown",
    ]) {
      expect(source).toContain(mapping);
    }
    expect(source).not.toMatch(/enteringAnimation[\s\S]*?: undefined/);
    expect(source).not.toMatch(/exitingAnimation[\s\S]*?: undefined/);
  });

  it("uses one direction-neutral, consistently timed Tooltip policy", () => {
    for (const relativePath of [
      "apps/preview/src/components/ui/tooltip.tsx",
      "packages/lovdacn/registry-src/nativewind/components/ui/tooltip.tsx",
      "packages/lovdacn/registry-src/uniwind/components/ui/tooltip.tsx",
    ]) {
      const source = readSource(relativePath);
      expect(source).toMatch(
        /entering=\{FadeIn\.duration\((?:durations\.fast|150)\)\}/,
      );
      expect(source).toMatch(
        /exiting=\{FadeOut\.duration\((?:durations\.fast|150)\)\}/,
      );
      expect(source).not.toMatch(/FadeIn(?:Up|Down|Left|Right)/);
    }
  });

  it("subscribes Sidebar to reduced motion and cancels before snapping or restarting", () => {
    const source = readSource("apps/preview/src/components/ui/sidebar.tsx");

    expect(source).toContain("AccessibilityInfo.isReduceMotionEnabled()");
    expect(source).toContain("'reduceMotionChanged'");
    expect(source).toContain("return reduceMotion !== false;");
    expect(source.match(/\.stopAnimation\(\);/g)).toHaveLength(2);
    expect(source.match(/\.setValue\(/g)).toHaveLength(2);
    expect(source.match(/return \(\) => transition\.stop\(\);/g)).toHaveLength(
      2,
    );
  });

  it("mounts Spinner rotation only in the custom icon branch and cancels it on unmount", () => {
    const source = readSource("apps/preview/src/components/ui/spinner.tsx");
    const parentStart = source.indexOf("function Spinner(");
    const childStart = source.indexOf("function AnimatedSpinnerIcon(");
    const parent = source.slice(parentStart, childStart);
    const child = source.slice(childStart);

    expect(parent).toContain("if (nativeOnly)");
    expect(parent).toContain("<ActivityIndicator");
    expect(parent).toContain("<AnimatedSpinnerIcon");
    expect(parent).not.toContain("useSharedValue");
    expect(child).toContain("useSharedValue");
    expect(child).toContain("cancelAnimation(rotation)");
  });

  it("clamps Progress consistently and represents semantic zero as zero percent", () => {
    const clamp = (value: number | null | undefined) =>
      Math.min(100, Math.max(0, value ?? 0));
    expect([-10, 0, 50, 100, 150].map(clamp)).toEqual([0, 0, 50, 100, 100]);

    for (const relativePath of [
      "apps/preview/src/components/ui/progress.tsx",
      "packages/lovdacn/registry-src/nativewind/components/ui/progress.tsx",
      "packages/lovdacn/registry-src/uniwind/components/ui/progress.tsx",
    ]) {
      const source = readSource(relativePath);
      expect(source).toContain(
        "return Math.min(100, Math.max(0, value ?? 0));",
      );
      expect(source).toContain("value={normalizedValue}");
      expect(source).toContain("withSpring(value");
      expect(source).toContain("100 - value");
      expect(source).not.toContain("interpolate(");
      expect(source).not.toContain("[1, 100]");
    }
  });

  it("keeps preview CSS valid UTF-8 and preserves broad reduced-motion rules", () => {
    const cssPath = path.join(WORKSPACE_ROOT, "apps/preview/src/global.css");
    const bytes = fs.readFileSync(cssPath);
    const css = new TextDecoder("utf-8", { fatal: true }).decode(bytes);

    expect(css).toContain(
      "animate-in/animate-out, animate-pulse, animate-spin",
    );
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain(".animate-pulse,");
    expect(css).toContain("animation: none !important;");
    expect(css).not.toContain("\u0007");
  });

  it("preserves intentional web behavior for native-only wrappers and animated icons", () => {
    const nativeOnly = readSource(
      "apps/preview/src/components/ui/native-only-animated-view.tsx",
    );
    const animatedIconWeb = readSource(
      "apps/preview/src/components/animated-icon.web.tsx",
    );

    expect(nativeOnly).toContain("if (Platform.OS === 'web')");
    expect(nativeOnly).toContain(
      "return <>{props.children as React.ReactNode}</>",
    );
    expect(animatedIconWeb.match(/return null;/g)).toHaveLength(2);
    expect(animatedIconWeb).not.toContain("react-native-reanimated");
  });
});
