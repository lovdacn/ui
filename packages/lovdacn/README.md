# lovdacn

> ⚠️ **Beta.** The CLI is under active development. APIs and components may change.

`lovdacn` is the CLI for **lovdaCN** — premium, responsive, customizable UI components for
**Expo & React Native**, built for Tailwind-based styling systems (**NativeWind** and **Uniwind**).

Inspired by `shadcn/ui`: components are copied into your codebase, so you own the code and can
customize everything.

## Usage

You don't need to install anything — run it with your package manager's runner.

### Initialize a project

Sets up configuration (`lvcn.json`), theme, and the required files.

```sh
npx lovdacn@latest init
# pnpm
pnpm dlx lovdacn@latest init
# bun
bunx --bun lovdacn@latest init
```

The latest Expo SDK template is used by default. To scaffold an Expo SDK 54
starter, pass `--expo-version 54` (works with both NativeWind and Uniwind):

```sh
npx lovdacn@latest init --expo-version 54
```

During beta you can also pin the beta tag explicitly:

```sh
npx lovdacn@beta init
```

> `lvcn` is a shorthand alias for the same CLI, e.g. `npx lvcn@latest init`.

### Add components

```sh
# a single component
npx lovdacn@latest add button

# multiple components
npx lovdacn@latest add input select checkbox
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

Components are resolved from the registry at `https://lovdacn.vercel.app/r`. You can point the CLI at a
different registry (a URL, or a local folder for development) with:

```sh
LOVDA_REGISTRY_URL=https://your-registry/r npx lovdacn@latest add button
```

## Links

- Documentation: https://lovdacn.vercel.app
- Repository: https://github.com/lovdacn/ui

## License

MIT
