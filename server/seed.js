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
      { sku: "STN-001", name: "Spiral Notebook A5 (pack of 12)", base_price: 480, stock: 5000 },
      { sku: "STN-002", name: "Ball Pen Blue (box of 50)", base_price: 350, stock: 8000 },
      { sku: "STN-003", name: "A4 Copier Paper (500 sheets)", base_price: 280, stock: 12000 },
      { sku: "STN-004", name: "Stapler + 1000 Pins Set", base_price: 220, stock: 3000 },
      { sku: "STN-005", name: "Whiteboard Marker (pack of 10)", base_price: 260, stock: 4000 },
    ],
  },
  {
    username: "greenbasket_grocery",
    name: "GreenBasket Wholesale Grocery",
    description: "Wholesale grocery staples for retailers and canteens — rice, oils, pulses, sugar, and tea.",
    products: [
      { sku: "GRC-001", name: "Basmati Rice (25 kg bag)", base_price: 2400, stock: 600 },
      { sku: "GRC-002", name: "Sunflower Oil (15 L tin)", base_price: 2100, stock: 450 },
      { sku: "GRC-003", name: "Toor Dal (10 kg pack)", base_price: 1250, stock: 900 },
      { sku: "GRC-004", name: "Sugar (50 kg sack)", base_price: 2050, stock: 300 },
      { sku: "GRC-005", name: "Assam CTC Tea (5 kg pack)", base_price: 1600, stock: 700 },
    ],
  },
  {
    username: "brightvolt_electricals",
    name: "BrightVolt Electricals",
    description: "Electrical goods and fittings — LED lighting, wiring, extension boards, and fans at trade prices.",
    products: [
      { sku: "ELC-001", name: "LED Bulb 9W (box of 20)", base_price: 1500, stock: 2500 },
      { sku: "ELC-002", name: "6-Socket Extension Board", base_price: 420, stock: 1800 },
      { sku: "ELC-003", name: "Copper Wire Coil (90 m)", base_price: 2800, stock: 650 },
      { sku: "ELC-004", name: "Ceiling Fan 1200 mm", base_price: 1450, stock: 400 },
    ],
  },
  {
    username: "tandoor_foodservice",
    name: "Tandoor Foodservice Supplies",
    description: "Bulk ingredients and food-service supplies for restaurants, canteens, and caterers — spices, dairy, frozen items, and packaging.",
    products: [
      { sku: "FDS-001", name: "Mixed Spice Masala (5 kg pack)", base_price: 1800, stock: 800 },
      { sku: "FDS-002", name: "Tomato Puree (catering tin, 3 kg)", base_price: 620, stock: 1200 },
      { sku: "FDS-003", name: "Paneer (bulk, 10 kg block)", base_price: 3400, stock: 350 },
      { sku: "FDS-004", name: "Frozen French Fries (10 kg carton)", base_price: 2100, stock: 500 },
      { sku: "FDS-005", name: "Disposable Takeaway Containers (pack of 500)", base_price: 950, stock: 2000 },
    ],
  },
];

async function seedDemoData() {
  await db.query("DELETE FROM products WHERE sku = ANY($1)", [OLD_STARTER_SKUS]);

  for (const seller of DEMO_SELLERS) {
    const existing = await store.findUserByUsername(seller.username);
    if (!existing) {
      const user = await store.createUser({
        username: seller.username,
        password: DEMO_PASSWORD,
        role: "seller",
        name: seller.name,
      });
      for (const p of seller.products) {
        await store.addProduct(user.id, p);
      }
      console.log(`Seeded demo seller: ${seller.name} (${seller.username})`);
    }

    // Fill in the shop description if it's empty — upgrades demo sellers
    // created before descriptions existed, without clobbering later edits.
    await db.query(
      `UPDATE users SET shop_description = $1
       WHERE username_lower = $2 AND (shop_description IS NULL OR shop_description = '')`,
      [seller.description, seller.username]
    );
  }
}

module.exports = { seedDemoData };
