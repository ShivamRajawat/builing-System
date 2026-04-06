-- LogiEdge Billing System — Complete Schema
-- Run this in MySQL: source schema.sql

USE billing_db;

-- Drop old tables (order matters due to foreign keys)
DROP TABLE IF EXISTS invoice_items;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS items;
DROP TABLE IF EXISTS customers;

-- ─── CUSTOMERS ───────────────────────────────────────────────
CREATE TABLE customers (
  customer_id   INT           NOT NULL AUTO_INCREMENT,
  name          VARCHAR(150)  NOT NULL,
  address       VARCHAR(255)      NULL DEFAULT NULL,
  pan_number    VARCHAR(20)       NULL DEFAULT NULL,
  gst_number    VARCHAR(20)       NULL DEFAULT NULL,
  status        ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── ITEMS ───────────────────────────────────────────────────
CREATE TABLE items (
  item_id       VARCHAR(30)   NOT NULL,
  item_name     VARCHAR(150)  NOT NULL,
  price         DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  status        ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── INVOICES ────────────────────────────────────────────────
CREATE TABLE invoices (
  id            VARCHAR(10)   NOT NULL,
  customer_id   INT           NOT NULL,
  subtotal      DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  gst_amount    DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  total_amount  DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  gst_applied   TINYINT(1)    NOT NULL DEFAULT 0,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_invoice_customer
    FOREIGN KEY (customer_id) REFERENCES customers (customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── INVOICE ITEMS ───────────────────────────────────────────
CREATE TABLE invoice_items (
  id            INT           NOT NULL AUTO_INCREMENT,
  invoice_id    VARCHAR(10)   NOT NULL,
  item_id       VARCHAR(30)   NOT NULL,
  quantity      INT           NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  CONSTRAINT fk_invitem_invoice
    FOREIGN KEY (invoice_id) REFERENCES invoices (id),
  CONSTRAINT fk_invitem_item
    FOREIGN KEY (item_id) REFERENCES items (item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── SAMPLE DATA ─────────────────────────────────────────────
INSERT INTO customers (name, address, pan_number, gst_number, status) VALUES
  ('Reliance Industries', 'Mumbai, Maharashtra', 'AAACR5055K', '27AAACR5055K1ZU', 'Active'),
  ('Infosys Ltd',         'Bengaluru, Karnataka','AAACI1681G', '29AAACI1681G1ZH', 'Active'),
  ('Kapil Sharma',        'Delhi',               NULL,         NULL,              'Active'),
  ('Meena Traders',       'Pune, Maharashtra',   NULL,         NULL,              'Active');

INSERT INTO items (item_id, item_name, price, status) VALUES
  ('IT00001', 'Laptop Dell XPS',        85000.00, 'Active'),
  ('IT00002', 'Office Chair Ergonomic', 12500.00, 'Active'),
  ('IT00003', 'HP Printer LaserJet',    18000.00, 'Active'),
  ('IT00004', 'USB-C Hub',               2499.00, 'Active'),
  ('IT00005', 'Monitor 24"',            16999.00, 'Active'),
  ('IT00006', 'Mechanical Keyboard',     4500.00, 'Active');

SELECT 'Schema created successfully!' AS status;