require("dotenv").config();

const express = require("express");
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const path = require("path");
const db = require("./db");
const { seedDemoData, seedDemoDeals } = require("./seed");

const { createQuote } = require("./routes/quote");
const { negotiate } = require("./routes/negotiate");
const { sellerChat, buyerChat } = require("./routes/assistant");
const {
  listDeals,
  getDeal,
  updateStatus,
  getInvoice,
  getCatalogAndRules,
  updateSetup,
  addProduct,
  generateShopDescription,
  listAllProducts,
  acknowledgeDeal,
  getDealMessages,
  postDealMessage,
  getConversations,
  markPaid,
  sendReminder,
  getLedger,
  getRevenue,
  getDealIntelligence,
  getAuditLog,
  subscribeStock,
  getMyNotifications,
  dismissMyNotifications,
} = require("./routes/deals");
const {
  signup,
  verifyOtp,
  resendOtp,
  login,
  logout,
  me,
  forgotPassword,
  resetPassword,
  changePassword,
  requireAuth,
  requireRole,
} = require("./routes/auth");

const app = express();
app.use(express.json());
app.use(
  session({
    // Sessions live in Postgres (not server memory) so a page refresh — or
    // even a server restart / redeploy — keeps the user logged in. The table
    // is created automatically on first use.
    store: new pgSession({
      pool: db.getPool(),
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || "negotiai-dev-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  })
);

// Auth routes
app.post("/api/auth/signup", signup);
app.post("/api/auth/verify-otp", verifyOtp);
app.post("/api/auth/resend-otp", resendOtp);
app.post("/api/auth/login", login);
app.post("/api/auth/logout", logout);
app.get("/api/auth/me", me);
app.post("/api/auth/forgot-password", forgotPassword);
app.post("/api/auth/reset-password", resetPassword);
app.post("/api/auth/change-password", requireAuth, changePassword);

// Marketplace / deals
app.get("/api/products", requireRole("buyer"), listAllProducts);
app.post("/api/quote", requireRole("buyer"), createQuote);
app.post("/api/negotiate", requireRole("buyer"), negotiate);
app.get("/api/deals", requireAuth, listDeals);
app.get("/api/deals/:id", requireAuth, getDeal);
app.patch("/api/deals/:id/status", requireRole("seller"), updateStatus);
app.get("/api/deals/:id/invoice", requireAuth, getInvoice);
app.post("/api/deals/:id/acknowledge", requireRole("seller"), acknowledgeDeal);
app.post("/api/deals/:id/mark-paid", requireRole("seller"), markPaid);
app.post("/api/deals/:id/send-reminder", requireRole("seller"), sendReminder);
app.get("/api/ledger", requireRole("seller"), getLedger);
app.get("/api/revenue", requireRole("seller"), getRevenue);
app.get("/api/deal-intelligence", requireRole("seller"), getDealIntelligence);
app.get("/api/audit-log", requireRole("seller"), getAuditLog);
app.get("/api/deals/:id/messages", requireAuth, getDealMessages);
app.post("/api/deals/:id/messages", requireAuth, postDealMessage);
app.get("/api/conversations", requireAuth, getConversations);
app.post("/api/stock-notify", requireRole("buyer"), subscribeStock);
app.get("/api/my-notifications", requireRole("buyer"), getMyNotifications);
app.post("/api/my-notifications/seen", requireRole("buyer"), dismissMyNotifications);

// Seller's own catalog
app.get("/api/setup", requireRole("seller"), getCatalogAndRules);
app.post("/api/setup", requireRole("seller"), updateSetup);
app.post("/api/products", requireRole("seller"), addProduct);
app.post("/api/setup/generate-description", requireRole("seller"), generateShopDescription);

// AI help assistants
app.post("/api/assistant/seller", requireRole("seller"), sellerChat);
app.post("/api/assistant/buyer", requireRole("buyer"), buyerChat);

// Serve the frontend (precompiled by build.js — see README)
app.use(express.static(path.join(__dirname, "..", "public")));

const PROVIDER_KEY_ENV = {
  xai: "XAI_API_KEY",
  groq: "GROQ_API_KEY",
  gemini: "GEMINI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
};

const PORT = process.env.PORT || 3000;

async function start() {
  if (!process.env.DATABASE_URL) {
    console.error(
      "ERROR: DATABASE_URL is not set. NegotiAI needs a Postgres connection string " +
        "to store accounts, products, and deals. Set DATABASE_URL in your .env file " +
        "(see .env.example) and restart."
    );
    process.exit(1);
  }

  try {
    await db.initSchema();
    console.log("Database schema ready.");
  } catch (err) {
    console.error("Failed to initialize database schema:", err.message);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`NegotiAI running on http://localhost:${PORT}`);

    // Seed demo data in the BACKGROUND after the port is already bound —
    // it's a long series of writes to a remote DB, and blocking startup on
    // it would delay the server binding its port (and can fail a platform
    // health check on the first deploy). It's idempotent, so it's a one-time
    // cost on a fresh database and a fast no-op on every boot after.
    seedDemoData()
      .then(seedDemoDeals)
      .then(() => console.log("Demo data ready."))
      .catch((err) => console.warn("Warning: demo data seeding failed:", err.message));

    const primary = process.env.PRIMARY_PROVIDER || "xai";
    const backups = (process.env.BACKUP_PROVIDERS || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const chain = [primary, ...backups];

    console.log(`Provider chain: ${chain.join(" -> ")}`);

    for (const provider of chain) {
      const envKey = PROVIDER_KEY_ENV[provider];
      if (!envKey) {
        console.warn(`Warning: "${provider}" is not a recognized provider.`);
        continue;
      }
      if (!process.env[envKey]) {
        console.warn(`Warning: ${envKey} is not set — ${provider} will be skipped at request time.`);
      }
    }

    if (chain.every((p) => !process.env[PROVIDER_KEY_ENV[p]])) {
      console.warn("Warning: no provider in the chain has an API key set — negotiation calls will fail.");
    }
  });
}

// Surface unhandled background-seed errors instead of crashing the process.
process.on("unhandledRejection", (err) => {
  console.warn("Unhandled rejection:", err && err.message ? err.message : err);
});

start();
