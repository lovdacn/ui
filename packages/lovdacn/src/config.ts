/**
 * Published registry base for the STABLE channel.
 *
 * The beta channel appends `/beta`. Resolution — including the channel rule, the
 * `LOVDA_REGISTRY_URL` override and the local-workspace fallback — lives in
 * `utils/registry-url.ts`; call `getRegistryUrl()` from there rather than using this directly.
 */
export const DEFAULT_REGISTRY_URL = 'https://lovdacn.vercel.app/r';
