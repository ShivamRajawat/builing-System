import pool from '../db.js';

/**
 * @returns {Promise<import('mysql2').RowDataPacket[]>}
 */
export async function findAllItems() {
  const [rows] = await pool.execute(
    `SELECT item_id, item_name, price, status
     FROM items
     ORDER BY item_id ASC`
  );
  return rows;
}

/**
 * @param {string} itemId
 */
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

/**
 * @param {{ item_id: string, item_name: string, price: number, status: string }}
 */
export async function insertItem({ item_id, item_name, price, status }) {
  await pool.execute(
    `INSERT INTO items (item_id, item_name, price, status)
     VALUES (?, ?, ?, ?)`,
    [item_id, item_name, price, status]
  );
}

/**
 * @param {string} itemId
 * @param {{ item_name: string, price: number, status: string }}
 */
export async function updateItemById(itemId, { item_name, price, status }) {
  const [result] = await pool.execute(
    `UPDATE items
     SET item_name = ?, price = ?, status = ?
     WHERE item_id = ?`,
    [item_name, price, status, itemId]
  );
  return result.affectedRows;
}

/**
 * @param {string} itemId
 */
export async function deleteItemById(itemId) {
  const [result] = await pool.execute('DELETE FROM items WHERE item_id = ?', [itemId]);
  return result.affectedRows;
}
