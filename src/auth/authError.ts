// Magic-link callbacks land back on the app root. supabase-js parses a valid
// session straight out of the URL (AuthProvider then signs the user in), so the
// only case to handle is a FAILED link — an expired or already-used link, where
// Supabase appends error params to the URL hash. Returns a human message, or null
// when there is no error in the URL.
export function authErrorFromUrl(): string | null {
  const hash = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash
  const params = new URLSearchParams(hash)
  if (!params.get('error')) return null
  return (
    params.get('error_description')?.replace(/\+/g, ' ') ??
    'That sign-in link is invalid or has expired.'
  )
}
