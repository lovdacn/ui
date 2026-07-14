# Contributing to lovdaCN

Thank you for your interest in contributing to lovdaCN! We welcome contributions from everyone.

This document outlines the guidelines and workflow for contributing to lovdaCN.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Enhancements](#suggesting-enhancements)
  - [Pull Requests](#pull-requests)
- [Development Setup](#development-setup)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Workspace Layout](#workspace-layout)
  - [Running Locally](#running-locally)
  - [Working on the CLI (`lovdacn`)](#working-on-the-cli-lovdacn)
  - [The Component Registry](#the-component-registry)
  - [Running Tests](#running-tests)
  - [Publishing (Beta)](#publishing-beta)
- [Style Guide & Best Practices](#style-guide--best-practices)
- [License](#license)

---

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please report any unacceptable behavior.

## How Can I Contribute?

### Reporting Bugs

If you find a bug, please create a GitHub issue and include:
- A clear, descriptive title.
- Steps to reproduce the bug.
- Expected vs. actual behavior.
- Screenshots or recordings if applicable.
- Environment details (OS, Node version, bundler, package manager).

### Suggesting Enhancements

We are always looking for ways to improve! To suggest a feature or improvement:
- Open a GitHub issue outlining your idea.
- Explain the problem it solves and why it would be beneficial to other users.
- Provide mockups, API designs, or usage examples if possible.

### Pull Requests

1. **Fork the repository** and create your branch from `main`.
2. **Implement your changes**:
   - Write clean, well-documented code.
   - Follow the existing design patterns.
   - Run linting and type checks locally before submitting.
3. **Commit your changes**:
   - Use clear and descriptive commit messages (e.g. `feat(registry): add input component` or `fix(cli): resolve build syntax error`).
4. **Submit a pull request**:
   - Describe what the PR does, which issue it closes, and how you verified the changes.

---

## Development Setup

### Prerequisites

This repository is managed as a **pnpm monorepo** and uses **Node.js >= 18**.

- Make sure you have [Node.js](https://nodejs.org/) installed.
- Install [pnpm](https://pnpm.io/) globally (version 9 is recommended):
  ```sh
  npm install -g pnpm
  ```

### Installation

Clone the repository and install the workspace dependencies:

```sh
git clone https://github.com/lovdacn-ui/ui.git
cd ui
pnpm install
```

### Workspace Layout

This repo is a **pnpm + Turborepo monorepo**:

- **`apps/v2`** – Next.js (Fumadocs) documentation site. It also **hosts the component registry** as static files under `apps/v2/public/r`, served in production at `https://lovdacn.vercel.app/r`.
- **`packages/lovda`** – source for the `lovdacn` CLI (`init`, `add`, `preset`).
- **`packages/templates`** – Expo/React Native starter templates for `nativewind` and `uniwind`.

### Running Locally

To start the development server for all apps in the workspace using Turborepo:

```sh
pnpm dev
```

To run tasks on a specific project (e.g., the `v2` Next.js documentation app):

```sh
# Start the v2 dev server
pnpm --filter v2 dev

# Run linting on v2
pnpm --filter v2 lint

# Run TypeScript type check on v2
pnpm --filter v2 exec tsc --noEmit
```

### Working on the CLI (`lovdacn`)

The CLI package is named **`lovdacn`** and lives in `packages/lovda`.

```sh
# Build the CLI (bundles src -> dist and copies templates)
pnpm --filter lovdacn build

# Rebuild on change while developing
pnpm --filter lovdacn dev

# Run the built CLI directly
node packages/lovda/dist/index.js --help
node packages/lovda/dist/index.js --version   # prints the version from package.json
```

To try the CLI against a throwaway project, build it and run the command from any scratch directory:

```sh
pnpm --filter lovdacn build
mkdir /tmp/lovdacn-scratch && cd /tmp/lovdacn-scratch
node <path-to-repo>/packages/lovda/dist/index.js init
node <path-to-repo>/packages/lovda/dist/index.js add button
```

> The CLI reads its version from `packages/lovda/package.json`, so `--version` always matches the published version. When adding a command, keep the program name (`lovdacn`) and any printed command hints consistent.

### The Component Registry

Component definitions are compiled into JSON and **served from the docs site** (shadcn-style). The single source of truth is `apps/v2/public/r`:

```
apps/v2/public/r/styles/<engine>/<style>/<component>.json
```

- `engine` is `nativewind` or `uniwind`; `style` is `default`, `new-york`, `mira`, etc.
- In production the CLI fetches from `https://lovdacn.vercel.app/r` (configurable via the `LOVDA_REGISTRY_URL` env var).
- **Locally there is no server involved.** The CLI resolves the registry directly from the `apps/v2/public/r` folder on disk, so any component you add or edit there is immediately available to a local `lovdacn add` — no publish, no `next dev` required.

To (re)generate the registry from the component sources:

```sh
pnpm --filter lovdacn exec node scripts/build-registry.cjs
```

This writes the compiled JSON into `apps/v2/public/r/styles`. Commit the regenerated files together with your component changes.

To point the CLI at a different registry (e.g. a local copy or a preview deployment):

```sh
# a filesystem path (read directly, no HTTP)
LOVDA_REGISTRY_URL=/abs/path/to/apps/v2/public/r node packages/lovda/dist/index.js add button

# or a URL
LOVDA_REGISTRY_URL=https://<preview-domain>/r node packages/lovda/dist/index.js add button
```

### Running Tests

Unit tests for the CLI use Vitest and read the registry straight from `apps/v2/public/r`:

```sh
pnpm --filter lovdacn test
```

Add or update tests when you change CLI behavior or add components.

### Publishing (Beta)

The project is currently in **beta**, so releases are published as prerelease versions and bare `lovdacn` points at the beta build.

```sh
cd packages/lovda

# bump the prerelease version (1.0.0-beta.0 -> .1 -> .2 ...)
npm version prerelease --preid=beta

pnpm build
npm publish                                   # sets the `latest` tag to the beta version
npm dist-tag add lovdacn@<version> beta       # also expose it as @beta
npm dist-tag ls lovdacn                        # verify latest + beta
```

End users can then run `npx lovdacn@latest init` or `npx lovdacn@beta init`. Only maintainers with npm publish access should run these commands.

---

## Style Guide & Best Practices

- **TypeScript**: Use strict TypeScript typing where possible. Avoid the `any` type.
- **Linting & Formatting**: We use ESLint and Prettier. Keep your formatting consistent by running:
  ```sh
  pnpm format
  ```
- **Component Design**: Make components highly customizable, accessible, and performant.

## License

By contributing to lovdaCN, you agree that your contributions will be licensed under the [Apache License 2.0](LICENSE).
