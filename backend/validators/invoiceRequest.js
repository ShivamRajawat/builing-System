import { HttpError } from '../utils/HttpError.js';

/**
 * @param {unknown} body
 * @returns {{ customer_id: number, mergedLines: { item_id: string, quantity: number }[] }}
 */
export function parseInvoiceBody(body) {
  if (body == null || typeof body !== 'object') {
    throw new HttpError(400, 'request body must be a JSON object');
  }

  const { customer_id, items: lineItems } = body;

  if (customer_id === undefined || customer_id === null) {
    throw new HttpError(400, 'customer_id is required');
  }

  const cid = Number(customer_id);
  if (!Number.isInteger(cid) || cid < 1) {
    throw new HttpError(400, 'customer_id must be a positive integer');
  }

  if (!Array.isArray(lineItems) || lineItems.length === 0) {
    throw new HttpError(400, 'items must be a non-empty array');
  }

  const map = new Map();
  for (const row of lineItems) {
    if (row == null || typeof row !== 'object') {
      throw new HttpError(400, 'each item must be an object');
    }
    if (row.item_id === undefined || row.quantity === undefined) {
      throw new HttpError(400, 'each item needs item_id and quantity');
    }
    const itemId = String(row.item_id).trim().toUpperCase();
    if (!itemId) {
      throw new HttpError(400, 'item_id must be a non-empty string');
    }
    const q = Number(row.quantity);
    if (!Number.isInteger(q) || q < 1) {
      throw new HttpError(400, 'quantity must be a positive integer');
    }
    map.set(itemId, (map.get(itemId) ?? 0) + q);
  }

  const mergedLines = [...map.entries()].map(([item_id, quantity]) => ({
    item_id,
    quantity,
  }));

  return { customer_id: cid, mergedLines };
}
