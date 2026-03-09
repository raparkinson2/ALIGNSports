/**
 * Cryptographic utilities for securing sensitive user data
 *
 * Uses expo-crypto (SHA-256) with a shared fixed salt so that passwords
 * set on any device (mobile or web) are interoperable.
 */
import * as Crypto from 'expo-crypto';

// Shared fixed salt — identical across all platforms (mobile + web) so that
// a password set on one device can be verified on any other device or browser.
const SHARED_SALT = 'align_sports_shared_salt_v1';

/**
 * Hash a password using SHA-256 with a shared fixed salt.
 * Using a fixed shared salt ensures cross-platform compatibility:
 * the same password always produces the same hash on mobile and web.
 *
 * @param password - The plain text password to hash
 * @returns The hashed password as a hex string
 */
export async function hashPassword(password: string): Promise<string> {
  const saltedPassword = `${SHARED_SALT}:${password}`;

  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    saltedPassword
  );

  return hash;
}

/**
 * Verify a password against a stored hash
 *
 * @param password - The plain text password to verify
 * @param storedHash - The previously hashed password to compare against
 * @returns True if the password matches, false otherwise
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const hash = await hashPassword(password);
  return hash === storedHash;
}

/**
 * Hash a security answer (case-insensitive)
 * Normalizes to lowercase before hashing for consistent comparison
 *
 * @param answer - The security question answer to hash
 * @returns The hashed answer as a hex string
 */
export async function hashSecurityAnswer(answer: string): Promise<string> {
  return hashPassword(answer.toLowerCase().trim());
}

/**
 * Verify a security answer against a stored hash
 *
 * @param answer - The plain text answer to verify
 * @param storedHash - The previously hashed answer to compare against
 * @returns True if the answer matches, false otherwise
 */
export async function verifySecurityAnswer(answer: string, storedHash: string): Promise<boolean> {
  const hash = await hashSecurityAnswer(answer);
  return hash === storedHash;
}

/**
 * Check if a string appears to be already hashed (64 char hex string)
 * This helps with migration from plain text to hashed passwords
 */
export function isAlreadyHashed(value: string): boolean {
  return /^[a-f0-9]{64}$/i.test(value);
}
