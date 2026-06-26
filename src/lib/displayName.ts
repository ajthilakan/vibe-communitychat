// Display-name rules shared by the profile editor and the first-entry prompt.
// The DB enforces the same trimmed 1–40 bound (profiles_display_name_len in
// 0008_profile_display_name.sql); this mirrors it client-side for fast feedback.
export const DISPLAY_NAME_MAX = 40

// Trim the ends and collapse internal whitespace runs so names store cleanly.
export function normalizeDisplayName(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

export function isValidDisplayName(value: string): boolean {
  const name = normalizeDisplayName(value)
  return name.length >= 1 && name.length <= DISPLAY_NAME_MAX
}
