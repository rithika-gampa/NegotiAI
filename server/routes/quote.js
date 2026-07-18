const store = require("../store");

function computeBulkDiscount(quantity, rules) {
  let discount = 0;
  for (const tier of rules.bulk_discount_tiers) {
    if (quantity >= tier.min_qty) discount = Math.max(discount, tier.extra_discount);
  }
  return discount;
}

// Explains why the quote came out the way it did, so the buyer isn't just
// handed a number — this is the reasoning shown under the very first message,
// same as every negotiation counter gets one.
function explainBulkDiscount(quantity, discount_percent, rules) {
  if (discount_percent === 0) {
    const tiers = [...rules.bulk_discount_tiers].sort((a, b) => a.min_qty - b.min_qty);
    const next = tiers.find((t) => t.min_qty > quantity);
    return next
      ? `No bulk discount tier applies yet at ${quantity} units — the next tier unlocks ${next.extra_discount}% off at ${next.min_qty}+ units.`
      : `Base price applies at ${quantity} units — no bulk discount tier is configured for this quantity.`;
  }
  const tier = [...rules.bulk_discount_tiers]
    .sort((a, b) => b.min_qty - a.min_qty)
    .find((t) => quantity >= t.min_qty);
  return `A ${discount_percent}% bulk discount applies because ${quantity} units meets the ${tier.min_qty}+ unit tier.`;
}

// POST /api/quote
// body: { product_id, quantity, delivery_date? }
// buyer identity comes from req.user (set by requireRole("buyer") middleware),
// never from the request body — prevents a buyer from spoofing another
// company's name on their orders. The product's seller_id determines whose
// negotiation rules apply and who the deal belongs to.
async function createQuote(req, res) {
  try {
    const { product_id, quantity, delivery_date } = req.body;

    if (!product_id || !quantity || quantity <= 0) {
      return res.status(400).json({ error: "product_id and a positive quantity are required" });
    }

    const product = await store.findProductById(product_id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    if (product.stock < quantity) {
      return res.status(409).json({ error: `Not enough stock. Available: ${product.stock}` });
    }

    const rules = await store.getSellerRules(product.seller_id);
    const discount_percent = computeBulkDiscount(quantity, rules);
    const unit_price = +(product.base_price * (1 - discount_percent / 100)).toFixed(2);
    const total = +(unit_price * quantity).toFixed(2);

    const quote = {
      sku: product.sku,
      product_name: product.name,
      unit_price,
      base_price: product.base_price,
      quantity,
      discount_percent,
      total,
    };

    const deal = await store.createDeal({
      product_id,
      sku: product.sku,
      seller_id: product.seller_id,
      quantity,
      delivery_date,
      buyer_name: req.user.name,
      buyer_user_id: req.user.id,
      initialQuote: quote,
    });
    await store.appendHistory(deal.id, {
      role: "agent",
      message: `Here's your quote for ${quantity}x ${product.name}: ₹${unit_price}/unit (${discount_percent}% bulk discount applied), total ₹${total.toLocaleString("en-IN")}.`,
      reasoning: explainBulkDiscount(quantity, discount_percent, rules),
      quote,
    });

    res.json({ deal_id: deal.id, quote, status: deal.status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate quote" });
  }
}

module.exports = { createQuote };
