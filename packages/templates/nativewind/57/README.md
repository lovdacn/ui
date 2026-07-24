<div align="center">
  <img src="./assets/images/lovdacn-logo.png" alt="lovdaCN" width="96" height="96" />
  <h1>Welcome to lovdaCN</h1>
  <p><strong>Beautiful, accessible UI components for Expo &amp; React Native.</strong><br/>Copy, paste and own every line of code.</p>
</div>

---

This is an [Expo](https://expo.dev) starter, styled with **NativeWind**, that comes pre-wired for
[**lovdaCN**](https://lovdacn.vercel.app) — a shadcn-style component registry for React Native.
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

lovdaCN copies component source straight into your project so you have full control:

```sh
# add a single component
npx lovda add button

# add several at once
npx lovda add card badge input
```

Components land in `src/components/ui/` and import through the `@/` alias.

## What's inside

| Path | Description |
| --- | --- |
| `src/app/index.tsx` | The **Welcome to lovdaCN** home screen |
| `src/app/explore.tsx` | A docs / feature overview screen |
| `src/components/ui/` | 5 starter components: `logo`, `badge`, `card`, `button`, `github-star-button` |

## Learn more

- 📚 **Documentation:** https://lovdacn.vercel.app/docs
- 🧩 **Components & registry:** https://lovdacn.vercel.app
- ⭐ **Star us on GitHub:** https://github.com/lovdacn/ui

Want a clean slate? Run `npm run reset-project` to move the starter code aside and begin from an
empty `app` directory.
