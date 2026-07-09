# lovdaCN

`lovdaCN` is a CLI and registry tool for building premium, responsive, and customizable user interfaces for **Expo and React Native** projects. It is built to support Tailwind CSS engines like **NativeWind** and **Uniwind**.

Inspired by shadcn/ui, `lovdaCN` allows you to add components directly to your codebase, giving you full control over the code, styling, and customization.

---

## Workspace Structure

This project is organized as a monorepo managed with **pnpm workspaces** and **Turborepo**:

* **[apps/v2](file:///c:/Users/saima/OneDrive/Desktop/expo-ui/lvcn/apps/v2)**: Next.js-based documentation application built using **Fumadocs**.
* **[packages/lovda](file:///c:/Users/saima/OneDrive/Desktop/expo-ui/lvcn/packages/lovda)**: The official `lovda` command-line interface (CLI) to initialize, add, and build components.
* **[packages/templates](file:///c:/Users/saima/OneDrive/Desktop/expo-ui/lvcn/packages/templates)**: Source templates and registry definitions (supporting `nativewind` and `uniwind` styles).

---

## Getting Started

### Prerequisites

You need [Node.js >= 18](https://nodejs.org/) and [pnpm](https://pnpm.io/) installed.

```sh
npm install -g pnpm
```

### Installation

Clone the repository and install all dependencies in the workspaces:

```sh
git clone https://github.com/lovdacn-ui/ui.git
cd ui
pnpm install
```

### Running Development Servers

To spin up all workspaces (documentation app, CLI build, and templates compilation) in watch/dev mode:

```sh
pnpm dev
```

To run tasks specifically for one app or package:

```sh
# Run documentation app only
pnpm --filter v2 dev

# Build the CLI tool
pnpm --filter lovda build
```

---

## Contributing

We welcome contributions from the community! Please read our [Contributing Guide](CONTRIBUTING.md) to get started.

By participating, you also agree to follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## License

This project is licensed under the [Apache License 2.0](LICENSE).
