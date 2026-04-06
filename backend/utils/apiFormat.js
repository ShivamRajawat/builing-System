/**
 * JSON shape aligned with existing React app (id, name, item_code aliases).
 * @param {import('mysql2').RowDataPacket} row
 */
export function formatCustomer(row) {
  if (!row) return null;
  return {
    customer_id: row.customer_id,
    id: row.customer_id,
    name: row.name,
    address: row.address ?? null,
    pan_number: row.pan_number ?? null,
    gst_number: row.gst_number ?? null,
    status: row.status,
  };
}

/**
 * @param {import('mysql2').RowDataPacket} row
 */
export function formatItem(row) {
  if (!row) return null;
  return {
    item_id: row.item_id,
    id: row.item_id,
    item_code: row.item_id,
    item_name: row.item_name,
    name: row.item_name,
    price: Number(row.price),
    status: row.status,
  };
}
