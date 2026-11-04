<div align="center">
  <img src="./assets/images/lvcn-logo.png" alt="lvcn" width="96" height="96" />
  <h1>Welcome to lvcn</h1>
  <p><strong>Beautiful, accessible UI components for Expo &amp; React Native.</strong><br/>Copy, paste and own every line of code.</p>
</div>

---

This is an [Expo](https://expo.dev) starter, styled with **Uniwind**, that comes pre-wired for
[**lvcn**](https://lvcn.vercel.app) — a shadcn-style component registry for React Native.
The home screen is built from just **5 UI components** so it stays easy to read and easy to make
your own.

## Get started

1. Install dependencies

   ```sh
   npm install
   ```

2. Start the app

   ```sh
   npx expo start
   ```

Then open `src/app/index.tsx` and start editing — the screen live-reloads as you go.

## Add components

lvcn copies component source straight into your project so you have full control:

```sh
# add a single component
npx lvcn-ui add button

# add several at once
npx lvcn-ui add card badge input
```

Components land in `src/components/ui/` and import through the `@/` alias.

## What's inside

| Path | Description |
| --- | --- |
| `src/app/index.tsx` | The **Welcome to lvcn** home screen |
| `src/app/explore.tsx` | A docs / feature overview screen |
| `src/components/ui/` | 5 starter components: `logo`, `badge`, `card`, `button`, `github-star-button` |

## Learn more

- 📚 **Documentation:** https://lvcn.vercel.app/docs
- 🧩 **Components & registry:** https://lvcn.vercel.app
- ⭐ **Star us on GitHub:** https://github.com/lvcn/ui

Want a clean slate? Run `npm run reset-project` to move the starter code aside and begin from an
empty `app` directory.
