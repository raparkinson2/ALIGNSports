/**
 * Cryptographic utilities for securing sensitive user data
 *
 * Uses expo-crypto for hashing passwords (one-way, secure)
 * Uses expo-secure-store for storing encryption keys securely
 */
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

// Key for storing the app's encryption salt in SecureStore
const SALT_KEY = 'app_encryption_salt';

/**
 * Get or create a unique salt for this device/installation
 * The salt is stored securely and persists across app restarts
 */
async function getOrCreateSalt(): Promise<string> {
  try {
    let salt = await SecureStore.getItemAsync(SALT_KEY);
    if (!salt) {
      // Generate a random salt (32 bytes = 64 hex chars)
      const randomBytes = await Crypto.getRandomBytesAsync(32);
      salt = Array.from(randomBytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      await SecureStore.setItemAsync(SALT_KEY, salt);
    }
    return salt;
  } catch {
    // Fallback for web or if SecureStore fails - use a fixed salt
    // This is less secure but allows the app to function
    return 'fallback_salt_for_web_environment_only';
  }
}

// Cache the salt after first retrieval
let cachedSalt: string | null = null;

/**
 * Hash a password using SHA-256 with a device-specific salt
 * This is a one-way hash - passwords cannot be recovered
 *
 * @param password - The plain text password to hash
 * @returns The hashed password as a hex string
 */
export async function hashPassword(password: string): Promise<string> {
  if (!cachedSalt) {
    cachedSalt = await getOrCreateSalt();
  }

  // Combine password with salt before hashing
  const saltedPassword = `${cachedSalt}:${password}`;

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
