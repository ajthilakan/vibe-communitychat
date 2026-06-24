// Lightweight client-side email check for the magic-link form. Not a substitute
// for server verification (the magic-link click proves ownership) — it just
// blocks obviously malformed input before calling signInWithOtp.
export function isValidEmail(value: string): boolean {
  const email = value.trim()
  if (email.length === 0 || email.length > 320) return false
  // One @, non-empty local part, a dot in the domain.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
