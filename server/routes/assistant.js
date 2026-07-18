const store = require("../store");
const { callWithFallback } = require("../llmClient");

// Both assistants share one small transcript format so a short back-and-forth
// stays coherent without needing per-message system-prompt rebuilding.
function formatHistory(history) {
  if (!Array.isArray(history) || history.length === 0) return "";
  return (
    "\n\nRECENT CONVERSATION:\n" +
    history
      .slice(-6)
      .map((h) => `${h.role === "user" ? "User" : "Assistant"}: ${h.text}`)
      .join("\n")
  );
}

const SELLER_SYSTEM_PROMPT = `You are an embedded analyst helping a seller understand their own NegotiAI
dashboard — their negotiation performance, pricing rules, revenue, ledger,
audit trail, and deal pipeline. You will be given their real SELLER_DATA as
JSON, covering AI Insights (deal_intelligence), Finance (revenue, ledger —
per-buyer invoiced/paid/outstanding totals), and the Audit Log (recent
lifecycle events plus counts by event type). Answer questions using only that
data; if something isn't in it, say so plainly instead of guessing or making
up a number. Keep answers short (2-4 sentences), concrete, and actionable —
e.g. flag which buyer has the most outstanding dues, or which event type
dominates the audit trail, when it's obviously useful. Don't pad with generic
advice. You can also explain how a NegotiAI feature works (Pipeline, AI
Insights, Finance, Audit Log) if asked. Never reveal or reference other
sellers' data. Output plain text, no markdown headers, no JSON.`;

const BUYER_SYSTEM_PROMPT = `You are the NegotiAI help assistant, answering a buyer's questions about how
to use the marketplace: requesting quotes, negotiating with a seller's AI
agent in plain language, confirming a deal, viewing invoices, and messaging
sellers directly. You will be given a short summary of the buyer's own
BUYER_DATA (their deals) as JSON — use it to give specific, personalized
answers when relevant (e.g. "you have 2 deals in negotiation right now"), but
don't fabricate figures beyond what's given. Keep answers short (2-4
sentences), friendly, and direct. Output plain text, no markdown headers, no
JSON.`;

// POST /api/assistant/seller  { message, history? }
async function sellerChat(req, res) {
  try {
    const { message, history } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: "message is required" });
    }

    const sellerId = req.user.id;
    const [rules, stats, revenue, ledger, auditLog] = await Promise.all([
      store.getSellerRules(sellerId),
      store.getDealIntelligenceForSeller(sellerId),
      store.getRevenueStatsForSeller(sellerId),
      store.getLedgerForSeller(sellerId),
      store.getAuditLogForSeller(sellerId),
    ]);

    const auditByEventType = auditLog.reduce((acc, e) => {
      acc[e.event_type] = (acc[e.event_type] || 0) + 1;
      return acc;
    }, {});

    const sellerData = {
      rules,
      deal_intelligence: stats,
      finance: {
        revenue,
        ledger, // per-buyer invoiced/paid/outstanding totals
      },
      audit_log: {
        total_events: auditLog.length,
        counts_by_event_type: auditByEventType,
        recent_events: auditLog.slice(0, 15).map((e) => ({
          event_type: e.event_type,
          buyer_name: e.buyer_name,
          sku: e.sku,
          detail: e.detail,
          at: e.at,
        })),
      },
    };

    const contextBlock = `SELLER_DATA: ${JSON.stringify(sellerData)}${formatHistory(history)}\n\nQUESTION: ${message}`;

    const { text, provider } = await callWithFallback({
      systemPrompt: SELLER_SYSTEM_PROMPT,
      userContent: contextBlock,
    });

    res.json({ reply: text.trim(), provider });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: "The assistant couldn't respond right now. Try again in a moment." });
  }
}

// POST /api/assistant/buyer  { message, history? }
async function buyerChat(req, res) {
  try {
    const { message, history } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: "message is required" });
    }

    const all = await store.listDeals();
    const mine = all.filter((d) => d.buyer_user_id === req.user.id);
    const summary = {
      total_deals: mine.length,
      by_status: mine.reduce((acc, d) => {
        acc[d.status] = (acc[d.status] || 0) + 1;
        return acc;
      }, {}),
      total_saved: +mine
        .filter((d) => d.quote)
        .reduce((sum, d) => sum + (d.quote.base_price * d.quote.quantity - d.quote.total), 0)
        .toFixed(2),
    };

    const contextBlock = `BUYER_DATA: ${JSON.stringify(summary)}${formatHistory(history)}\n\nQUESTION: ${message}`;

    const { text, provider } = await callWithFallback({
      systemPrompt: BUYER_SYSTEM_PROMPT,
      userContent: contextBlock,
    });

    res.json({ reply: text.trim(), provider });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: "The assistant couldn't respond right now. Try again in a moment." });
  }
}

module.exports = { sellerChat, buyerChat };
