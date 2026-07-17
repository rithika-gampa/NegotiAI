// Postgres connection + schema setup. Uses DATABASE_URL from the environment.
//
// For local testing without a real Postgres server, call setPool() with a
// pg-compatible pool (e.g. from pg-mem) BEFORE any store.js function runs.
// Production code never needs to do this — it's purely a test seam.

let pool = null;

function setPool(customPool) {
  pool = customPool;
}

function getPool() {
  if (pool) return pool;
  const { Pool } = require("pg");
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes("localhost")
      ? false
      : { rejectUnauthorized: false },
  });
  return pool;
}

async function query(text, params) {
  return getPool().query(text, params);
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  username_lower TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  mobile TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  base_price NUMERIC NOT NULL,
  stock NUMERIC NOT NULL
);

CREATE TABLE IF NOT EXISTS seller_rules (
  seller_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  min_margin_percent NUMERIC NOT NULL,
  max_discount_percent NUMERIC NOT NULL,
  bulk_discount_tiers JSONB NOT NULL,
  payment_terms_allowed JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY,
  product_id UUID,
  sku TEXT,
  seller_id UUID NOT NULL,
  buyer_user_id UUID,
  buyer_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  delivery_date TEXT,
  status TEXT NOT NULL,
  quote JSONB NOT NULL,
  pending_confirmation BOOLEAN NOT NULL DEFAULT false,
  history JSONB NOT NULL DEFAULT '[]',
  invoice_number TEXT,
  invoiced_at TIMESTAMPTZ,
  seller_acknowledged BOOLEAN NOT NULL DEFAULT false,
  stock_deducted BOOLEAN NOT NULL DEFAULT false,
  payment_status TEXT NOT NULL DEFAULT 'unpaid',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reset_tokens (
  token TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL
);

-- One-time verification codes (OTP) for confirming a new account's email or
-- mobile at signup. In this demo the code is shown on screen instead of being
-- sent by email/SMS (same approach as reset_tokens) — a real deployment would
-- deliver it and never return it in the API response.
CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  target TEXT NOT NULL,
  destination TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Direct human-to-human messages between buyer and seller on a deal —
-- separate from the AI negotiation history. Used for things the AI
-- shouldn't handle: "we're out of stock", "we don't want to sell to you",
-- delivery logistics, etc.
CREATE TABLE IF NOT EXISTS deal_messages (
  id UUID PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL,
  message TEXT NOT NULL,
  at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Out-of-stock waitlist / lead capture. When a buyer taps "notify me" on an
-- out-of-stock product, a 'waiting' row is created. When the seller restocks,
-- the rows flip to 'notified' and surface to the buyer as a back-in-stock
-- banner. The seller sees the waiting count as an unmet-demand signal.
CREATE TABLE IF NOT EXISTS stock_notifications (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL,
  buyer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  buyer_name TEXT NOT NULL,
  product_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting',
  seen BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notified_at TIMESTAMPTZ
);

-- Structured compliance audit trail — deliberately separate from the AI
-- negotiation history (deals.history) and direct messages (deal_messages),
-- since a compliance reviewer wants clean lifecycle events, not
-- conversational back-and-forth.
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  detail TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`;

// Migrations for columns added AFTER a table already existed in someone's
// database. CREATE TABLE IF NOT EXISTS only creates a table the first time —
// it silently does nothing on every later run, so any new column added to
// the schema string above will never actually reach an existing database
// without an explicit ALTER TABLE here. Each of these is safe to run every
// startup: IF NOT EXISTS makes them no-ops once applied.
const MIGRATIONS = `
ALTER TABLE deals ADD COLUMN IF NOT EXISTS seller_acknowledged BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS stock_deducted BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'unpaid';
ALTER TABLE deals ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS shop_description TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verified_via TEXT;
`;

async function initSchema() {
  await query(SCHEMA);
  await query(MIGRATIONS);
}

module.exports = { query, initSchema, setPool, getPool };
