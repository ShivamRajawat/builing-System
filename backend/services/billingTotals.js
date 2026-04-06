export const GST_RATE = 0.18;

/**
 * LogiEdge / GST-registered customer: no GST on bill. Otherwise 18% on subtotal.
 * We treat a non-empty gst_number as "GST registered".
 * @param {unknown} gstNumber
 * @returns {boolean}
 */
export function hasGstNumber(gstNumber) {
  if (gstNumber == null) return false;
  return String(gstNumber).trim().length > 0;
}

/**
 * @param {number} subtotal
 * @param {unknown} customerGstNumber
 * @returns {{ gst_applied: boolean, gst_amount: number, total_amount: number, gst_rate_applied: number }}
 */
export function computeInvoiceTotals(subtotal, customerGstNumber) {
  const safeSubtotal = Number(subtotal);
  const sub = Number.isFinite(safeSubtotal) ? safeSubtotal : 0;

  if (hasGstNumber(customerGstNumber)) {
    return {
      gst_applied: false,
      gst_amount: 0,
      total_amount: sub,
      gst_rate_applied: 0,
    };
  }

  const gst_amount = Math.round(sub * GST_RATE * 100) / 100;
  return {
    gst_applied: true,
    gst_amount,
    total_amount: Math.round((sub + gst_amount) * 100) / 100,
    gst_rate_applied: GST_RATE,
  };
}
