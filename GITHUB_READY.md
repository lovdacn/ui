# GitHub and pnpm setup

## Package-manager policy

This monorepo uses **pnpm 9** as its only repository package manager. The root `package.json` and `pnpm-lock.yaml` are authoritative for all workspaces:

- `apps/v2` — Next.js documentation site
- `apps/preview` — Expo preview app
- `packages/lovda` — published CLI

Use Node.js 22.13 or newer and install dependencies with:

```bash
corepack enable
pnpm install --frozen-lockfile
```

## Bun and the CLI

The CLI is written in TypeScript, compiled by `tsup`, and executed with Node.js. pnpm fully supports this workflow; Bun is **not** needed to build or run the repository.

Bun remains an optional package manager for people using the published CLI. When a user selects Bun, the CLI runs the appropriate Bun command. The repository itself does not commit Bun lockfiles or depend on Bun-only TypeScript types.

## Cleanup completed

- Standardized the workspace on the root `pnpm-lock.yaml`.
- Removed alternate Bun and npm template lockfiles.
- Added ignores for Bun, npm, and Yarn lockfiles, Expo generated files, and pnpm’s local store.
- Removed the CLI’s unused `@types/bun` dependency and replaced its Bun-only TypeScript type configuration with Node types.
- Kept Bun as a supported user choice in CLI commands and documentation.
- Updated the NativeWind template and preview to Expo SDK 57-compatible packages, including `react-native-svg` in the preview.
- Aligned React type versions and moved a font CSS variable out of JSX to prevent cross-package TypeScript conflicts.
- Added Zod 4 where Fumadocs requires it and configured Turbo to cache the CLI build outputs.

## Common commands

```bash
# Build and type-check the publishable CLI and Next site
pnpm build

# Serve the Next.js documentation site
pnpm --filter v2 dev

# Start the Expo preview
pnpm --filter preview start

# Watch the CLI package during development
pnpm --filter lovda dev
```

## Verification

The following succeeded after the cleanup:

```bash
pnpm install --frozen-lockfile
pnpm build
```

Before uploading, review `git status` and commit only the intentional source, configuration, template, and lockfile changes. Generated directories such as `node_modules`, `.next`, `.expo`, `dist`, and local lockfiles from other package managers are ignored.