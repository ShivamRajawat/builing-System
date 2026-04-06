/**
 * @param {unknown} value
 * @returns {'Active' | 'Inactive'}
 */
export function normalizeStatus(value) {
  if (value === undefined || value === null) return 'Active';
  const s = String(value).trim().toLowerCase();
  if (s === 'inactive' || s === 'in-active') return 'Inactive';
  return 'Active';
}
