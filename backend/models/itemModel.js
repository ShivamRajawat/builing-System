import pool from '../db.js';

export async function findAllItems() {
  const [rows] = await pool.execute(
    `SELECT item_id, item_name, price, status
     FROM items
     ORDER BY item_id ASC`
  );
  return rows;
}

export async function findItemById(itemId) {
  const [rows] = await pool.execute(
    `SELECT item_id, item_name, price, status
     FROM items
     WHERE item_id = ?
     LIMIT 1`,
    [itemId]
  );
  return rows[0] ?? null;
}

export async function insertItem({ item_id, item_name, price, status }) {
  await pool.execute(
    `INSERT INTO items (item_id, item_name, price, status)
     VALUES (?, ?, ?, ?)`,
    [item_id, item_name, price, status]
  );
}

export async function updateItemById(itemId, { item_name, price, status }) {
  const [result] = await pool.execute(
    `UPDATE items
     SET item_name = ?, price = ?, status = ?
     WHERE item_id = ?`,
    [item_name, price, status, itemId]
  );
  return result.affectedRows;
}

export async function deleteItemById(itemId) {
  const [result] = await pool.execute(
    `DELETE FROM items WHERE item_id = ?`,
    [itemId]
  );
  return result.affectedRows;
}