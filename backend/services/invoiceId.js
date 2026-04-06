/** LogiEdge spec: unique alphanumeric id, prefix INVC, total length 10 (e.g. INVC224830). */

export const INVOICE_ID_PREFIX = 'INVC';
export const INVOICE_ID_LENGTH = 10;
const SUFFIX_LEN = INVOICE_ID_LENGTH - INVOICE_ID_PREFIX.length;

const ALPHANUM = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * @returns {string} 6-character suffix (0-9, A-Z)
 */
export function randomInvoiceSuffix() {
  let s = '';
  for (let i = 0; i < SUFFIX_LEN; i += 1) {
    s += ALPHANUM[Math.floor(Math.random() * ALPHANUM.length)];
  }
  return s;
}

/**
 * @param {string} suffix
 * @returns {string}
 */
export function buildInvoiceId(suffix) {
  return `${INVOICE_ID_PREFIX}${suffix}`;
}

/**
 * @param {unknown} raw
 * @returns {string | null} normalized id or null if invalid
 */
export function normalizeInvoiceId(raw) {
  if (raw == null) return null;
  const id = String(raw).trim().toUpperCase();
  if (id.length !== INVOICE_ID_LENGTH) return null;
  if (!id.startsWith(INVOICE_ID_PREFIX)) return null;
  const suffix = id.slice(INVOICE_ID_PREFIX.length);
  if (!/^[0-9A-Z]+$/.test(suffix) || suffix.length !== SUFFIX_LEN) return null;
  return id;
}
