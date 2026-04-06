import pool from '../db.js';
import * as itemModel from '../models/itemModel.js';
import { formatItem } from '../utils/apiFormat.js';
import { normalizeStatus } from '../utils/normalizeStatus.js';

function normalizeItemId(raw) {
  if (raw === undefined || raw === null) return null;
  const s = String(raw).trim().toUpperCase();
  return s.length === 0 ? null : s;
}

export async function createItem(req, res, next) {
  try {
    const body = req.body ?? {};
    const item_id = normalizeItemId(body.item_id ?? body.item_code);
    const item_name = body.item_name ?? body.name;
    const { price, status } = body;

    if (!item_id) {
      return res.status(400).json({ error: 'item_id is required' });
    }
    if (item_name === undefined || item_name === null || String(item_name).trim() === '') {
      return res.status(400).json({ error: 'item_name is required' });
    }

    const numPrice = Number(price);
    if (!Number.isFinite(numPrice) || numPrice < 0) {
      return res.status(400).json({ error: 'price must be a non-negative number' });
    }

    await itemModel.insertItem({
      item_id,
      item_name: String(item_name).trim(),
      price: numPrice,
      status: normalizeStatus(status),
    });

    const row = await itemModel.findItemById(item_id);
    return res.status(201).json(formatItem(row));
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'item_id already exists' });
    }
    next(err);
  }
}

export async function listItems(req, res, next) {
  try {
    const rows = await itemModel.findAllItems();
    return res.json(rows.map(formatItem));
  } catch (err) {
    next(err);
  }
}

export async function updateItem(req, res, next) {
  try {
    const item_id = normalizeItemId(req.params.id);
    if (!item_id) return res.status(400).json({ error: 'invalid item id' });

    const body = req.body ?? {};
    const item_name = body.item_name ?? body.name;
    const { price, status } = body;

    if (item_name === undefined || item_name === null || String(item_name).trim() === '') {
      return res.status(400).json({ error: 'item_name is required' });
    }
    const numPrice = Number(price);
    if (!Number.isFinite(numPrice) || numPrice < 0) {
      return res.status(400).json({ error: 'price must be a non-negative number' });
    }

    const affected = await itemModel.updateItemById(item_id, {
      item_name: String(item_name).trim(),
      price: numPrice,
      status: normalizeStatus(status),
    });

    if (!affected) return res.status(404).json({ error: 'item not found' });
    const row = await itemModel.findItemById(item_id);
    return res.json(formatItem(row));
  } catch (err) {
    next(err);
  }
}

export async function deleteItem(req, res, next) {
  try {
    const item_id = normalizeItemId(req.params.id);
    if (!item_id) return res.status(400).json({ error: 'invalid item id' });

    const [lines] = await pool.execute(
      'SELECT id FROM invoice_items WHERE item_id = ? LIMIT 1',
      [item_id]
    );
    if (lines.length > 0) {
      return res.status(409).json({ error: 'cannot delete item referenced on invoices' });
    }

    const affected = await itemModel.deleteItemById(item_id);
    if (!affected) return res.status(404).json({ error: 'item not found' });
    return res.status(200).json({ ok: true });
  } catch (err) {
    next(err);
  }
}
