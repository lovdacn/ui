# lovdaCN 🚀

`lovdaCN` is a CLI and registry tool for building premium, responsive, and customizable user interfaces for **Expo and React Native** projects. It is built from the ground up to support modern Tailwind CSS styling systems like **NativeWind** and **Uniwind**.

Inspired by `shadcn/ui`, `lovdaCN` allows you to copy and paste components directly into your codebase, giving you full control over the code, styling, and design implementation.

---

## Key Features

- **Designed for Expo & React Native**: Tailwind CSS based component library optimized for mobile layouts, touch interactions, and cross-platform consistency.
- **Full Source Ownership**: Components are added directly to your repository so you can customize them to your brand's specifications.
- **Built-in CLI**: Seamless initialization and component staging using the custom `lovda` CLI tool.
- **Multiple CSS Paradigms**: Out-of-the-box templates supporting NativeWind v4 and Uniwind styles.

---

## Using lovdaCN

The core engine of `lovdaCN` is managed through the CLI:

### 1. Initialization

Set up your project configuration by running the initialization command in your target Expo/React Native repository:

```sh
# Using npx
npx lovda init

# Using pnpm
pnpm dlx lovda init

# Using bun
bunx lovda init
```

This will create a `lovda.json` configuration file and bootstrap the necessary folders and theme configurations.

### 2. Adding Components

Install individual components (like `button`, `input`, `dialog`, etc.) directly into your application directory:

```sh
# Add a single component
npx lovda add button

# Add multiple components
npx lovda add input select checkbox
```

---

## Monorepo Workspace Structure

This repository is managed with **pnpm workspaces** and **Turborepo** to structure code cleanly:

* **[apps/v2](file:///c:/Users/saima/OneDrive/Desktop/expo-ui/lvcn/apps/v2)**: Next.js-based documentation application built using **Fumadocs** to showcase component APIs and examples.
* **[packages/lovda](file:///c:/Users/saima/OneDrive/Desktop/expo-ui/lvcn/packages/lovda)**: The official `lovda` CLI source code for project initialization and component delivery.
* **[packages/templates](file:///c:/Users/saima/OneDrive/Desktop/expo-ui/lvcn/packages/templates)**: Source templates, registry definitions, and styling configurations for both `nativewind` and `uniwind`.

---

## Development Setup

### Prerequisites

You need [Node.js >= 18](https://nodejs.org/) and [pnpm](https://pnpm.io/) installed.

```sh
npm install -g pnpm
```

### Installation

Clone the repository and install all workspace dependencies:

```sh
git clone https://github.com/lovdacn-ui/ui.git
cd ui
pnpm install
```

### Running Development Servers

To spin up all workspaces in watch/development mode:

```sh
pnpm dev
```

To run tasks specifically for one app or package:

```sh
# Start the v2 documentation app dev server
pnpm --filter v2 dev

# Build the CLI tool
pnpm --filter lovda build

# Run unit tests for CLI
pnpm --filter lovda test
```

---

## Contributing

We welcome contributions to help improve the `lovdaCN` ecosystem! Please read our [Contributing Guide](CONTRIBUTING.md) to learn how to set up local environments, run tests, and open PRs.

By participating, you agree to adhere to our [Code of Conduct](CODE_OF_CONDUCT.md).

## Security

If you discover a security vulnerability in `lovdaCN`, please check our [Security Policy](SECURITY.md) to report it safely.

## License

This project is licensed under the [Apache License 2.0](LICENSE).
