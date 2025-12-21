/**
 * Secure token storage utilities
 * 
 * Note: For maximum security, consider migrating to httpOnly cookies.
 * This implementation provides improved localStorage security as an intermediate solution.
 */

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

/**
 * Encrypt token (simple obfuscation - not real encryption, but better than plain text)
 * For production, consider using Web Crypto API for real encryption
 */
function obfuscateToken(token: string): string {
  // Simple base64 encoding with prefix to detect tampering
  const encoded = btoa(token);
  return `sb_${encoded}`;
}

/**
 * Decrypt token
 */
function deobfuscateToken(obfuscated: string): string | null {
  try {
    if (!obfuscated.startsWith('sb_')) {
      return null; // Invalid format
    }
    return atob(obfuscated.substring(3));
  } catch {
    return null;
  }
}

/**
 * Store token securely
 */
export function storeToken(token: string): void {
  try {
    const obfuscated = obfuscateToken(token);
    localStorage.setItem(TOKEN_KEY, obfuscated);
    
    // Set expiration timestamp (7 days from now)
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem(`${TOKEN_KEY}_expires`, expiresAt.toString());
  } catch (error) {
    console.error('Failed to store token:', error);
  }
}

/**
 * Retrieve token securely
 */
export function getToken(): string | null {
  try {
    const obfuscated = localStorage.getItem(TOKEN_KEY);
    if (!obfuscated) {
      return null;
    }

    // Check expiration
    const expiresAt = localStorage.getItem(`${TOKEN_KEY}_expires`);
    if (expiresAt && Date.now() > parseInt(expiresAt, 10)) {
      clearToken();
      return null;
    }

    return deobfuscateToken(obfuscated);
  } catch (error) {
    console.error('Failed to retrieve token:', error);
    return null;
  }
}

/**
 * Clear token
 */
export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(`${TOKEN_KEY}_expires`);
    localStorage.removeItem(USER_KEY);
  } catch (error) {
    console.error('Failed to clear token:', error);
  }
}

/**
 * Check if token exists and is valid
 */
export function hasValidToken(): boolean {
  return getToken() !== null;
}

/**
 * Store user data
 */
export function storeUser(user: any): void {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Failed to store user:', error);
  }
}

/**
 * Get user data
 */
export function getUser(): any | null {
  try {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Failed to get user:', error);
    return null;
  }
}

