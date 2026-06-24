// Magic-link callbacks land back on the app root. supabase-js parses a valid
// session straight out of the URL (AuthProvider then signs the user in), so the
// only case to handle is a FAILED link — an expired or already-used link, where
// Supabase appends error params to the URL hash.

// Pure: given a location hash (with or without the leading '#'), return a human
// error message, or null when there is no error. Split out so it is unit-testable
// without a DOM.
export function parseAuthError(hash: string): string | null {
  const cleaned = hash.startsWith('#') ? hash.slice(1) : hash
  const params = new URLSearchParams(cleaned)
  if (!params.get('error')) return null
  // URLSearchParams already decodes '+' to space, so error_description is ready to show.
  return params.get('error_description') ?? 'That sign-in link is invalid or has expired.'
}

export function authErrorFromUrl(): string | null {
  return parseAuthError(window.location.hash)
}
