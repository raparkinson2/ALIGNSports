/**
 * Central config — backend URL read from the EXPO_PUBLIC_VIBECODE_BACKEND_URL
 * environment variable injected by the Vibecode platform at build/bundle time.
 * Falls back to the production URL as a hardcoded safety net.
 */
export const BACKEND_URL =
  process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL ||
  process.env.EXPO_PUBLIC_BACKEND_URL ||
  'https://stunned-guts.vibecode.run';

// Log at startup so we can verify the correct URL is used in TestFlight
console.log('[config] BACKEND_URL:', BACKEND_URL);
console.log('[config] EXPO_PUBLIC_VIBECODE_BACKEND_URL:', process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL);
