// Postgres-backed store. Replaces the old in-memory version — data now
// survives server restarts and redeploys, since Postgres is a separate
// managed service rather than living in this process's memory.

const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const db = require("./db");

const DEFAULT_RULES = {
  min_margin_percent: 15,
  max_discount_percent: 12,
  bulk_discount_tiers: [
    { min_qty: 100, extra_discount: 3 },
    { min_qty: 500, extra_discount: 6 },
  ],
  payment_terms_allowed: ["net_15", "net_30", "advance"],
};

// --- Users / auth ---

async function createUser({ username, password, role, name, email, mobile }) {
  const usernameLower = username.trim().toLowerCase();
  const existing = await db.query("SELECT id FROM users WHERE username_lower = $1", [usernameLower]);
  if (existing.rows.length) throw new Error("Username already taken");

  if (email) {
    const e = await db.query("SELECT id FROM users WHERE email = $1", [email.trim().toLowerCase()]);
    if (e.rows.length) throw new Error("Email already in use");
  }
  if (mobile) {
    const m = await db.query("SELECT id FROM users WHERE mobile = $1", [mobile.trim()]);
    if (m.rows.length) throw new Error("Mobile number already in use");
  }

  const id = crypto.randomUUID();
  const passwordHash = bcrypt.hashSync(password, 10);
  const emailVal = email ? email.trim().toLowerCase() : null;
  const mobileVal = mobile ? mobile.trim() : null;

  await db.query(
    `INSERT INTO users (id, username, username_lower, email, mobile, password_hash, role, name)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [id, username.trim(), usernameLower, emailVal, mobileVal, passwordHash, role, name.trim()]
  );

  const user = {
    id,
    username: username.trim(),
    email: emailVal,
    mobile: mobileVal,
    passwordHash,
    role,
    name: name.trim(),
    created_at: new Date().toISOString(),
  };

  if (role === "seller") {
    await db.query(
      `INSERT INTO seller_rules (seller_id, min_margin_percent, max_discount_percent, bulk_discount_tiers, payment_terms_allowed)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        id,
        DEFAULT_RULES.min_margin_percent,
        DEFAULT_RULES.max_discount_percent,
        JSON.stringify(DEFAULT_RULES.bulk_discount_tiers),
        JSON.stringify(DEFAULT_RULES.payment_terms_allowed),
      ]
    );
  }

  return user;
}

function rowToUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    mobile: row.mobile,
    passwordHash: row.password_hash,
    role: row.role,
    name: row.name,
    shop_description: row.shop_description || null,
    verified: row.verified || false,
    verified_via: row.verified_via || null,
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  };
}

async function findUserByUsername(username) {
  const res = await db.query("SELECT * FROM users WHERE username_lower = $1", [username.trim().toLowerCase()]);
  return rowToUser(res.rows[0]);
}

async function findUserByIdentifier(identifier) {
  const cleanedLower = identifier.trim().toLowerCase();
  const cleanedRaw = identifier.trim();
  const res = await db.query(
    "SELECT * FROM users WHERE username_lower = $1 OR email = $1 OR mobile = $2",
    [cleanedLower, cleanedRaw]
  );
  return rowToUser(res.rows[0]);
}

async function findUserById(id) {
  const res = await db.query("SELECT * FROM users WHERE id = $1", [id]);
  return rowToUser(res.rows[0]);
}

function verifyPassword(user, password) {
  return bcrypt.compareSync(password, user.passwordHash);
}

async function updateUserPassword(userId, newPassword) {
  const hash = bcrypt.hashSync(newPassword, 10);
  const res = await db.query("UPDATE users SET password_hash = $1 WHERE id = $2", [hash, userId]);
  return res.rowCount > 0;
}

function toPublicUser(user) {
  if (!user) return null;
  const { passwordHash, ...pub } = user;
  return pub;
}

// --- Password reset ---
const RESET_TOKEN_TTL_MS = 15 * 60 * 1000;

async function createPasswordResetToken(userId) {
  const token = crypto.randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
  await db.query("INSERT INTO reset_tokens (token, user_id, expires_at) VALUES ($1, $2, $3)", [token, userId, expiresAt]);
  return token;
}

async function consumePasswordResetToken(token) {
  const res = await db.query("SELECT * FROM reset_tokens WHERE token = $1", [token]);
  const row = res.rows[0];
  if (!row) return null;
  await db.query("DELETE FROM reset_tokens WHERE token = $1", [token]);
  const expiresAt = row.expires_at instanceof Date ? row.expires_at.getTime() : new Date(row.expires_at).getTime();
  if (Date.now() > expiresAt) return null;
  return row.user_id;
}

// --- OTP verification (email/mobile at signup) ---
const OTP_TTL_MS = 10 * 60 * 1000;

async function createOtpCode(userId, target, destination) {
  // Only one active code per user — clear any previous ones first.
  await db.query("DELETE FROM otp_codes WHERE user_id = $1", [userId]);
  const id = crypto.randomUUID();
  const code = String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);
  await db.query(
    "INSERT INTO otp_codes (id, user_id, code, target, destination, expires_at) VALUES ($1, $2, $3, $4, $5, $6)",
    [id, userId, code, target, destination, expiresAt]
  );
  return code;
}

// Returns "ok" | "invalid" | "expired". On success, marks the user verified
// and clears their codes.
async function verifyOtpCode(userId, code) {
  const res = await db.query("SELECT * FROM otp_codes WHERE user_id = $1", [userId]);
  const row = res.rows[0];
  if (!row || String(row.code) !== String(code).trim()) return "invalid";
  const expiresAt = row.expires_at instanceof Date ? row.expires_at.getTime() : new Date(row.expires_at).getTime();
  if (Date.now() > expiresAt) return "expired";
  await db.query("UPDATE users SET verified = true, verified_via = $1 WHERE id = $2", [row.target, userId]);
  await db.query("DELETE FROM otp_codes WHERE user_id = $1", [userId]);
  return "ok";
}

async function markUserVerified(userId, via) {
  await db.query("UPDATE users SET verified = true, verified_via = $1 WHERE id = $2", [via || "manual", userId]);
}

// --- Products ---

function rowToProduct(row) {
  if (!row) return null;
  return {
    id: row.id,
    seller_id: row.seller_id,
    sku: row.sku,
    name: row.name,
    base_price: Number(row.base_price),
    stock: Number(row.stock),
  };
}

async function addProduct(sellerId, { sku, name, base_price, stock }) {
  const id = crypto.randomUUID();
  const finalSku = sku && sku.trim() ? sku.trim() : `SKU-${id.slice(0, 6).toUpperCase()}`;
  await db.query(
    "INSERT INTO products (id, seller_id, sku, name, base_price, stock) VALUES ($1, $2, $3, $4, $5, $6)",
    [id, sellerId, finalSku, name.trim(), Number(base_price), Number(stock)]
  );
  return { id, seller_id: sellerId, sku: finalSku, name: name.trim(), base_price: Number(base_price), stock: Number(stock) };
}

async function updateProduct(sellerId, productId, updates) {
  const res = await db.query("SELECT * FROM products WHERE id = $1 AND seller_id = $2", [productId, sellerId]);
  const existing = res.rows[0];
  if (!existing) return null;

  const base_price = updates.base_price !== undefined ? Number(updates.base_price) || Number(existing.base_price) : Number(existing.base_price);
  const stock = updates.stock !== undefined ? Number(updates.stock) : Number(existing.stock);
  const name = updates.name !== undefined ? updates.name : existing.name;

  await db.query("UPDATE products SET base_price = $1, stock = $2, name = $3 WHERE id = $4", [base_price, stock, name, productId]);

  // Restock event: if the product was out and now has stock, fulfill any
  // waiting notifications so buyers get a back-in-stock alert.
  if (Number(existing.stock) <= 0 && stock > 0) {
    await fulfillStockNotifications(productId);
  }
  return rowToProduct({ ...existing, base_price, stock, name });
}

// --- Out-of-stock waitlist / lead capture ---

async function addStockNotification(product, buyer) {
  // Don't duplicate an existing 'waiting' subscription for this buyer+product.
  const existing = await db.query(
    "SELECT id FROM stock_notifications WHERE product_id = $1 AND buyer_user_id = $2 AND status = 'waiting'",
    [product.id, buyer.id]
  );
  if (existing.rows.length) return { already: true };
  const id = crypto.randomUUID();
  await db.query(
    `INSERT INTO stock_notifications (id, product_id, seller_id, buyer_user_id, buyer_name, product_name)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [id, product.id, product.seller_id, buyer.id, buyer.name, product.name]
  );
  return { already: false };
}

// product_id -> count of buyers currently waiting (the seller's demand signal).
async function getStockWaitCountsForSeller(sellerId) {
  const res = await db.query(
    "SELECT product_id, COUNT(*) AS c FROM stock_notifications WHERE seller_id = $1 AND status = 'waiting' GROUP BY product_id",
    [sellerId]
  );
  const map = {};
  for (const row of res.rows) map[row.product_id] = Number(row.c);
  return map;
}

async function fulfillStockNotifications(productId) {
  await db.query(
    "UPDATE stock_notifications SET status = 'notified', notified_at = now() WHERE product_id = $1 AND status = 'waiting'",
    [productId]
  );
}

// Back-in-stock alerts for a buyer that they haven't dismissed yet.
async function getBuyerBackInStock(buyerId) {
  const res = await db.query(
    `SELECT sn.*, p.id AS live_product_id, p.stock
     FROM stock_notifications sn
     JOIN products p ON p.id = sn.product_id
     WHERE sn.buyer_user_id = $1 AND sn.status = 'notified' AND sn.seen = false
     ORDER BY sn.notified_at DESC`,
    [buyerId]
  );
  return res.rows.map((row) => ({
    id: row.id,
    product_id: row.product_id,
    product_name: row.product_name,
    in_stock: Number(row.stock) > 0,
  }));
}

async function markBuyerNotificationsSeen(buyerId) {
  await db.query("UPDATE stock_notifications SET seen = true WHERE buyer_user_id = $1 AND status = 'notified'", [buyerId]);
}

async function findProductById(productId) {
  const res = await db.query("SELECT * FROM products WHERE id = $1", [productId]);
  return rowToProduct(res.rows[0]);
}

async function getProductsForSeller(sellerId) {
  const res = await db.query("SELECT * FROM products WHERE seller_id = $1", [sellerId]);
  return res.rows.map(rowToProduct);
}

async function getAllProductsForBuyers() {
  const res = await db.query(
    `SELECT p.*, u.name AS seller_name, u.shop_description AS seller_description
     FROM products p
     JOIN users u ON u.id = p.seller_id`
  );
  const products = res.rows.map((row) => ({
    ...rowToProduct(row),
    seller_name: row.seller_name,
    seller_description: row.seller_description || null,
  }));

  // Trust stats for every seller in ONE aggregate query. The old per-seller
  // loop meant one extra round trip per seller — noticeable on a remote
  // Postgres where each round trip costs real latency.
  const trustRes = await db.query(
    `SELECT seller_id, COUNT(*) AS completed
     FROM deals
     WHERE status IN ('confirmed', 'invoiced')
     GROUP BY seller_id`
  );
  const completedBySeller = {};
  for (const row of trustRes.rows) completedBySeller[row.seller_id] = Number(row.completed);

  return products.map((p) => {
    const completed = completedBySeller[p.seller_id] || 0;
    return { ...p, seller_verified: completed >= 1, seller_completed_deals: completed };
  });
}

// --- Seller shop profile (shown to buyers on the marketplace) ---

async function getSellerDescription(sellerId) {
  const res = await db.query("SELECT shop_description FROM users WHERE id = $1", [sellerId]);
  return res.rows[0] ? res.rows[0].shop_description || null : null;
}

async function updateSellerDescription(sellerId, description) {
  await db.query("UPDATE users SET shop_description = $1 WHERE id = $2", [description, sellerId]);
}

async function getSellerRules(sellerId) {
  const res = await db.query("SELECT * FROM seller_rules WHERE seller_id = $1", [sellerId]);
  const row = res.rows[0];
  if (!row) return DEFAULT_RULES;
  return {
    min_margin_percent: Number(row.min_margin_percent),
    max_discount_percent: Number(row.max_discount_percent),
    bulk_discount_tiers: typeof row.bulk_discount_tiers === "string" ? JSON.parse(row.bulk_discount_tiers) : row.bulk_discount_tiers,
    payment_terms_allowed: typeof row.payment_terms_allowed === "string" ? JSON.parse(row.payment_terms_allowed) : row.payment_terms_allowed,
  };
}

async function updateSellerRules(sellerId, newRules) {
  const current = await getSellerRules(sellerId);
  const merged = { ...current, ...newRules };
  await db.query(
    `INSERT INTO seller_rules (seller_id, min_margin_percent, max_discount_percent, bulk_discount_tiers, payment_terms_allowed)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (seller_id) DO UPDATE SET
       min_margin_percent = $2, max_discount_percent = $3, bulk_discount_tiers = $4, payment_terms_allowed = $5`,
    [sellerId, merged.min_margin_percent, merged.max_discount_percent, JSON.stringify(merged.bulk_discount_tiers), JSON.stringify(merged.payment_terms_allowed)]
  );
  return merged;
}

// --- Invoices ---
let invoiceCounter = 1000;
function nextInvoiceNumber() {
  invoiceCounter += 1;
  return `INV-${invoiceCounter}`;
}

// --- Deals ---

function rowToDeal(row) {
  if (!row) return null;
  return {
    id: row.id,
    product_id: row.product_id,
    sku: row.sku,
    seller_id: row.seller_id,
    buyer_user_id: row.buyer_user_id,
    buyer_name: row.buyer_name,
    quantity: Number(row.quantity),
    delivery_date: row.delivery_date,
    status: row.status,
    quote: typeof row.quote === "string" ? JSON.parse(row.quote) : row.quote,
    pending_confirmation: row.pending_confirmation,
    history: typeof row.history === "string" ? JSON.parse(row.history) : row.history,
    invoice_number: row.invoice_number,
    invoiced_at: row.invoiced_at instanceof Date ? row.invoiced_at.toISOString() : row.invoiced_at,
    seller_acknowledged: row.seller_acknowledged,
    stock_deducted: row.stock_deducted,
    payment_status: row.payment_status,
    paid_at: row.paid_at instanceof Date ? row.paid_at.toISOString() : row.paid_at,
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    last_activity_at: row.last_activity_at instanceof Date ? row.last_activity_at.toISOString() : row.last_activity_at,
  };
}

async function createDeal({ product_id, sku, quantity, delivery_date, buyer_name, buyer_user_id, seller_id, initialQuote }) {
  const id = crypto.randomUUID();
  await db.query(
    `INSERT INTO deals (id, product_id, sku, seller_id, buyer_user_id, buyer_name, quantity, delivery_date, status, quote, pending_confirmation, history, seller_acknowledged, stock_deducted, payment_status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'quote_sent', $9, false, '[]', false, false, 'unpaid')`,
    [id, product_id, sku, seller_id, buyer_user_id || null, buyer_name || "Buyer", quantity, delivery_date || null, JSON.stringify(initialQuote)]
  );
  await logAuditEvent(id, seller_id, "quote_created", `Quote generated for ${quantity} x ${initialQuote.product_name || sku} at ${initialQuote.total}`, "buyer");
  return getDeal(id);
}

async function getDeal(id) {
  const res = await db.query("SELECT * FROM deals WHERE id = $1", [id]);
  return rowToDeal(res.rows[0]);
}

async function listDeals() {
  const res = await db.query("SELECT * FROM deals ORDER BY created_at DESC");
  return res.rows.map(rowToDeal);
}

async function updateDeal(id, updates) {
  const existing = await getDeal(id);
  if (!existing) return null;

  const merged = { ...existing, ...updates };
  await db.query(
    `UPDATE deals SET status = $1, quote = $2, pending_confirmation = $3, invoice_number = $4, invoiced_at = $5,
       seller_acknowledged = $6, stock_deducted = $7, payment_status = $8, paid_at = $9
     WHERE id = $10`,
    [
      merged.status,
      JSON.stringify(merged.quote),
      merged.pending_confirmation,
      merged.invoice_number || null,
      merged.invoiced_at || null,
      merged.seller_acknowledged,
      merged.stock_deducted,
      merged.payment_status,
      merged.paid_at || null,
      id,
    ]
  );
  return getDeal(id);
}

// Marks an invoiced deal as paid — the core of "Smart Billing & Payments"
// and the input to the ledger/revenue views below.
async function markDealPaid(id) {
  const paidAt = new Date().toISOString();
  await db.query("UPDATE deals SET payment_status = 'paid', paid_at = $1 WHERE id = $2", [paidAt, id]);
  const deal = await getDeal(id);
  if (deal) {
    await logAuditEvent(id, deal.seller_id, "payment_received", `Marked as paid — ₹${deal.quote.total}`, "seller");
  }
  return deal;
}

// Smart Billing & Payments: automated reminder. The seller doesn't have to
// compose anything — one click generates the reminder text (with days
// overdue, invoice number, and amount) and sends it through the same direct
// message channel the buyer already checks, plus logs it to the audit trail.
async function sendPaymentReminder(id) {
  const deal = await getDeal(id);
  if (!deal) return null;
  if (deal.status !== "invoiced" || deal.payment_status === "paid") return null;

  const daysOverdue = Math.floor((Date.now() - new Date(deal.invoiced_at).getTime()) / (1000 * 60 * 60 * 24));
  const overdueText = daysOverdue > 0 ? ` (${daysOverdue} day${daysOverdue === 1 ? "" : "s"} overdue)` : "";
  const message =
    `Payment reminder: Invoice ${deal.invoice_number} for ₹${deal.quote.total.toLocaleString("en-IN")} ` +
    `is still awaiting payment${overdueText}. Please arrange payment at your earliest convenience.`;

  const saved = await addDealMessage(id, "seller", message);
  await logAuditEvent(id, deal.seller_id, "reminder_sent", `Automated payment reminder sent for invoice ${deal.invoice_number}`, "seller");
  return saved;
}

// Called the moment a deal is finalized (both sides confirmed). Deducts the
// ordered quantity from the product's stock exactly once — the
// stock_deducted flag makes this safe to call even if confirmation logic
// somehow runs twice for the same deal.
async function confirmDealAndDeductStock(id) {
  const deal = await getDeal(id);
  if (!deal) return null;

  if (!deal.stock_deducted && deal.product_id) {
    const productRes = await db.query("SELECT * FROM products WHERE id = $1", [deal.product_id]);
    const product = productRes.rows[0];
    if (product) {
      const newStock = Math.max(0, Number(product.stock) - deal.quantity);
      await db.query("UPDATE products SET stock = $1 WHERE id = $2", [newStock, deal.product_id]);
    }
  }

  await db.query(
    "UPDATE deals SET status = 'confirmed', pending_confirmation = false, stock_deducted = true WHERE id = $1",
    [id]
  );
  await logAuditEvent(id, deal.seller_id, "deal_confirmed", `Deal confirmed at ₹${deal.quote.total} — stock deducted by ${deal.quantity} units`, "system");
  return getDeal(id);
}

// Marks a newly-placed order as seen by the seller — clears the "new order"
// notification for it.
async function acknowledgeDeal(id) {
  await db.query("UPDATE deals SET seller_acknowledged = true WHERE id = $1", [id]);
  const deal = await getDeal(id);
  if (deal) await logAuditEvent(id, deal.seller_id, "order_acknowledged", "Seller acknowledged the new order", "seller");
  return deal;
}

async function appendHistory(id, entry) {
  const existing = await getDeal(id);
  if (!existing) return null;
  const at = new Date().toISOString();
  const newHistory = [...existing.history, { ...entry, at }];
  await db.query("UPDATE deals SET history = $1, last_activity_at = $2 WHERE id = $3", [JSON.stringify(newHistory), at, id]);
  return getDeal(id);
}

async function getSellerTrustStats(sellerId) {
  const res = await db.query(
    "SELECT COUNT(*) AS count FROM deals WHERE seller_id = $1 AND status IN ('confirmed', 'invoiced')",
    [sellerId]
  );
  const completed = Number(res.rows[0].count);
  return { completed_deals: completed, verified: completed >= 1 };
}

// --- Audit log (compliance) ---

async function logAuditEvent(dealId, sellerId, eventType, detail, actorRole) {
  const id = crypto.randomUUID();
  await db.query(
    "INSERT INTO audit_log (id, deal_id, seller_id, event_type, detail, actor_role) VALUES ($1, $2, $3, $4, $5, $6)",
    [id, dealId, sellerId, eventType, detail, actorRole]
  );
}

function rowToAuditEntry(row) {
  return {
    id: row.id,
    deal_id: row.deal_id,
    event_type: row.event_type,
    detail: row.detail,
    actor_role: row.actor_role,
    at: row.at instanceof Date ? row.at.toISOString() : row.at,
    buyer_name: row.buyer_name,
    sku: row.sku,
  };
}

async function getAuditLogForSeller(sellerId) {
  const res = await db.query(
    `SELECT a.*, d.buyer_name, d.sku
     FROM audit_log a
     JOIN deals d ON d.id = a.deal_id
     WHERE a.seller_id = $1
     ORDER BY a.at DESC
     LIMIT 500`,
    [sellerId]
  );
  return res.rows.map(rowToAuditEntry);
}

// --- Ledger: dues/credit tracking per buyer ---

async function getLedgerForSeller(sellerId) {
  const res = await db.query(
    `SELECT buyer_name, buyer_user_id, status, payment_status, quote
     FROM deals
     WHERE seller_id = $1 AND status IN ('invoiced')`,
    [sellerId]
  );

  const byBuyer = {};
  for (const row of res.rows) {
    const quote = typeof row.quote === "string" ? JSON.parse(row.quote) : row.quote;
    const key = row.buyer_user_id || row.buyer_name;
    if (!byBuyer[key]) {
      byBuyer[key] = { buyer_name: row.buyer_name, total_invoiced: 0, total_paid: 0, outstanding: 0, invoice_count: 0 };
    }
    byBuyer[key].total_invoiced += quote.total;
    byBuyer[key].invoice_count += 1;
    if (row.payment_status === "paid") {
      byBuyer[key].total_paid += quote.total;
    } else {
      byBuyer[key].outstanding += quote.total;
    }
  }

  return Object.values(byBuyer).sort((a, b) => b.outstanding - a.outstanding);
}

// --- Revenue intelligence ---

async function getRevenueStatsForSeller(sellerId) {
  const res = await db.query("SELECT status, payment_status, quote, created_at FROM deals WHERE seller_id = $1", [sellerId]);
  const deals = res.rows.map((row) => ({
    status: row.status,
    payment_status: row.payment_status,
    quote: typeof row.quote === "string" ? JSON.parse(row.quote) : row.quote,
    created_at: row.created_at,
  }));

  const totalRevenue = deals.filter((d) => d.payment_status === "paid").reduce((sum, d) => sum + d.quote.total, 0);
  const outstandingDues = deals
    .filter((d) => d.status === "invoiced" && d.payment_status !== "paid")
    .reduce((sum, d) => sum + d.quote.total, 0);
  const pipelineValue = deals
    .filter((d) => ["quote_sent", "negotiating", "confirmed"].includes(d.status))
    .reduce((sum, d) => sum + d.quote.total, 0);
  const closedDeals = deals.filter((d) => ["confirmed", "invoiced"].includes(d.status));
  const avgDealSize = closedDeals.length ? closedDeals.reduce((sum, d) => sum + d.quote.total, 0) / closedDeals.length : 0;

  const countsByStatus = {};
  for (const d of deals) countsByStatus[d.status] = (countsByStatus[d.status] || 0) + 1;

  return {
    total_revenue: Math.round(totalRevenue),
    outstanding_dues: Math.round(outstandingDues),
    pipeline_value: Math.round(pipelineValue),
    avg_deal_size: Math.round(avgDealSize),
    counts_by_status: countsByStatus,
    total_deals: deals.length,
  };
}

// --- Deal Intelligence: quantifies what the AI negotiation agent actually
// did for the seller. Every number here is derived from real deal data
// (the quote snapshot + negotiation history stored on each deal) — nothing
// is estimated or faked. ---
async function getDealIntelligenceForSeller(sellerId) {
  const res = await db.query("SELECT status, quote, history, created_at FROM deals WHERE seller_id = $1", [sellerId]);
  const rules = await getSellerRules(sellerId);
  const maxDiscount = Number(rules.max_discount_percent) || 0;

  const deals = res.rows.map((row) => ({
    status: row.status,
    quote: typeof row.quote === "string" ? JSON.parse(row.quote) : row.quote,
    history: typeof row.history === "string" ? JSON.parse(row.history) : row.history || [],
  }));

  const closed = deals.filter((d) => ["confirmed", "invoiced"].includes(d.status));
  // A deal counts as "negotiated" if the buyer sent at least one message to
  // the agent (i.e. they didn't just take the instant quote untouched).
  const negotiated = deals.filter((d) => (d.history || []).some((h) => h.role === "buyer"));
  const negotiatedClosed = closed.filter((d) => (d.history || []).some((h) => h.role === "buyer"));

  // Discount + margin math over closed deals.
  let totalListValue = 0; // what the goods would have cost at list price
  let totalDiscountGiven = 0; // ₹ the agent conceded
  let maxAllowedDiscountValue = 0; // ₹ the agent COULD have conceded at the ceiling
  let discountPctSum = 0;
  for (const d of closed) {
    const q = d.quote || {};
    const list = (Number(q.base_price) || 0) * (Number(q.quantity) || 0);
    const given = Math.max(0, list - (Number(q.total) || 0));
    totalListValue += list;
    totalDiscountGiven += given;
    maxAllowedDiscountValue += list * (maxDiscount / 100);
    discountPctSum += Number(q.discount_percent) || 0;
  }
  // Margin the agent protected: how much discount room it was allowed to use
  // but chose not to (because the buyer settled higher).
  const marginProtected = Math.max(0, maxAllowedDiscountValue - totalDiscountGiven);
  const avgDiscountPct = closed.length ? discountPctSum / closed.length : 0;

  // Average exchanges to close a negotiated deal.
  const roundsList = negotiatedClosed.map((d) => (d.history || []).filter((h) => h.role === "buyer").length);
  const avgRounds = roundsList.length ? roundsList.reduce((a, b) => a + b, 0) / roundsList.length : 0;

  // Win rate: closed deals as a share of all deals that actually entered the
  // funnel (i.e. a quote was created — which is every deal).
  const winRate = deals.length ? (closed.length / deals.length) * 100 : 0;

  // Most-negotiated product (by number of negotiated deals).
  const byProduct = {};
  for (const d of negotiated) {
    const name = (d.quote && d.quote.product_name) || "—";
    byProduct[name] = (byProduct[name] || 0) + 1;
  }
  let topProduct = null, topProductCount = 0;
  for (const [name, count] of Object.entries(byProduct)) {
    if (count > topProductCount) { topProduct = name; topProductCount = count; }
  }

  const funnel = {
    quote_sent: deals.filter((d) => d.status === "quote_sent").length,
    negotiating: deals.filter((d) => d.status === "negotiating").length,
    confirmed: deals.filter((d) => d.status === "confirmed").length,
    invoiced: deals.filter((d) => d.status === "invoiced").length,
  };

  return {
    total_deals: deals.length,
    negotiated_deals: negotiated.length,
    closed_deals: closed.length,
    win_rate: Math.round(winRate),
    avg_discount_pct: Math.round(avgDiscountPct * 10) / 10,
    max_discount_pct: maxDiscount,
    total_discount_given: Math.round(totalDiscountGiven),
    margin_protected: Math.round(marginProtected),
    closed_revenue: Math.round(closed.reduce((s, d) => s + (Number(d.quote.total) || 0), 0)),
    avg_rounds_to_close: Math.round(avgRounds * 10) / 10,
    top_negotiated_product: topProduct,
    top_negotiated_count: topProductCount,
    funnel,
  };
}

// --- Direct seller <-> buyer messages (separate from AI negotiation) ---

async function addDealMessage(dealId, senderRole, message) {
  const id = crypto.randomUUID();
  await db.query(
    "INSERT INTO deal_messages (id, deal_id, sender_role, message) VALUES ($1, $2, $3, $4)",
    [id, dealId, senderRole, message]
  );
  const res = await db.query("SELECT * FROM deal_messages WHERE id = $1", [id]);
  return rowToMessage(res.rows[0]);
}

function rowToMessage(row) {
  if (!row) return null;
  return {
    id: row.id,
    deal_id: row.deal_id,
    sender_role: row.sender_role,
    message: row.message,
    at: row.at instanceof Date ? row.at.toISOString() : row.at,
  };
}

async function getDealMessages(dealId) {
  const res = await db.query("SELECT * FROM deal_messages WHERE deal_id = $1 ORDER BY at ASC", [dealId]);
  return res.rows.map(rowToMessage);
}

// One conversation per deal for the logged-in user's inbox — with the
// counterparty's name and the latest message for the preview line. Batched
// into at most three queries total (deals, messages, seller names) — a
// per-deal loop here multiplies remote-Postgres round-trip latency.
async function getConversationsForUser(user) {
  const all = await listDeals();
  const mine =
    user.role === "buyer"
      ? all.filter((d) => d.buyer_user_id === user.id)
      : all.filter((d) => d.seller_id === user.id);
  if (!mine.length) return [];

  const dealIds = mine.map((d) => d.id);
  const msgRes = await db.query(
    "SELECT * FROM deal_messages WHERE deal_id = ANY($1) ORDER BY at ASC",
    [dealIds]
  );
  const messagesByDeal = {};
  for (const row of msgRes.rows) {
    const m = rowToMessage(row);
    (messagesByDeal[m.deal_id] = messagesByDeal[m.deal_id] || []).push(m);
  }

  const sellerNames = {};
  if (user.role === "buyer") {
    const sellerIds = [...new Set(mine.map((d) => d.seller_id))];
    const nameRes = await db.query("SELECT id, name FROM users WHERE id = ANY($1)", [sellerIds]);
    for (const row of nameRes.rows) sellerNames[row.id] = row.name;
  }

  const conversations = mine.map((d) => {
    const messages = messagesByDeal[d.id] || [];
    const last = messages.length ? messages[messages.length - 1] : null;
    return {
      deal_id: d.id,
      sku: d.sku,
      product_name: (d.quote && d.quote.product_name) || d.sku,
      quantity: d.quote ? d.quote.quantity : null,
      total: d.quote ? d.quote.total : null,
      status: d.status,
      counterparty_name: user.role === "buyer" ? (sellerNames[d.seller_id] || "Seller") : d.buyer_name,
      message_count: messages.length,
      last_message: last,
    };
  });

  conversations.sort((a, b) => {
    const ta = a.last_message ? new Date(a.last_message.at).getTime() : 0;
    const tb = b.last_message ? new Date(b.last_message.at).getTime() : 0;
    return tb - ta;
  });
  return conversations;
}

module.exports = {
  createUser,
  findUserByUsername,
  findUserByIdentifier,
  findUserById,
  verifyPassword,
  updateUserPassword,
  toPublicUser,
  createPasswordResetToken,
  consumePasswordResetToken,
  createOtpCode,
  verifyOtpCode,
  markUserVerified,
  addProduct,
  updateProduct,
  findProductById,
  addStockNotification,
  getStockWaitCountsForSeller,
  getBuyerBackInStock,
  markBuyerNotificationsSeen,
  getProductsForSeller,
  getAllProductsForBuyers,
  getSellerRules,
  updateSellerRules,
  getSellerDescription,
  updateSellerDescription,
  nextInvoiceNumber,
  createDeal,
  getDeal,
  listDeals,
  updateDeal,
  confirmDealAndDeductStock,
  markDealPaid,
  sendPaymentReminder,
  acknowledgeDeal,
  appendHistory,
  getSellerTrustStats,
  addDealMessage,
  getDealMessages,
  getConversationsForUser,
  logAuditEvent,
  getAuditLogForSeller,
  getLedgerForSeller,
  getRevenueStatsForSeller,
  getDealIntelligenceForSeller,
};
