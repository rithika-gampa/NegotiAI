// Seeds a few themed demo sellers so the marketplace has realistic, varied
// storefronts to browse — stationery, grocery, electricals, and a
// restaurant/food-service supplier. Runs on every startup but is idempotent:
// a demo seller that already exists is left untouched.
//
// Also removes the old one-size-fits-all packaging starter products that
// every seller used to be auto-seeded with (they made every storefront look
// identical). Deals that referenced them keep rendering fine — a deal stores
// its own quote snapshot — only "reorder" on those old deals stops working.

const store = require("./store");
const db = require("./db");

const OLD_STARTER_SKUS = ["PKG-001", "PKG-002", "LBL-010", "PLT-004"];

const DEMO_PASSWORD = "demo123";

const DEMO_SELLERS = [
  {
    username: "saraswati_stationery",
    name: "Saraswati Stationery Co.",
    description: "Office stationery and school supplies in bulk — notebooks, pens, copier paper, and desk essentials.",
    products: [
      { sku: "STN-001", name: "Spiral Notebook A5 (pack of 12)", base_price: 480, stock: 5000, category: "Stationery" },
      { sku: "STN-002", name: "Ball Pen Blue (box of 50)", base_price: 350, stock: 8000, category: "Stationery" },
      { sku: "STN-003", name: "A4 Copier Paper (500 sheets)", base_price: 280, stock: 12000, category: "Stationery" },
      { sku: "STN-004", name: "Stapler + 1000 Pins Set", base_price: 220, stock: 3000, category: "Stationery" },
      { sku: "STN-005", name: "Whiteboard Marker (pack of 10)", base_price: 260, stock: 4000, category: "Stationery" },
    ],
  },
  {
    username: "greenbasket_grocery",
    name: "GreenBasket Wholesale Grocery",
    description: "Wholesale grocery staples for retailers and canteens — rice, oils, pulses, sugar, and tea.",
    products: [
      { sku: "GRC-001", name: "Basmati Rice (25 kg bag)", base_price: 2400, stock: 600, category: "Grocery" },
      { sku: "GRC-002", name: "Sunflower Oil (15 L tin)", base_price: 2100, stock: 450, category: "Grocery" },
      { sku: "GRC-003", name: "Toor Dal (10 kg pack)", base_price: 1250, stock: 900, category: "Grocery" },
      { sku: "GRC-004", name: "Sugar (50 kg sack)", base_price: 2050, stock: 300, category: "Grocery" },
      { sku: "GRC-005", name: "Assam CTC Tea (5 kg pack)", base_price: 1600, stock: 700, category: "Grocery" },
    ],
  },
  {
    username: "brightvolt_electricals",
    name: "BrightVolt Electricals",
    description: "Electrical goods and fittings — LED lighting, wiring, extension boards, and fans at trade prices.",
    products: [
      { sku: "ELC-001", name: "LED Bulb 9W (box of 20)", base_price: 1500, stock: 2500, category: "Electricals" },
      { sku: "ELC-002", name: "6-Socket Extension Board", base_price: 420, stock: 1800, category: "Electricals" },
      { sku: "ELC-003", name: "Copper Wire Coil (90 m)", base_price: 2800, stock: 650, category: "Electricals" },
      { sku: "ELC-004", name: "Ceiling Fan 1200 mm", base_price: 1450, stock: 400, category: "Electricals" },
    ],
  },
  {
    username: "tandoor_foodservice",
    name: "Tandoor Foodservice Supplies",
    description: "Bulk ingredients and food-service supplies for restaurants, canteens, and caterers — spices, dairy, frozen items, and packaging.",
    products: [
      { sku: "FDS-001", name: "Mixed Spice Masala (5 kg pack)", base_price: 1800, stock: 800, category: "Food & Catering" },
      { sku: "FDS-002", name: "Tomato Puree (catering tin, 3 kg)", base_price: 620, stock: 1200, category: "Food & Catering" },
      { sku: "FDS-003", name: "Paneer (bulk, 10 kg block)", base_price: 3400, stock: 350, category: "Food & Catering" },
      { sku: "FDS-004", name: "Frozen French Fries (10 kg carton)", base_price: 2100, stock: 500, category: "Food & Catering" },
      { sku: "FDS-005", name: "Disposable Takeaway Containers (pack of 500)", base_price: 950, stock: 2000, category: "Food & Catering" },
    ],
  },
  {
    username: "safepack_solutions",
    name: "SafePack Packaging Solutions",
    description: "Packaging materials in bulk — corrugated boxes, bubble wrap, tape, and pallets for shipping and storage.",
    products: [
      { sku: "SPK-001", name: "Corrugated Box, Large (pack of 50)", base_price: 1850, stock: 1500, category: "Packaging" },
      { sku: "SPK-002", name: "Bubble Wrap Roll (100 m)", base_price: 1200, stock: 900, category: "Packaging" },
      { sku: "SPK-003", name: "Industrial Stretch Film Roll", base_price: 680, stock: 1200, category: "Packaging" },
      { sku: "SPK-004", name: "Packing Tape (pack of 36 rolls)", base_price: 1450, stock: 800, category: "Packaging" },
      { sku: "SPK-005", name: "Wooden Pallet, Standard", base_price: 950, stock: 600, category: "Packaging" },
    ],
  },
  {
    username: "urbannest_furniture",
    name: "Urban Nest Office Furniture",
    description: "Office furniture in bulk — ergonomic chairs, desks, filing cabinets, and modular workstations for growing teams.",
    products: [
      { sku: "FUR-001", name: "Ergonomic Office Chair", base_price: 6500, stock: 250, category: "Furniture" },
      { sku: "FUR-002", name: "Work Desk (4x2 ft)", base_price: 4200, stock: 300, category: "Furniture" },
      { sku: "FUR-003", name: "Steel Filing Cabinet (4-drawer)", base_price: 8900, stock: 150, category: "Furniture" },
      { sku: "FUR-004", name: "Modular Workstation (2-seater)", base_price: 15500, stock: 80, category: "Furniture" },
      { sku: "FUR-005", name: "Visitor Chair (pack of 4)", base_price: 5200, stock: 200, category: "Furniture" },
    ],
  },
  {
    username: "vastra_textiles",
    name: "Vastra Textile Traders",
    description: "Bulk textiles and apparel — cotton fabric rolls, uniforms, and hotel-grade linens for retailers and institutions.",
    products: [
      { sku: "TXT-001", name: "Cotton Fabric Roll (100 m)", base_price: 9500, stock: 400, category: "Textiles" },
      { sku: "TXT-002", name: "School Uniform Set (pack of 20)", base_price: 7800, stock: 350, category: "Textiles" },
      { sku: "TXT-003", name: "Cotton T-Shirts, Bulk (pack of 50)", base_price: 6200, stock: 500, category: "Textiles" },
      { sku: "TXT-004", name: "Hotel-Grade Bedsheet Set (pack of 10)", base_price: 8400, stock: 300, category: "Textiles" },
      { sku: "TXT-005", name: "Curtain Fabric Roll (50 m)", base_price: 5600, stock: 250, category: "Textiles" },
    ],
  },
];

async function seedDemoData() {
  await db.query("DELETE FROM products WHERE sku = ANY($1)", [OLD_STARTER_SKUS]);

  for (const seller of DEMO_SELLERS) {
    let sellerUser = await store.findUserByUsername(seller.username);
    if (!sellerUser) {
      sellerUser = await store.createUser({
        username: seller.username,
        password: DEMO_PASSWORD,
        role: "seller",
        name: seller.name,
      });
      for (const p of seller.products) {
        await store.addProduct(sellerUser.id, p);
      }
      console.log(`Seeded demo seller: ${seller.name} (${seller.username})`);
    }

    // Backfill category on already-seeded products (covers demo data created
    // before the category column existed) — matched by SKU, safe to re-run.
    for (const p of seller.products) {
      await db.query("UPDATE products SET category = $1 WHERE seller_id = $2 AND sku = $3", [p.category, sellerUser.id, p.sku]);
    }

    // Fill in the shop description if it's empty — upgrades demo sellers
    // created before descriptions existed, without clobbering later edits.
    await db.query(
      `UPDATE users SET shop_description = $1
       WHERE username_lower = $2 AND (shop_description IS NULL OR shop_description = '')`,
      [seller.description, seller.username]
    );
    // Demo accounts are pre-verified so they skip the OTP step.
    await db.query("UPDATE users SET verified = true, verified_via = 'demo' WHERE username_lower = $1", [seller.username]);
  }
}

// Buyers used only to populate demo negotiation history, so the seller
// dashboards (AI Insights, Finance, Pipeline, Audit) look alive in a demo.
const DEMO_BUYERS = [
  { username: "horizon_traders_demo", name: "Horizon Traders" },
  { username: "meridian_retail_demo", name: "Meridian Retail Co." },
  { username: "cityline_wholesale_demo", name: "Cityline Wholesale" },
];

function round2(n) { return Math.round(n * 100) / 100; }

// Builds a realistic quote snapshot + a short negotiation transcript for a
// product at a given discount, so the analytics have real history to chew on.
function buildDeal(product, quantity, discountPct) {
  const unit = round2(product.base_price * (1 - discountPct / 100));
  const total = Math.round(unit * quantity);
  const quote = {
    product_name: product.name,
    base_price: product.base_price,
    unit_price: unit,
    discount_percent: discountPct,
    quantity,
    total,
  };
  const history = [];
  if (discountPct > 0) {
    history.push({ role: "buyer", message: `Can you do better than ₹${product.base_price}/unit if I take ${quantity}?`, at: new Date().toISOString() });
    history.push({
      role: "agent", action: "counter", provider: "demo",
      message: `At ${quantity} units I can offer ₹${unit}/unit — that's ${discountPct}% off, our best at this volume.`,
      reasoning: `Buyer volume qualifies for a bulk tier; ${discountPct}% stays within the seller's max-discount rule.`,
      quote, at: new Date().toISOString(),
    });
    history.push({ role: "buyer", message: "Deal, let's go ahead.", at: new Date().toISOString() });
  } else {
    history.push({ role: "buyer", message: "Is this your best price?", at: new Date().toISOString() });
    history.push({
      role: "agent", action: "accept", provider: "demo",
      message: `This is already sharp for ${quantity} units — I'd recommend locking it in.`,
      reasoning: "Requested terms are within seller rules; holding at list price protects margin.",
      quote, at: new Date().toISOString(),
    });
    history.push({ role: "buyer", message: "Okay, confirmed.", at: new Date().toISOString() });
  }
  return { quote, history };
}

// Per-seller demo deal specs: [productIndex, quantity, discount%, finalStatus, paid?]
const DEMO_DEAL_PLAN = [
  [0, 300, 6, "invoiced", true],
  [1, 500, 9, "invoiced", true],
  [2, 150, 3, "confirmed", false],
  [3, 800, 11, "invoiced", false],
  [1, 200, 0, "confirmed", false],
  [0, 1000, 10, "negotiating", false],
  [2, 400, 6, "invoiced", true],
];

async function seedDemoDeals() {
  // Ensure demo buyers exist.
  const buyers = [];
  for (const b of DEMO_BUYERS) {
    let u = await store.findUserByUsername(b.username);
    if (!u) u = await store.createUser({ username: b.username, password: DEMO_PASSWORD, role: "buyer", name: b.name });
    await db.query("UPDATE users SET verified = true, verified_via = 'demo' WHERE id = $1", [u.id]);
    buyers.push(u);
  }

  for (const seller of DEMO_SELLERS) {
    const sellerUser = await store.findUserByUsername(seller.username);
    if (!sellerUser) continue;
    const products = await store.getProductsForSeller(sellerUser.id);
    if (products.length < 4) continue;

    // Idempotent: only seed if this seller has no demo-buyer deals yet.
    const existing = await db.query(
      "SELECT COUNT(*) AS c FROM deals WHERE seller_id = $1 AND buyer_user_id = ANY($2)",
      [sellerUser.id, buyers.map((b) => b.id)]
    );
    if (Number(existing.rows[0].c) > 0) continue;

    for (let i = 0; i < DEMO_DEAL_PLAN.length; i++) {
      const [pIdx, qty, disc, finalStatus, paid] = DEMO_DEAL_PLAN[i];
      const product = products[pIdx % products.length];
      const buyer = buyers[i % buyers.length];
      const { quote, history } = buildDeal(product, qty, disc);

      const deal = await store.createDeal({
        product_id: product.id, sku: product.sku, quantity: qty,
        buyer_name: buyer.name, buyer_user_id: buyer.id, seller_id: sellerUser.id,
        initialQuote: quote,
      });
      for (const h of history) await store.appendHistory(deal.id, h);
      await store.updateDeal(deal.id, { seller_acknowledged: true });

      if (finalStatus === "negotiating") {
        await store.updateDeal(deal.id, { status: "negotiating" });
      } else {
        await store.confirmDealAndDeductStock(deal.id);
        if (finalStatus === "invoiced") {
          await store.updateDeal(deal.id, { status: "invoiced", invoice_number: store.nextInvoiceNumber(), invoiced_at: new Date().toISOString() });
          if (paid) await store.markDealPaid(deal.id);
        }
      }
    }
    console.log(`Seeded demo deal history for ${seller.name}`);
  }
}

module.exports = { seedDemoData, seedDemoDeals };
