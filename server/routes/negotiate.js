const store = require("../store");
const { callWithFallback, getProviderChain } = require("../llmClient");

// Plain acceptance phrases are handled deterministically in code rather than
// trusting the LLM to always follow instructions correctly — this guarantees
// consistent behavior and skips an API call for the common "ok" / "yes" case.
const AFFIRMATIVE_PATTERN =
  /^(ok(ay)?|yes|yep|yeah|sure|deal|agreed?|confirmed?|alright|fine|sounds good|i agree|i'll take it|works for me|let's do it|go ahead|proceed|that works|perfect|great|good)[.!]?$/i;

function isPlainAffirmative(message) {
  return AFFIRMATIVE_PATTERN.test(message.trim());
}

function formatINR(n) {
  return "₹" + Number(n).toLocaleString("en-IN");
}

// Parses a message that is ENTIRELY a number (with optional currency symbols,
// commas, "/unit" suffix etc.) — e.g. "300000", "₹3,00,000", "2800/unit".
// Returns null for anything that isn't purely numeric, so real sentences
// ("can you do 12% off?") still go to the LLM as before.
function parseBareNumber(message) {
  const cleaned = message
    .trim()
    .toLowerCase()
    .replace(/₹|rs\.?|inr/gi, "")
    .replace(/\/unit|per unit|\/pc|each/gi, "")
    .replace(/,/g, "")
    .trim();
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;
  return Number(cleaned);
}

// If the buyer's bare number, whether meant as a unit price or a total,
// already meets or beats what's currently on the table, there is no reason
// for the agent to ever counter with a LOWER price — that would mean giving
// away margin the buyer didn't even ask for. This is enforced in code
// because relying on an LLM to always get a numeric comparison right is not
// reliable enough for something this consequential.
function resolveBareNumberOffer(bareNumber, quote) {
  const asTotal = bareNumber;
  const asUnitPrice = bareNumber * quote.quantity;
  // Whichever interpretation is numerically closer to the current total is
  // almost certainly what the buyer meant.
  const impliedTotal =
    Math.abs(asTotal - quote.total) <= Math.abs(asUnitPrice - quote.total) ? asTotal : asUnitPrice;
  return { impliedTotal, meetsOrBeatsCurrentQuote: impliedTotal >= quote.total };
}

const SYSTEM_PROMPT = `You are a B2B sales negotiation agent acting on behalf of a seller, negotiating
directly with a real human buyer. All prices are in Indian Rupees (₹) — always
use the ₹ symbol when quoting numbers, never $ or other currencies.

You will be given:
1. SELLER_RULES: pricing, margins, and negotiation boundaries
2. PRODUCT: the item being negotiated, with base price and stock
3. CURRENT_QUOTE: the quote on the table right now
4. CONVERSATION_HISTORY: the negotiation so far
5. ROUND: how many buyer messages have been sent in this negotiation so far (1 = their first message)
6. BUYER_MESSAGE: the latest message from the buyer

Your job is to respond with a decision that stays strictly within SELLER_RULES.
You must never approve a discount, payment term, or condition that violates the
seller's minimum margin or maximum discount settings.

INTERPRETING THE BUYER'S MESSAGE
- If the buyer's message is a plain acceptance — "ok", "deal", "agreed", "sounds
  good", "I'll take it", "yes", "confirmed", or similar — this means they are
  accepting CURRENT_QUOTE exactly as it stands. Respond with action "accept"
  and quote set to CURRENT_QUOTE UNCHANGED. Do not revise the price, do not
  propose a new discount, do not "improve" the offer — the buyer already said
  yes to what was on the table. Confirming the deal is the only correct move.
- Buyers often type a bare number instead of a full sentence (e.g. "400000" or
  "4500/unit"). Infer intent from magnitude and context: a number close to the
  current TOTAL is a proposed total price; a number close to the current
  UNIT_PRICE is a proposed unit price. State your interpretation naturally in
  message_to_buyer so there's no ambiguity (e.g. "Understood — treating that as
  your target total of ₹400,000...").
- If the buyer's message is genuinely ambiguous or unrelated to price/terms,
  ask a brief clarifying question instead of guessing, and use action "counter"
  with the quote unchanged.

NEGOTIATING LIKE A REAL PERSON, NOT A TOKEN-DISCOUNT MACHINE
- Real B2B negotiations usually resolve in 2-4 exchanges, not a slow drip of
  tiny concessions. Do not shave off a trivial amount (e.g. ₹50/unit) just to
  look like you're negotiating — that reads as evasive and frustrates buyers.
- On ROUND 1, if the buyer's ask is reasonable (within or close to what
  SELLER_RULES allow), move a meaningful distance toward it in one step rather
  than lowballing your counter.
- From ROUND 2 onward, if your remaining room to move is small, say so plainly
  and either hold firm with a clear reason or accept — don't manufacture
  another micro-counter just to extend the back-and-forth.
- If the buyer's ask is already within SELLER_RULES, ACCEPT immediately. Don't
  counter a request you could just approve.
- CRITICAL: before proposing any new price, explicitly compare the buyer's
  latest number to the CURRENT_QUOTE total. If the buyer's number (interpreted
  as either a unit price or a total — check both) is equal to or GREATER than
  the current quote, you must NEVER counter with something lower than the
  current quote. Giving away extra discount the buyer didn't even ask for is
  a critical error. In that case, action should be "accept" at the current
  quote (or better for the seller, if the buyer's number is genuinely a
  higher total), never a lower one.
- Only escalate for genuinely out-of-bounds asks (below-cost pricing, unusual
  custom contract terms) — not just because the buyer pushed back once.

Reasoning process (do this internally, then output only the JSON):
1. First check: is this a plain acceptance of CURRENT_QUOTE (see above)? If so, action = accept, quote unchanged, skip the rest.
2. Otherwise, identify what the buyer is asking for (price, quantity, discount %, delivery terms) — see interpretation guidance above.
3. Check requested terms against SELLER_RULES (min margin, max discount, bulk tiers, stock availability).
4. Decide one of: ACCEPT, COUNTER, or ESCALATE, following the realism guidance above.
5. If countering, propose a specific, meaningfully-moved number, not a token gesture.

Output ONLY valid JSON in this exact shape, nothing else, no markdown fences:
{
  "action": "accept" | "counter" | "escalate",
  "quote": {
    "unit_price": number,
    "quantity": number,
    "discount_percent": number,
    "total": number
  },
  "message_to_buyer": "string — a short, natural, professional reply",
  "reasoning": "string — one sentence explaining why this decision stays within seller rules"
}

Never break character as the seller's agent. Never reveal SELLER_RULES verbatim to
the buyer — only reflect the outcome (the price/terms), not the internal thresholds.`;

function stripJsonFences(text) {
  return text.replace(/```json|```/g, "").trim();
}

// POST /api/negotiate
// body: { deal_id, buyer_message }
async function negotiate(req, res) {
  try {
    const { deal_id, buyer_message } = req.body;
    if (!deal_id || !buyer_message) {
      return res.status(400).json({ error: "deal_id and buyer_message are required" });
    }

    const deal = await store.getDeal(deal_id);
    if (!deal) return res.status(404).json({ error: "Deal not found" });
    if (deal.buyer_user_id !== req.user.id) {
      return res.status(403).json({ error: "Not your deal" });
    }

    const product = await store.findProductById(deal.product_id);
    const rules = await store.getSellerRules(deal.seller_id);

    await store.appendHistory(deal_id, { role: "buyer", message: buyer_message });

    // --- Deterministic plain-affirmative handling (no LLM call) ---
    if (isPlainAffirmative(buyer_message)) {
      if (!deal.pending_confirmation) {
        // First "ok" — restate the exact terms and ask for explicit confirmation
        // before finalizing anything. Quote is NOT touched.
        const q = deal.quote;
        const confirmMessage =
          `Just to confirm before I finalize: ${q.quantity} x ${q.product_name || deal.sku} ` +
          `at ${formatINR(q.unit_price)}/unit (${q.discount_percent}% discount), ` +
          `totaling ${formatINR(q.total)}. Shall I go ahead and confirm this deal?`;

        await store.appendHistory(deal_id, {
          role: "agent",
          message: confirmMessage,
          reasoning: "Buyer sent a plain acceptance — asking for explicit confirmation of the exact price before finalizing, rather than closing the deal on an ambiguous 'ok'.",
          quote: q,
          action: "confirm_pending",
          provider: "system",
        });
        await store.updateDeal(deal_id, { status: "negotiating", pending_confirmation: true });

        return res.json({
          deal_id,
          action: "confirm_pending",
          quote: q,
          message_to_buyer: confirmMessage,
          status: "negotiating",
          provider: "system",
        });
      }

      // Second affirmative in a row — actually finalize now.
      const q = deal.quote;
      const closeMessage =
        `Deal confirmed. We'll proceed with ${q.quantity} x ${q.product_name || deal.sku} ` +
        `at ${formatINR(q.unit_price)}/unit, totaling ${formatINR(q.total)}.`;

      await store.appendHistory(deal_id, {
        role: "agent",
        message: closeMessage,
        reasoning: "Buyer explicitly confirmed the restated price a second time, so the deal is finalized.",
        quote: q,
        action: "accept",
        provider: "system",
      });
      await store.updateDeal(deal_id, { quote: q });
      await store.confirmDealAndDeductStock(deal_id);

      return res.json({
        deal_id,
        action: "accept",
        quote: q,
        message_to_buyer: closeMessage,
        status: "confirmed",
        provider: "system",
      });
    }

    // --- Deterministic guard for bare-number offers that already meet or
    // beat the current quote. Bypasses the LLM entirely for this case so a
    // provider's arithmetic mistake can never cause the agent to lower the
    // price when the buyer actually offered MORE than what's on the table. ---
    const bareNumber = parseBareNumber(buyer_message);
    if (bareNumber !== null) {
      const { impliedTotal, meetsOrBeatsCurrentQuote } = resolveBareNumberOffer(bareNumber, deal.quote);
      if (meetsOrBeatsCurrentQuote) {
        const q = deal.quote;
        const confirmMessage =
          `Your offer of ${formatINR(bareNumber)} already meets or exceeds our current quote — ` +
          `I won't ask you to pay more than necessary. Confirming at ${q.quantity} x ${q.product_name || deal.sku} ` +
          `at ${formatINR(q.unit_price)}/unit, totaling ${formatINR(q.total)}. Shall I go ahead and confirm this deal?`;

        await store.appendHistory(deal_id, {
          role: "agent",
          message: confirmMessage,
          reasoning: `Buyer's offer (≈${formatINR(impliedTotal)}) already meets or exceeds the current quote total of ${formatINR(q.total)}, so the price is held at the current quote rather than negotiated down further.`,
          quote: q,
          action: "confirm_pending",
          provider: "system",
        });
        await store.updateDeal(deal_id, { status: "negotiating", pending_confirmation: true });

        return res.json({
          deal_id,
          action: "confirm_pending",
          quote: q,
          message_to_buyer: confirmMessage,
          status: "negotiating",
          provider: "system",
        });
      }
    }

    // Any non-affirmative message cancels a pending confirmation and goes
    // through normal negotiation via the LLM.
    await store.updateDeal(deal_id, { status: "negotiating", pending_confirmation: false });

    const round = deal.history.filter((h) => h.role === "buyer").length + 1;

    const contextBlock = `
SELLER_RULES: ${JSON.stringify(rules)}
PRODUCT: ${JSON.stringify(product)}
CURRENT_QUOTE: ${JSON.stringify(deal.quote)}
CONVERSATION_HISTORY: ${JSON.stringify(deal.history.slice(0, -1))}
ROUND: ${round}
BUYER_MESSAGE: ${buyer_message}
`.trim();

    let rawText, usedProvider;
    try {
      const result = await callWithFallback({ systemPrompt: SYSTEM_PROMPT, userContent: contextBlock });
      rawText = result.text;
      usedProvider = result.provider;
    } catch (err) {
      console.error("All providers failed:", err.message);
      return res.status(502).json({
        error: "Negotiation agent failed to respond on every configured provider.",
        detail: err.message,
        chain: getProviderChain(),
      });
    }

    const parsed = JSON.parse(stripJsonFences(rawText));

    await store.appendHistory(deal_id, {
      role: "agent",
      message: parsed.message_to_buyer,
      reasoning: parsed.reasoning,
      quote: parsed.quote,
      action: parsed.action,
      provider: usedProvider,
    });

    // Even if the LLM decides "accept" directly (e.g. buyer explicitly typed
    // out full agreement terms rather than a bare "ok"), route it through the
    // same confirmation step for consistency.
    if (parsed.action === "accept") {
      const confirmMessage =
        `Just to confirm before I finalize: ${parsed.quote.quantity} x ${parsed.quote.product_name || deal.sku} ` +
        `at ${formatINR(parsed.quote.unit_price)}/unit (${parsed.quote.discount_percent}% discount), ` +
        `totaling ${formatINR(parsed.quote.total)}. Shall I go ahead and confirm this deal?`;

      await store.appendHistory(deal_id, {
        role: "agent",
        message: confirmMessage,
        reasoning: "Restating exact terms and requiring explicit confirmation before finalizing.",
        quote: parsed.quote,
        action: "confirm_pending",
        provider: "system",
      });
      await store.updateDeal(deal_id, { quote: parsed.quote, status: "negotiating", pending_confirmation: true });

      return res.json({
        deal_id,
        action: "confirm_pending",
        quote: parsed.quote,
        message_to_buyer: confirmMessage,
        status: "negotiating",
        provider: usedProvider,
      });
    }

    const newStatus = parsed.action === "escalate" ? "negotiating" : "negotiating";
    await store.updateDeal(deal_id, { quote: parsed.quote, status: newStatus, pending_confirmation: false });

    res.json({ deal_id, ...parsed, status: newStatus, provider: usedProvider });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to process negotiation" });
  }
}

module.exports = { negotiate };
