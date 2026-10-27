/**
 * Runtime configuration. EXPO_PUBLIC_* values are inlined at build time:
 * local development reads .env, release APKs get the value from eas.json.
 */

const rawApiUrl = (process.env.EXPO_PUBLIC_API_URL ?? '').trim().replace(/\/+$/, '');

function validateApiUrl(url: string): string | null {
  if (!url) return 'EXPO_PUBLIC_API_URL is not set.';
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return 'EXPO_PUBLIC_API_URL is not a valid URL.';
  }
  // Release builds must never send passwords or tokens over plain HTTP.
  if (!__DEV__ && parsed.protocol !== 'https:') return 'Release builds require an https:// API URL.';
  return null;
}

export const API_URL = rawApiUrl;
export const CONFIG_ERROR = validateApiUrl(rawApiUrl);
