# Contributing to lovdaCN

lovdaCN is a React Native, Expo, TypeScript, and Tailwind CSS (NativeWind/Uniwind) component library.

## Before You Open a PR
Run the project checks before submitting changes:

```bash
pnpm install
pnpm build
pnpm check-types
pnpm format
```

- `pnpm build` triggers Turborepo to build the CLI package, templates, and the documentation app.
- `pnpm check-types` runs strict TypeScript typechecks across the entire workspace.
- `pnpm format` formats the codebase with Prettier.

## Monorepo Structure
- **`apps/v2`**: Next.js documentation site (Fumadocs) and static registry host (`apps/v2/public/r`).
- **`apps/preview`**: Expo Web app for component live-previews and developer testing.
- **`packages/lovdacn`**: The core `lovdacn` (alias `lvcn`) CLI tool.
- **`packages/templates`**: Base project templates for both NativeWind and Uniwind.

## Component & Styling Conventions
Every component follows the same architectural and style guidelines:

- **Accessible Primitives**: Leverage `@rn-primitives` to ensure accessibility and cross-platform consistency.
- **Theme Variables**: Use design tokens and CSS variables (e.g. `bg-background`, `text-foreground`, `border-border`) so that components adapt cleanly to style engines and theme shifts.
- **Engine Portability**: Ensure Tailwind class strings work reliably across both engines: **NativeWind** and **Uniwind**. Keep components self-contained.
- **Dark Mode**: Support light and dark mode out-of-the-box using Tailwind's `dark:` modifier class.
- **Imports & Bundler**: Keep imports clean using `@/components/ui/` or `@/lib/`. The registry build resolves and packages these internal dependencies together when components are published.
- **Registry Compilation**: If you add or edit a component, regenerate the registry JSON files in `apps/v2/public/r` using:
  ```bash
  pnpm --filter lovdacn exec node scripts/build-registry.cjs
  ```

## Local Development & CLI Testing
Start the workspace development server:
```bash
pnpm dev
```
To test your local CLI changes:
1. Build the CLI package:
   ```bash
   pnpm --filter lovdacn build
   ```
2. Run the built CLI against a scratch/temporary folder, directing it to your local registry files:
   ```bash
   LOVDA_REGISTRY_URL=/absolute/path/to/apps/v2/public/r node packages/lovdacn/dist/index.js init
   ```
3. Add a component:
   ```bash
   LOVDA_REGISTRY_URL=/absolute/path/to/apps/v2/public/r node packages/lovdacn/dist/index.js add button
   ```
4. Run CLI unit tests:
   ```bash
   pnpm --filter lovdacn test
   ```

## Registry Structure
Component definitions are compiled into JSON and served statically from `apps/v2/public/r`:
```
apps/v2/public/r/styles/<engine>/<style>/<component>.json
```
- `<engine>` is `nativewind` or `uniwind`.
- `<style>` is `default`, `new-york`, etc.
- Locally, the CLI reads directly from the registry folder on disk via the `LOVDA_REGISTRY_URL` environment variable.

## Publishing Releases (Maintainers Only)
To publish prerelease versions of the CLI during the beta phase:
```bash
cd packages/lovdacn
npm version prerelease --preid=beta
pnpm build
npm publish
npm dist-tag add lovdacn@<version> beta
```

## Pull Requests
- Open or comment on an issue before starting larger work.
- Create a fork or feature branch.
- Keep changes focused and include the component source, preview, and registry entry together in a PR.
- Open a pull request against `main`.

## About
Tailwind CSS components for React Native and Expo. Copy, paste, done.

[lovdacn.vercel.app](https://lovdacn.vercel.app)
