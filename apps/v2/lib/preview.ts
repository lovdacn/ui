const fallbackPreviewOrigin = "http://localhost:8081"

export const expoPreviewOrigin = (
  process.env.NEXT_PUBLIC_EXPO_PREVIEW_URL ?? fallbackPreviewOrigin
).replace(/\/+$/, "")

export function getExpoPreviewUrl(params: Record<string, string>) {
  return `${expoPreviewOrigin}/present?${new URLSearchParams(params).toString()}`
}
