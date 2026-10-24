const encoder = new TextEncoder();
const PBKDF2_ITERATIONS = 210_000;

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

export function randomToken(bytes = 32): string {
  return bytesToBase64(crypto.getRandomValues(new Uint8Array(bytes)))
    .replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

export async function sha256(value: string): Promise<string> {
  return bytesToBase64(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value))));
}

export async function hashPassword(password: string, salt?: Uint8Array, iterations = PBKDF2_ITERATIONS) {
  if (password.length < 12 || password.length > 200) throw new Error("invalid_password");
  const actualSalt = salt ?? crypto.getRandomValues(new Uint8Array(16));
  const material = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: actualSalt as BufferSource, iterations }, material, 256);
  return { hash: bytesToBase64(new Uint8Array(bits)), salt: bytesToBase64(actualSalt), iterations };
}

export async function verifyPassword(password: string, expected: string, salt: string, iterations: number) {
  try {
    const actual = await hashPassword(password, base64ToBytes(salt), iterations);
    const a = base64ToBytes(actual.hash);
    const b = base64ToBytes(expected);
    if (a.length !== b.length) return false;
    let mismatch = 0;
    for (let i = 0; i < a.length; i++) mismatch |= a[i] ^ b[i];
    return mismatch === 0;
  } catch {
    return false;
  }
}
