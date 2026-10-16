/**
 * Utility to strip Vietnamese diacritics / accents for accent-insensitive searching.
 * Example:
 * "Trạm 110kV Chợ Lớn" -> "tram 110kv cho lon"
 * "Máy biến áp T1 63MVA" -> "may bien ap t1 63mva"
 * "Công trình KH SCL 2026" -> "cong trinh kh scl 2026"
 */
export function removeAccents(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

/**
 * Checks if target string matches query string using accent-insensitive comparison.
 */
export function matchVietnamese(targetText: string | undefined | null, query: string): boolean {
  if (!targetText || !query) return false;
  const normTarget = removeAccents(targetText);
  const normQuery = removeAccents(query);
  return normTarget.includes(normQuery);
}
