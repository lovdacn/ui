# lvcn

> ⚠️ **Beta.** The CLI is under active development. APIs and components may change.

`lvcn` is the CLI for **lvcn** — premium, responsive, customizable UI components for
**Expo & React Native**, built for Tailwind-based styling systems (**NativeWind** and **Uniwind**).

Inspired by `shadcn/ui`: components are copied into your codebase, so you own the code and can
customize everything.

## Usage

You don't need to install anything — run it with your package manager's runner.

### Initialize a project

Sets up configuration (`lvcn.json`), theme, and the required files.

```sh
npx lvcn-ui@latest init
# pnpm
pnpm dlx lvcn-ui@latest init
# bun
bunx --bun lvcn-ui@latest init
```

The latest Expo SDK template is used by default. To scaffold an Expo SDK 54
starter, pass `--expo-version 54` (works with both NativeWind and Uniwind):

```sh
npx lvcn-ui@latest init --expo-version 54
```

During beta you can also pin the beta tag explicitly:

```sh
npx lvcn-ui@beta init
```

### Add components

```sh
# a single component
npx lvcn-ui@latest add button

# multiple components
npx lvcn-ui@latest add input select checkbox
```

Running `add` with no arguments opens an interactive multi-select of all available components.

## What it does

- **`init`** — scaffolds/configures an Expo + NativeWind or Uniwind project (theme, `lvcn.json`,
  metro/tailwind config, global CSS, portal host for overlays, etc.).
- **`add`** — resolves a component and its dependencies from the registry, rewrites import
  aliases to match your project, installs npm dependencies (via `expo install` for Expo
  projects), and writes the files into your components directory.
- **`preset`** — manage theme/color presets.

## Configuration

Components are resolved from the registry at `https://lvcn.vercel.app/r`. You can point the CLI at a
different registry (a URL, or a local folder for development) with:

```sh
LVCN_REGISTRY_URL=https://your-registry/r npx lvcn-ui@latest add button
```

## Links

- Documentation: https://lvcn.vercel.app
- Repository: https://github.com/lvcn/ui

## License

MIT
