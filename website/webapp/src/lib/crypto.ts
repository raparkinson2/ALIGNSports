/**
 * Cryptographic utilities for the web — mirrors mobile/src/lib/crypto.ts
 *
 * Uses the Web Crypto API (SHA-256) with the same shared fixed salt as the
 * mobile app so that passwords set on any device are cross-platform compatible.
 */

const SHARED_SALT = 'align_sports_shared_salt_v1';

async function sha256Hex(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash a password using SHA-256 with the shared fixed salt.
 * Matches the mobile app exactly — same password = same hash on all platforms.
 */
export async function hashPassword(password: string): Promise<string> {
  return sha256Hex(`${SHARED_SALT}:${password}`);
}

/**
 * Check if a string appears to be already hashed (64-char hex string).
 */
export function isAlreadyHashed(value: string): boolean {
  return /^[a-f0-9]{64}$/i.test(value);
}

/**
 * Verify a password against a stored hash (from the fallback-salt path).
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const hash = await hashPassword(password);
  return hash === storedHash;
}
