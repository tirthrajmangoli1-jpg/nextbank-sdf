/**
 * Client-side demo hashing utility.
 * IMPORTANT: In a real-world production banking system, password hashing and
 * verification must NEVER be performed on the client-side. This simple client-side
 * hash is strictly for simulation purposes in this demo project.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = 'nextbank_demo_salt_2026';
  const data = new TextEncoder().encode(password + salt);
  
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const buffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(buffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback below if subtle crypto is not supported
    }
  }

  // Fallback simple 32-bit FNV-1a based string hash for environments without SubtleCrypto
  let h1 = 0xdeadbeef ^ 0;
  let h2 = 0x41c6ce57 ^ 0;
  for (let i = 0; i < password.length; i++) {
    const ch = password.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(16, '0');
}
