// Web previews do not show the native splash animation. Keeping this module
// dependency-free prevents expo-image and reanimated from entering every route's
// shared web bundle.
export function AnimatedSplashOverlay() {
  return null;
}

export function AnimatedIcon() {
  return null;
}
