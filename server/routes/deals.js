const store = require("../store");

async function listDeals(req, res) {
  try {
    const all = await store.listDeals();
    const deals =
      req.user.role === "buyer"
        ? all.filter((d) => d.buyer_user_id === req.user.id)
        : all.filter((d) => d.seller_id === req.user.id);
    res.json({ deals });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load deals" });
  }
}

async function getDeal(req, res) {
  try {
    const deal = await store.getDeal(req.params.id);
    if (!deal) return res.status(404).json({ error: "Deal not found" });
    if (req.user.role === "buyer" && deal.buyer_user_id !== req.user.id) {
      return res.status(403).json({ error: "Not your deal" });
    }
    if (req.user.role === "seller" && deal.seller_id !== req.user.id) {
      return res.status(403).json({ error: "Not your deal" });
    }
    res.json({ deal });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load deal" });
  }
}

// PATCH /api/deals/:id/status  { status }
async function updateStatus(req, res) {
  try {
    const { status } = req.body;
    const allowed = ["quote_sent", "negotiating", "confirmed", "invoiced"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `status must be one of ${allowed.join(", ")}` });
    }

    const existing = await store.getDeal(req.params.id);
    if (!existing) return res.status(404).json({ error: "Deal not found" });
    if (existing.seller_id !== req.user.id) {
      return res.status(403).json({ error: "Not your deal" });
    }

    const updates = { status };
    if (status === "invoiced" && !existing.invoice_number) {
      updates.invoice_number = store.nextInvoiceNumber();
      updates.invoiced_at = new Date().toISOString();
    }

    const deal = await store.updateDeal(req.params.id, updates);
    if (status === "invoiced") {
      await store.logAuditEvent(deal.id, deal.seller_id, "invoiced", `Invoice ${deal.invoice_number} generated for ₹${deal.quote.total}`, "seller");
    }
    res.json({ deal });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update deal status" });
  }
}

// GET /api/deals/:id/invoice
async function getInvoice(req, res) {
  try {
    const deal = await store.getDeal(req.params.id);
    if (!deal) return res.status(404).json({ error: "Deal not found" });
    if (req.user.role === "buyer" && deal.buyer_user_id !== req.user.id) {
      return res.status(403).json({ error: "Not your deal" });
    }
    if (req.user.role === "seller" && deal.seller_id !== req.user.id) {
      return res.status(403).json({ error: "Not your deal" });
    }
    if (deal.status !== "invoiced") {
      return res.status(400).json({ error: "Deal is not invoiced yet" });
    }
    res.json({
      invoice: {
        invoice_number: deal.invoice_number,
        invoiced_at: deal.invoiced_at,
        buyer_name: deal.buyer_name,
        line_items: [
          {
            description: deal.quote.product_name || deal.sku,
            sku: deal.sku,
            quantity: deal.quote.quantity,
            original_unit_price: deal.quote.base_price,
            original_total: +(deal.quote.base_price * deal.quote.quantity).toFixed(2),
            unit_price: deal.quote.unit_price,
            discount_percent: deal.quote.discount_percent,
            total: deal.quote.total,
          },
        ],
        total_savings: +((deal.quote.base_price * deal.quote.quantity) - deal.quote.total).toFixed(2),
        total: deal.quote.total,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load invoice" });
  }
}

// --- Seller's own catalog management ---

// GET /api/setup — the logged-in seller's own products + rules
async function getCatalogAndRules(req, res) {
  try {
    res.json({
      catalog: await store.getProductsForSeller(req.user.id),
      rules: await store.getSellerRules(req.user.id),
      shop_description: await store.getSellerDescription(req.user.id),
      wait_counts: await store.getStockWaitCountsForSeller(req.user.id),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load seller setup" });
  }
}

// POST /api/stock-notify  { product_id } — buyer joins an out-of-stock waitlist
async function subscribeStock(req, res) {
  try {
    const { product_id } = req.body;
    if (!product_id) return res.status(400).json({ error: "product_id is required" });
    const product = await store.findProductById(product_id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    const result = await store.addStockNotification(product, req.user);
    res.json({ ok: true, already: result.already });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to subscribe" });
  }
}

// GET /api/my-notifications — buyer's back-in-stock alerts
async function getMyNotifications(req, res) {
  try {
    const notifications = await store.getBuyerBackInStock(req.user.id);
    res.json({ notifications });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load notifications" });
  }
}

// POST /api/my-notifications/seen — dismiss back-in-stock alerts
async function dismissMyNotifications(req, res) {
  try {
    await store.markBuyerNotificationsSeen(req.user.id);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update notifications" });
  }
}

// POST /api/setup  { rules?, catalog?, shop_description? } — edits existing
// products (price/stock), rules, and the marketplace shop description
async function updateSetup(req, res) {
  try {
    const { catalog, shop_description, ...rulesUpdate } = req.body;
    if (catalog) {
      for (const p of catalog) {
        if (p.id) await store.updateProduct(req.user.id, p.id, { base_price: p.base_price, stock: p.stock });
      }
    }
    if (typeof shop_description === "string") {
      await store.updateSellerDescription(req.user.id, shop_description.trim());
    }
    if (Object.keys(rulesUpdate).length) await store.updateSellerRules(req.user.id, rulesUpdate);
    res.json({
      catalog: await store.getProductsForSeller(req.user.id),
      rules: await store.getSellerRules(req.user.id),
      shop_description: await store.getSellerDescription(req.user.id),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save setup" });
  }
}

// POST /api/products — add a brand-new product to the seller's own catalog
async function addProduct(req, res) {
  try {
    const { sku, name, base_price, stock } = req.body;
    if (!name || base_price === undefined || stock === undefined) {
      return res.status(400).json({ error: "name, base_price, and stock are required" });
    }
    const product = await store.addProduct(req.user.id, { sku, name, base_price, stock });
    res.json({ product, catalog: await store.getProductsForSeller(req.user.id) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add product" });
  }
}

// GET /api/products — full cross-seller marketplace listing, for buyers to browse
async function listAllProducts(req, res) {
  try {
    res.json({ products: await store.getAllProductsForBuyers() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load products" });
  }
}

// POST /api/deals/:id/acknowledge — seller marks a new order as seen,
// clearing the "new order" notification for it.
async function acknowledgeDeal(req, res) {
  try {
    const existing = await store.getDeal(req.params.id);
    if (!existing) return res.status(404).json({ error: "Deal not found" });
    if (existing.seller_id !== req.user.id) {
      return res.status(403).json({ error: "Not your deal" });
    }
    const deal = await store.acknowledgeDeal(req.params.id);
    res.json({ deal });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to acknowledge deal" });
  }
}

// GET /api/deals/:id/messages — direct human messages, separate from the AI
// negotiation thread. Either party on the deal can read them.
async function getDealMessages(req, res) {
  try {
    const deal = await store.getDeal(req.params.id);
    if (!deal) return res.status(404).json({ error: "Deal not found" });
    if (req.user.role === "buyer" && deal.buyer_user_id !== req.user.id) {
      return res.status(403).json({ error: "Not your deal" });
    }
    if (req.user.role === "seller" && deal.seller_id !== req.user.id) {
      return res.status(403).json({ error: "Not your deal" });
    }
    const messages = await store.getDealMessages(req.params.id);
    res.json({ messages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load messages" });
  }
}

// POST /api/deals/:id/messages  { message }
async function postDealMessage(req, res) {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: "message is required" });
    }
    const deal = await store.getDeal(req.params.id);
    if (!deal) return res.status(404).json({ error: "Deal not found" });
    if (req.user.role === "buyer" && deal.buyer_user_id !== req.user.id) {
      return res.status(403).json({ error: "Not your deal" });
    }
    if (req.user.role === "seller" && deal.seller_id !== req.user.id) {
      return res.status(403).json({ error: "Not your deal" });
    }
    const saved = await store.addDealMessage(req.params.id, req.user.role, message.trim());
    res.json({ message: saved });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send message" });
  }
}

// GET /api/conversations — one entry per deal the user is on, with the
// counterparty name and latest direct message, for the Messages inbox.
async function getConversations(req, res) {
  try {
    const conversations = await store.getConversationsForUser(req.user);
    res.json({ conversations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load conversations" });
  }
}

// POST /api/deals/:id/mark-paid — seller marks an invoiced deal as paid
async function markPaid(req, res) {
  try {
    const existing = await store.getDeal(req.params.id);
    if (!existing) return res.status(404).json({ error: "Deal not found" });
    if (existing.seller_id !== req.user.id) {
      return res.status(403).json({ error: "Not your deal" });
    }
    if (existing.status !== "invoiced") {
      return res.status(400).json({ error: "Only invoiced deals can be marked as paid" });
    }
    const deal = await store.markDealPaid(req.params.id);
    res.json({ deal });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to mark as paid" });
  }
}

// POST /api/deals/:id/send-reminder — automated payment reminder
async function sendReminder(req, res) {
  try {
    const existing = await store.getDeal(req.params.id);
    if (!existing) return res.status(404).json({ error: "Deal not found" });
    if (existing.seller_id !== req.user.id) {
      return res.status(403).json({ error: "Not your deal" });
    }
    if (existing.status !== "invoiced" || existing.payment_status === "paid") {
      return res.status(400).json({ error: "Reminders can only be sent for unpaid invoiced deals" });
    }
    const message = await store.sendPaymentReminder(req.params.id);
    res.json({ message });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send reminder" });
  }
}

// GET /api/ledger — per-buyer dues/paid/outstanding for the logged-in seller
async function getLedger(req, res) {
  try {
    const ledger = await store.getLedgerForSeller(req.user.id);
    res.json({ ledger });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load ledger" });
  }
}

// GET /api/revenue — revenue/pipeline/dues summary for the logged-in seller
async function getRevenue(req, res) {
  try {
    const stats = await store.getRevenueStatsForSeller(req.user.id);
    res.json({ stats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load revenue stats" });
  }
}

// GET /api/deal-intelligence — AI-negotiation performance analytics
async function getDealIntelligence(req, res) {
  try {
    const stats = await store.getDealIntelligenceForSeller(req.user.id);
    res.json({ stats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load deal intelligence" });
  }
}

// GET /api/audit-log — compliance audit trail for the logged-in seller
async function getAuditLog(req, res) {
  try {
    const entries = await store.getAuditLogForSeller(req.user.id);
    res.json({ entries });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load audit log" });
  }
}

module.exports = {
  listDeals,
  getDeal,
  updateStatus,
  getInvoice,
  getCatalogAndRules,
  updateSetup,
  addProduct,
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
};
