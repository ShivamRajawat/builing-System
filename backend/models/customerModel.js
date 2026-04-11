import pool from '../db.js';

export async function findAllCustomers() {
  const [rows] = await pool.execute(
    `SELECT customer_id, name, address, pan_number, gst_number, status
     FROM customers
     ORDER BY customer_id ASC`
  );
  return rows;
}

export async function findCustomerById(customerId) {
  const [rows] = await pool.execute(
    `SELECT customer_id, name, address, pan_number, gst_number, status
     FROM customers
     WHERE customer_id = ?
     LIMIT 1`,
    [customerId]
  );
  return rows[0] ?? null;
}

export async function insertCustomer({ name, address, pan_number, gst_number, status }) {
  const [result] = await pool.execute(
    `INSERT INTO customers (name, address, pan_number, gst_number, status)
     VALUES (?, ?, ?, ?, ?)`,
    [name, address, pan_number, gst_number, status]
  );
  return result.insertId;
}

export async function updateCustomerById(customerId, { name, address, pan_number, gst_number, status }) {
  const [result] = await pool.execute(
    `UPDATE customers
     SET name = ?, address = ?, pan_number = ?, gst_number = ?, status = ?
     WHERE customer_id = ?`,
    [name, address, pan_number, gst_number, status, customerId]
  );
  return result.affectedRows;
}

export async function deleteCustomerById(customerId) {
  const [result] = await pool.execute(
    `DELETE FROM customers WHERE customer_id = ?`,
    [customerId]
  );
  return result.affectedRows;
}