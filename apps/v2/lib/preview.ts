const isDev = process.env.NODE_ENV === "development"
const defaultDevOrigin = "http://localhost:8081"
const fallbackPreviewOrigin = "https://lovdacn.expo.app"

export const expoPreviewOrigin = (
  process.env.NEXT_PUBLIC_EXPO_PREVIEW_URL ??
  (isDev ? defaultDevOrigin : fallbackPreviewOrigin)
).replace(/\/+$/, "")

export function getExpoPreviewUrl(params: Record<string, string>) {
  return `${expoPreviewOrigin}/present?${new URLSearchParams(params).toString()}`
}


export function getExpoCustomizerPreviewUrl(params: Record<string, string>) {
  return `${expoPreviewOrigin}/customizer-preview?${new URLSearchParams(params).toString()}`
}
