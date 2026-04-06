import pool from '../db.js';
import * as customerModel from '../models/customerModel.js';
import { formatCustomer } from '../utils/apiFormat.js';
import { normalizeStatus } from '../utils/normalizeStatus.js';

function normalizeGstNumber(value) {
  if (value === undefined || value === null) return null;
  const s = String(value).trim();
  return s.length === 0 ? null : s;
}

function normalizeOptionalString(value) {
  if (value === undefined || value === null) return null;
  const s = String(value).trim();
  return s.length === 0 ? null : s;
}

function parseCustomerIdParam(raw) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) return null;
  return id;
}

export async function createCustomer(req, res, next) {
  try {
    const { name, address, pan_number, gst_number, status } = req.body ?? {};

    if (name === undefined || name === null || String(name).trim() === '') {
      return res.status(400).json({ error: 'name is required' });
    }

    const insertId = await customerModel.insertCustomer({
      name: String(name).trim(),
      address: normalizeOptionalString(address),
      pan_number: normalizeOptionalString(pan_number),
      gst_number: normalizeGstNumber(gst_number),
      status: normalizeStatus(status),
    });

    const row = await customerModel.findCustomerById(insertId);
    return res.status(201).json(formatCustomer(row));
  } catch (err) {
    next(err);
  }
}

export async function listCustomers(req, res, next) {
  try {
    const rows = await customerModel.findAllCustomers();
    return res.json(rows.map(formatCustomer));
  } catch (err) {
    next(err);
  }
}

export async function updateCustomer(req, res, next) {
  try {
    const id = parseCustomerIdParam(req.params.id);
    if (!id) return res.status(400).json({ error: 'invalid customer id' });

    const { name, address, pan_number, gst_number, status } = req.body ?? {};
    if (name === undefined || name === null || String(name).trim() === '') {
      return res.status(400).json({ error: 'name is required' });
    }

    const affected = await customerModel.updateCustomerById(id, {
      name: String(name).trim(),
      address: normalizeOptionalString(address),
      pan_number: normalizeOptionalString(pan_number),
      gst_number: normalizeGstNumber(gst_number),
      status: normalizeStatus(status),
    });

    if (!affected) return res.status(404).json({ error: 'customer not found' });
    const row = await customerModel.findCustomerById(id);
    return res.json(formatCustomer(row));
  } catch (err) {
    next(err);
  }
}

export async function deleteCustomer(req, res, next) {
  try {
    const id = parseCustomerIdParam(req.params.id);
    if (!id) return res.status(400).json({ error: 'invalid customer id' });

    // BUG FIX: was querying `id` column but customers use `customer_id` as PK
    const [inv] = await pool.execute(
      'SELECT id FROM invoices WHERE customer_id = ? LIMIT 1',
      [id]
    );
    if (inv.length > 0) {
      return res.status(409).json({ error: 'cannot delete customer with existing invoices' });
    }

    const affected = await customerModel.deleteCustomerById(id);
    if (!affected) return res.status(404).json({ error: 'customer not found' });
    return res.status(200).json({ ok: true });
  } catch (err) {
    next(err);
  }
}
