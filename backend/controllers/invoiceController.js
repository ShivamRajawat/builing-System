import pool from '../db.js';
import { computeInvoiceTotals } from '../services/billingTotals.js';
import {
  INVOICE_ID_LENGTH,
  INVOICE_ID_PREFIX,
  buildInvoiceId,
  normalizeInvoiceId,
  randomInvoiceSuffix,
} from '../services/invoiceId.js';
import { HttpError } from '../utils/HttpError.js';
import { parseInvoiceBody } from '../validators/invoiceRequest.js';

const MAX_INVOICE_ID_ATTEMPTS = 30;

async function generateUniqueInvoiceId(connection) {
  for (let i = 0; i < MAX_INVOICE_ID_ATTEMPTS; i += 1) {
    const id = buildInvoiceId(randomInvoiceSuffix());
    const [rows] = await connection.execute(
      'SELECT id FROM invoices WHERE id = ? LIMIT 1',
      [id]
    );
    if (rows.length === 0) return id;
  }
  const err = new Error('Could not generate a unique invoice id');
  err.statusCode = 500;
  throw err;
}

export async function createInvoice(req, res, next) {
  let parsed;
  try {
    parsed = parseInvoiceBody(req.body);
  } catch (e) {
    if (e instanceof HttpError) {
      return res.status(e.statusCode).json({ error: e.message });
    }
    return next(e);
  }

  const { customer_id, mergedLines } = parsed;
  const connection = await pool.getConnection();
  let transactionStarted = false;

  try {
    const [custRows] = await connection.execute(
      `SELECT customer_id, name, gst_number, status
       FROM customers
       WHERE customer_id = ?
       LIMIT 1`,
      [customer_id]
    );
    if (custRows.length === 0) {
      return res.status(404).json({ error: 'customer not found' });
    }
    const customer = custRows[0];
    if (customer.status !== 'Active') {
      return res.status(400).json({ error: 'customer is not active' });
    }

    let subtotal = 0;
    const resolvedLines = [];

    for (const row of mergedLines) {
      const itemId = row.item_id;
      const quantity = row.quantity;
      const [itemRows] = await connection.execute(
        `SELECT item_id, item_name, price, status
         FROM items
         WHERE item_id = ?
         LIMIT 1`,
        [itemId]
      );
      if (itemRows.length === 0) {
        return res.status(400).json({ error: `item not found: ${itemId}` });
      }
      const item = itemRows[0];
      if (item.status !== 'Active') {
        return res.status(400).json({ error: `item is not active: ${itemId}` });
      }
      const unitPrice = Number(item.price);
      const lineTotal = unitPrice * quantity;
      subtotal += lineTotal;
      resolvedLines.push({
        item_id: itemId,
        item_code: item.item_id,
        name: item.item_name,
        quantity,
        unit_price: unitPrice,
        line_total: lineTotal,
      });
    }

    subtotal = Math.round(subtotal * 100) / 100;
    const totals = computeInvoiceTotals(subtotal, customer.gst_number);
    const invoiceId = await generateUniqueInvoiceId(connection);

    await connection.beginTransaction();
    transactionStarted = true;

    await connection.execute(
      `INSERT INTO invoices (id, customer_id, subtotal, gst_amount, total_amount, gst_applied)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        invoiceId,
        customer.customer_id,
        subtotal,
        totals.gst_amount,
        totals.total_amount,
        totals.gst_applied ? 1 : 0,
      ]
    );

    for (const line of resolvedLines) {
      await connection.execute(
        `INSERT INTO invoice_items (invoice_id, item_id, quantity)
         VALUES (?, ?, ?)`,
        [invoiceId, line.item_id, line.quantity]
      );
    }

    await connection.commit();
    transactionStarted = false;

    return res.status(201).json({
      id: invoiceId,
      customer_id: customer.customer_id,
      subtotal,
      gst_applied: totals.gst_applied,
      gst_amount: totals.gst_amount,
      gst_rate_applied: totals.gst_rate_applied,
      total_amount: totals.total_amount,
      items: resolvedLines.map((l) => ({
        item_id: l.item_id,
        item_code: l.item_code,
        quantity: l.quantity,
        unit_price: l.unit_price,
        line_total: l.line_total,
      })),
    });
  } catch (err) {
    if (transactionStarted) {
      await connection.rollback();
    }
    next(err);
  } finally {
    connection.release();
  }
}

export async function listInvoices(req, res, next) {
  try {
    const { customer_id: customerIdRaw, limit: limitRaw } = req.query;
    const limit = Math.min(100, Math.max(1, parseInt(limitRaw, 10) || 50));

    if (
      customerIdRaw !== undefined &&
      customerIdRaw !== null &&
      String(customerIdRaw).trim() !== ''
    ) {
      const cid = parseInt(customerIdRaw, 10);
      if (!Number.isInteger(cid) || cid < 1) {
        return res.status(400).json({ error: 'customer_id must be a positive integer' });
      }
      const [rows] = await pool.query(
        `SELECT id, customer_id, subtotal, gst_amount, total_amount, gst_applied, created_at
         FROM invoices
         WHERE customer_id = ${cid}
         ORDER BY created_at DESC
         LIMIT ${limit}`
      );
      return res.json(rows);
    }

    const [rows] = await pool.query(
      `SELECT id, customer_id, subtotal, gst_amount, total_amount, gst_applied, created_at
       FROM invoices
       ORDER BY created_at DESC
       LIMIT ${limit}`
    );
    return res.json(rows);
  } catch (err) {
    next(err);
  }
}

export async function getInvoiceById(req, res, next) {
  try {
    const id = normalizeInvoiceId(req.params.id);
    if (!id) {
      return res.status(400).json({
        error: `invoice id must be ${INVOICE_ID_LENGTH} characters, prefix ${INVOICE_ID_PREFIX}, then alphanumeric`,
      });
    }

    const [invRows] = await pool.execute(
      `SELECT i.id, i.customer_id, i.subtotal, i.gst_amount, i.total_amount, i.gst_applied,
              i.created_at, c.name AS customer_name, c.gst_number
       FROM invoices i
       INNER JOIN customers c ON c.customer_id = i.customer_id
       WHERE i.id = ?`,
      [id]
    );
    if (invRows.length === 0) {
      return res.status(404).json({ error: 'invoice not found' });
    }

    const header = invRows[0];

    const [lines] = await pool.execute(
      `SELECT ii.item_id, ii.quantity,
              it.item_id AS item_code,
              it.item_name AS name,
              it.price AS unit_price,
              (it.price * ii.quantity) AS line_total
       FROM invoice_items ii
       INNER JOIN items it ON it.item_id = ii.item_id
       WHERE ii.invoice_id = ?
       ORDER BY ii.item_id ASC`,
      [id]
    );

    return res.json({ ...header, items: lines });
  } catch (err) {
    next(err);
  }
}