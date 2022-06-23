export async function hmac(rawKey: ArrayBufferLike) {
  const key = await crypto.subtle.importKey(
    "raw",
    rawKey,
    { name: "HMAC", hash: { name: "SHA-256" } },
    false,
    ["sign", "verify"]
  );

  const digest = (message: ArrayBufferLike) =>
    crypto.subtle.sign("HMAC", key, message);

  // safe-compare ???
  const verify = (digest: ArrayBufferLike, message: ArrayBufferLike) =>
    crypto.subtle.verify("HMAC", key, digest, message);

  return [digest, verify] as const;
}
