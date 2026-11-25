/**
 * Browser-safe UUID generator.
 *
 * `crypto.randomUUID` is only defined in secure contexts (HTTPS or localhost).
 * The local `.test` domains are plain HTTP and are not "localhost", so the
 * browser omits it and calling it throws `crypto.randomUUID is not a function`
 * on kiosk/operator actions. Fall back to `crypto.getRandomValues`, which is
 * available in insecure contexts, and to a last-resort `Math.random` UUID so a
 * missing Web Crypto can never break intake.
 */
export function newIdempotencyKey(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID()
  }

  if (
    typeof crypto !== "undefined" &&
    typeof crypto.getRandomValues === "function"
  ) {
    const bytes = crypto.getRandomValues(new Uint8Array(16))

    // RFC 4122 version 4 layout.
    bytes[6] = (bytes[6] & 0x0f) | 0x40
    bytes[8] = (bytes[8] & 0x3f) | 0x80

    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"))

    return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex
      .slice(6, 8)
      .join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 16).join("")}`
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0
    const value = char === "x" ? random : (random & 0x3) | 0x8

    return value.toString(16)
  })
}
