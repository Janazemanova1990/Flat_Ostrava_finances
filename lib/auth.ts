const COOKIE_NAME = "flat_auth";
const MAX_AGE = 60 * 60 * 24 * 90;

async function getKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(process.env.AUTH_SECRET!),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function sign(value: string): Promise<string> {
  const key = await getKey();
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  const hex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${value}.${hex}`;
}

async function verify(signed: string): Promise<boolean> {
  const dotIndex = signed.lastIndexOf(".");
  if (dotIndex === -1) return false;
  const value = signed.slice(0, dotIndex);
  const hmac = signed.slice(dotIndex + 1);
  if (!value || !hmac) return false;
  try {
    const key = await getKey();
    const sigBytes = Uint8Array.from(hmac.match(/.{2}/g)!.map((h) => parseInt(h, 16)));
    return crypto.subtle.verify("HMAC", key, sigBytes, new TextEncoder().encode(value));
  } catch {
    return false;
  }
}

export async function makeAuthCookie(): Promise<string> {
  const signed = await sign("ok");
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=${signed}; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE}; Path=/${secure}`;
}

export function clearAuthCookie(): string {
  return `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/`;
}

export async function isValidCookie(cookieHeader: string | null): Promise<boolean> {
  if (!cookieHeader) return false;
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (!match) return false;
  return verify(match[1]);
}
