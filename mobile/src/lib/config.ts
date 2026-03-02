/**
 * Central config — backend URL read from the EXPO_PUBLIC_VIBECODE_BACKEND_URL
 * environment variable injected by the Vibecode platform at build/bundle time.
 * Falls back to the last-known preview URL if the env var is somehow absent.
 */
export const BACKEND_URL =
  process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL ||
  'https://preview-hapqzygfmxpn.dev.vibecode.run';
