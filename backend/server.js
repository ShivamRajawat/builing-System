import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import pool from './db.js';
import customerRoutes from './routes/customers.js';
import itemRoutes from './routes/items.js';
import invoiceRoutes from './routes/invoice.js';
import invoicesRoutes from './routes/invoices.js';

const app = express();
const PORT = Number(process.env.PORT) || 5000;

const corsOrigins = process.env.CORS_ORIGIN?.split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: corsOrigins?.length ? corsOrigins : true,
    credentials: true,
  })
);
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/customers', customerRoutes);
app.use('/items', itemRoutes);
app.use('/invoice', invoiceRoutes);
app.use('/invoices', invoicesRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler — MUST have 4 params so Express recognises it as error middleware
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.statusCode ?? err.status ?? 500;
  const message =
    status === 500 ? 'Internal server error' : err.message || 'Error';
  res.status(status).json({ error: message });
});

async function start() {
  try {
    const conn = await pool.getConnection();
    try {
      await conn.ping();
    } finally {
      conn.release();
    }
    const dbName = process.env.DB_NAME || 'billing_db';
    const dbHost = process.env.DB_HOST || 'localhost';
    console.log(`MySQL OK — database "${dbName}" @ ${dbHost}`);
  } catch (err) {
    console.error('\n========== MySQL connection failed ==========');
    console.error(err.message);
    console.error('\nFix: start MySQL, create DB (run schema.sql), set .env:');
    console.error('  DB_HOST, DB_USER, DB_PASSWORD, DB_NAME');
    console.error('============================================\n');
    process.exit(1);
  }

  // app.listen moved INSIDE start() so it only runs after DB check passes
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start();
