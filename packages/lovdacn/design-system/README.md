# lovdaCN design-system source

This directory is the source of truth for the preset wire contract, active capabilities, compatibility aliases, style recipes, semantic icons, fonts, and preview role metadata.

## Recipe provenance

The eight `styles/style-*.css` files are vendored from the recipe snapshot previously committed under `apps/v2/public/r/styles` in this repository. That snapshot was derived from shadcn's named style recipes and adapted by lovdaCN's registry compiler for React Native. The original upstream revision was not recorded in the generated files, so this repository intentionally records the local source commit (`d1ef8e3`) rather than inventing an upstream hash. A future upstream sync must record its repository URL, revision, license review, sync date, and portability diff here before replacing these files.

Vendored snapshot date: 2026-08-02.

## Rules

- `wire-v1.json` is immutable: values may never be reordered or removed.
- Active values come from `catalog.json`, `icon-manifest.json`, and `font-manifest.json`; legacy values belong only in `aliases.json` and the wire table.
- Recipe CSS in this directory is compiler input. `apps/v2/public/r/styles/style-*.css` is generated/debug output and must never be read as source.
- Run `pnpm --filter lovdacn design-system:generate` after edits.
- Run `pnpm --filter lovdacn design-system:check` to fail on stale output, missing recipes, unsupported manifest entries, or incomplete icon mappings.
- Runtime preview artifacts contain static class literals. Installed projects receive one static style plus one generated icon/font adapter, not all selectable profiles.
