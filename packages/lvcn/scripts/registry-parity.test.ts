import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const { COMPONENTS, ENGINES, STYLES, createRegistryItem, resolveFiles } =
  require("./build-extra-components.cjs") as {
    COMPONENTS: ComponentDefinition[];
    ENGINES: string[];
    STYLES: string[];
    createRegistryItem: (
      component: ComponentDefinition,
      engine: string,
      style: string,
    ) => RegistryItem;
    resolveFiles: (
      component: ComponentDefinition,
      engine: string,
    ) => ResolvedFile[];
  };

type ComponentDefinition = {
  name: string;
  dependencies: string[];
  registryDependencies: string[];
  files?: Array<string | { path: string; src: string }>;
};

type ResolvedFile = {
  path: string;
  srcPath: string;
};

type RegistryItem = {
  name: string;
  dependencies: string[];
  registryDependencies: string[];
  files: Array<{ path: string; content: string; type: string }>;
  meta: { engine: string; style: string; legacy: boolean };
};

function component(name: string) {
  const result = COMPONENTS.find((candidate) => candidate.name === name);
  if (!result) throw new Error(`Missing component definition: ${name}`);
  return result;
}

describe("extra registry parity", () => {
  it("covers both engines, ten styles, and all twenty motion outputs", () => {
    expect(ENGINES).toEqual(["nativewind", "uniwind"]);
    expect(new Set(STYLES)).toEqual(
      new Set([
        "default",
        "luma",
        "lyra",
        "maia",
        "mira",
        "new-york",
        "nova",
        "rhea",
        "sera",
        "vega",
      ]),
    );
    expect(STYLES).toHaveLength(10);
    expect(COMPONENTS).toHaveLength(11);
    expect(ENGINES.length * STYLES.length).toBe(20);
  });

  it("resolves every source and keeps style-agnostic file content invariant", () => {
    for (const engine of ENGINES) {
      for (const definition of COMPONENTS) {
        const resolved = resolveFiles(definition, engine);
        expect(resolved.every(({ srcPath }) => fs.existsSync(srcPath))).toBe(
          true,
        );

        const baseline = createRegistryItem(definition, engine, STYLES[0]);
        for (const style of STYLES.slice(1)) {
          const item = createRegistryItem(definition, engine, style);
          expect(item.files).toEqual(baseline.files);
          expect(item.dependencies).toEqual(baseline.dependencies);
          expect(item.registryDependencies).toEqual(
            baseline.registryDependencies,
          );
        }
      }
    }
  });

  it("keeps the plain primitive seam free of the motion runtime", () => {
    for (const engine of ENGINES) {
      const item = createRegistryItem(
        component("primitives"),
        engine,
        "default",
      );
      expect(item.files).toHaveLength(1);
      expect(item.files[0].content).toContain("from 'react-native'");
      expect(item.files[0].content).not.toContain("react-native-reanimated");
      expect(item.files[0].content).not.toMatch(
        /(?:from|import\()\s*['"]@\/components\/ui\/motion['"]/,
      );
      expect(item.files[0].content).not.toContain("MOTION_PRIMITIVES");
      expect(item.dependencies).toEqual([]);
      expect(item.registryDependencies).toEqual([]);
    }
  });

  it("ships the engine and motion-aware seam together in every motion item", () => {
    for (const engine of ENGINES) {
      for (const style of STYLES) {
        const motion = createRegistryItem(component("motion"), engine, style);
        const plain = createRegistryItem(
          component("primitives"),
          engine,
          style,
        );

        expect(motion.files.map(({ path: filePath }) => filePath)).toEqual([
          "components/ui/motion.tsx",
          "components/ui/primitives.tsx",
        ]);
        expect(motion.files[1].content).toContain("MOTION_PRIMITIVES");
        expect(motion.files[1].content).toContain("@/components/ui/motion");
        expect(motion.files[1].content).not.toBe(plain.files[0].content);
        expect(motion.dependencies).toEqual([
          "react-native-reanimated",
          "react-native-worklets",
        ]);
        expect(motion.registryDependencies).toEqual(["utils"]);
      }
    }
  });

  it("normalizes semantic-icon imports and records their registry dependency", () => {
    for (const engine of ENGINES) {
      for (const definition of COMPONENTS) {
        const item = createRegistryItem(definition, engine, "default");
        const content = item.files.map((file) => file.content).join("\n");

        expect(content).not.toContain("lucide-react-native");
        expect(content).not.toMatch(/@\/registry\/(?:nativewind|uniwind)\//);
        if (content.includes("@/components/ui/semantic-icon")) {
          expect(item.registryDependencies).toContain("semantic-icon");
          expect(item.dependencies).not.toContain("lucide-react-native");
        }
      }
    }
  });

  it("uses preview fallbacks for direct extras and shared source for the plain seam", () => {
    for (const engine of ENGINES) {
      for (const name of ["sheet", "sidebar", "spinner"]) {
        const [resolved] = resolveFiles(component(name), engine);
        expect(path.normalize(resolved.srcPath)).toContain(
          path.normalize("apps/preview/src/components/ui"),
        );
      }

      const [plain] = resolveFiles(component("primitives"), engine);
      expect(path.normalize(plain.srcPath)).toContain(
        path.normalize("registry-src/shared/components/ui/primitives.tsx"),
      );
    }
  });

  it("matches checked-in registry artifacts on disk exactly", () => {
    // Artifacts are compared inside the ACTIVE channel's root, so a frozen stable baseline is
    // never judged against current source (see scripts/lib/registry-channel.cjs).
    const registryChannel = require("./lib/registry-channel.cjs") as {
      registryRoot: () => string;
    };
    for (const engine of ENGINES) {
      for (const style of STYLES) {
        for (const definition of COMPONENTS) {
          const expected = createRegistryItem(definition, engine, style);
          const diskPath = path.resolve(
            registryChannel.registryRoot(),
            "styles",
            engine,
            style,
            `${definition.name}.json`
          );
          expect(fs.existsSync(diskPath)).toBe(true);
          const actual = JSON.parse(fs.readFileSync(diskPath, "utf8"));
          expect(actual).toEqual(expected);
        }
      }
    }
  });
});
