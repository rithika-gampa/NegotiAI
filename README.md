# NegotiAI — B2B Quote & Negotiation Agent

**Every seller gets an always-on AI agent that negotiates bulk deals for them — within price rules they set once.** Buyers browse a multi-seller marketplace, get instant itemized quotes on any kind of goods, haggle in plain language, and the deal flows automatically through confirmation → invoice → payment tracking.

<!-- If you deploy on Render, put the live link here so judges can click it:
**Live demo:** https://your-app.onrender.com
-->

## Problem statement fit — Theme 3: Commerce & Customer Growth

Built for the **B2B Digital Sales** problem statement: *"Businesses struggle to handle quotations, bulk orders, negotiations, and procurement digitally."*

| Problem statement keyword | Where it lives in NegotiAI |
|---|---|
| **Quotations** | Instant itemized quotes (unit price, bulk discount, total) generated on any product — `POST /api/quote` |
| **Bulk orders** | Quantity-tiered discounts set per seller; stock deducted automatically on confirmation |
| **Negotiations** | The core of the product — a per-seller AI agent that counters, accepts, or escalates in natural language, hard-bounded by the seller's min-margin / max-discount rules |
| **Procurement digitally** | Full lifecycle: RFQ → negotiation → confirmation → invoice → payment tracking → per-buyer ledger → audit trail |

It works for **any kind of goods** — the demo marketplace ships with seven themed storefronts spanning stationery, grocery, electricals, restaurant supply, packaging, office furniture, and textiles, all running through the same negotiation engine.

## What's in the box

**For buyers**
- **Marketplace** — a Swiggy-style category rail (round icon filters: Stationery, Grocery, Food & Catering, Electricals, Packaging, Furniture, Textiles...), two stat tiles (sellers / verified sellers), and a search bar. Shop cards show a trust-tier badge — **New** → **✓ Verified** → **★ Top Negotiator** — computed from each seller's real completed-deal count, not fabricated
- **Shop pages** — full catalog per seller with in-shop search, price sort, and an in-stock filter
- **Instant quotes** — pick a product and quantity, get an itemized quote with bulk discounts applied in seconds
- **Out-of-stock waitlist** — "Notify me when back" on sold-out items; sellers see how many buyers are waiting (a real demand signal), and buyers get a back-in-stock banner the moment it's restocked
- **Negotiation hub** — the heart of the app. Every quote you hold in one place; chat with the seller's AI agent, use one-click opener chips ("Can you do 10% off?"), and watch a live savings tracker ("You've negotiated 6.7% off — saving ₹51,730 vs list price")
- **My Orders** — kanban tracker plus a Confirmed Orders table with view-invoice / reorder / message-seller actions

**For sellers**
- **Seller Setup** — product catalog with a category per product, an **✨ AI-generated shop description** (drafted from your actual catalog — review and edit before saving), and negotiation rules: minimum margin %, maximum discount %, bulk discount tiers, accepted payment terms. The agent can never go outside these
- **Deal Pipeline** — kanban of every deal with new-order alerts, stale-lead ("needs follow-up") flags, overdue-payment flags, and a **Negotiation** button showing the full transcript of what your AI agent said and the reasoning behind every counter
- **AI Deal Intelligence** — a dashboard quantifying what the agent actually did: win rate, margin protected vs. the discount room you allowed, average exchanges to close, a deal funnel, and your most-negotiated product
- **Finance** — collected revenue, outstanding dues, pipeline value, average deal size, collection-rate gauge, and a per-buyer digital ledger — all reconciled live from real deal data
- **Audit Log** — timestamped compliance trail of every lifecycle event (quote created, confirmed, invoiced, paid, reminder sent), exportable as CSV

**For both**
- **Messages** — an inbox of direct human-to-human threads (one per order), deliberately separate from the AI negotiation, for stock issues / delivery questions / anything the AI shouldn't decide
- **Invoices** — one click from a confirmed deal; shows original vs negotiated price per line and total savings; print/save as PDF

## Quick tour (for reviewers)

After starting the app (below), seven demo seller accounts are auto-seeded — password **`demo123`** — each with a full catalog, shop description, and realistic negotiation/deal history (so Pipeline, Finance, and AI Insights are populated, not empty):

| Username | Storefront | Category |
|---|---|---|
| `saraswati_stationery` | Saraswati Stationery Co. | Stationery |
| `greenbasket_grocery` | GreenBasket Wholesale Grocery | Grocery |
| `brightvolt_electricals` | BrightVolt Electricals | Electricals |
| `tandoor_foodservice` | Tandoor Foodservice Supplies | Food & Catering |
| `safepack_solutions` | SafePack Packaging Solutions | Packaging |
| `urbannest_furniture` | Urban Nest Office Furniture | Furniture |
| `vastra_textiles` | Vastra Textile Traders | Textiles |

Suggested 3-minute path:
1. Sign up as a **buyer** → browse the marketplace (try the category rail) → open a shop → request a quote (500+ units triggers bulk tiers)
2. Open **Negotiate** → click a suggestion chip → send → watch the agent counter with visible reasoning, then accept its offer and confirm
3. Log in as that **seller** (`demo123`) → Pipeline → open the **Negotiation** transcript → invoice the deal → mark it paid → check **AI Insights**, **Finance**, and the **Audit Log**

## The negotiation agent

The system prompt in `server/routes/negotiate.js` forces the model to:
- Stay within `min_margin_percent` / `max_discount_percent` / bulk tiers — a deal below the seller's floor is impossible, not just discouraged
- Return structured JSON only: `{ action, quote, message_to_buyer, reasoning }` where action ∈ accept / counter / escalate
- Require an explicit confirmation step before finalizing — a bare "ok" never closes a deal
- Never reveal the seller's internal rules to the buyer, only outcomes

A few things are handled deterministically in code rather than trusted to the model: plain acceptances ("ok", "deal"), and bare-number offers that already meet or beat the current quote — so a provider's arithmetic slip can never hand away extra margin the buyer didn't even ask for.

**Provider fallback** (`server/llmClient.js`): tries `PRIMARY_PROVIDER` first, then each of `BACKUP_PROVIDERS` in order (Anthropic / Groq / Gemini / xAI supported), skipping providers with no API key, with a 12s timeout per attempt so one hung provider can't stall a reply. A single provider outage doesn't kill negotiations.

**Performance:** each negotiation turn used to cost 11-18 sequential database round trips (append buyer message, append agent reply, update deal status — each with its own extra read). That's now collapsed to one read + one write per turn (`store.writeDealTurn`), independent reads run in parallel, and the final "deal confirmed" stock deduction is a single SQL `UPDATE ... SET stock = GREATEST(0, stock - $1)` instead of select-then-update. Real measured replies: ~6s → ~2-3s.

## AI beyond negotiation

The same multi-provider client also powers an **AI shop-description generator** (`POST /api/setup/generate-description`, in Seller Setup): it reads the seller's actual product catalog and drafts a one-line shop description, which the seller reviews and edits before saving — a writing aid, not an auto-publish.

## Stack

- **Backend:** Node.js + Express (`server/`)
- **Database:** PostgreSQL — accounts, products, rules, deals, messages, audit log, and **sessions** all persist across restarts/redeploys (`connect-pg-simple` — logins survive a server restart, not just a page refresh). Schema + migrations run automatically on startup
- **Auth:** cookie sessions + bcrypt password hashing; role checks enforced server-side on every route, not just hidden in the UI. Signup/login/reset are live; **email/mobile OTP verification is currently disabled** (see Honest scope notes)
- **Email:** `nodemailer` for optional real email delivery of the (currently dormant) OTP flow and password-reset tokens — falls back to demo mode (shown on screen) if no SMTP is configured
- **Frontend:** React, written as `public/app.jsx` and precompiled to plain JS by `build.js` at startup — no client-side Babel, no eval, no CDN (React is vendored locally, icons are hand-drawn inline SVG rather than a font/CDN icon set)
- **AI:** multi-provider fallback client (`server/llmClient.js`), used for both negotiation and shop-description generation

## Run locally

```bash
npm install
cp .env.example .env
# edit .env — set DATABASE_URL, PRIMARY_PROVIDER, and the matching API key(s)
npm start
```

Open http://localhost:3000

Needs a Postgres `DATABASE_URL` (free tiers: [Neon](https://neon.tech), [Supabase](https://supabase.com), or Render's own Postgres via `render.yaml`). The schema, migrations, and demo sellers are created automatically on first startup — no manual steps. Demo-data seeding runs in the background after the server starts listening, so the port binds immediately even on a fresh database.

`npm start` runs `npm run build` first (via `prestart`), compiling `app.jsx` → `app.built.js` and vendoring React into `public/vendor/`. After editing `app.jsx`, restart (or run `npm run build`) — there's no watch mode.

## Deploy on Render

1. Push this repo to GitHub
2. Render → **New +** → **Blueprint** → connect the repo (`render.yaml` provisions the web service **and** the Postgres database, wiring `DATABASE_URL` automatically) — a plain "Web Service" will *not* wire the database; it must be a Blueprint
3. Add your AI provider API key(s) as secret env vars (`PRIMARY_PROVIDER=groq` is a safe default if your Anthropic key isn't funded)
4. Deploy — demo sellers seed themselves on first boot

## Project structure

```
build.js                Precompiles app.jsx → app.built.js, vendors React locally
server/
  server.js             Express entry point, routes, startup (schema + background seed)
  db.js                 Postgres pool, schema, idempotent migrations
  store.js              All data access (users, products, rules, deals, messages, ledger, audit, stock waitlist)
  seed.js               Seeds the 7 themed demo storefronts + realistic deal history (idempotent)
  mailer.js             Optional real email delivery (nodemailer); demo-mode fallback if unconfigured
  llmClient.js          Multi-provider AI fallback (anthropic / groq / gemini / xai) with per-call timeout
  routes/
    auth.js             Signup/login/logout/reset + session-user cache middleware
    quote.js            POST /api/quote — instant itemized quotes
    negotiate.js        POST /api/negotiate — the AI agent + system prompt
    deals.js            Deals, pipeline actions, invoices, messages, finance, audit,
                        stock notifications, AI shop-description generation
public/
  index.html            Loads vendored React + app.built.js (no CDN)
  app.jsx               Entire frontend: landing, auth, marketplace, negotiation hub,
                        pipeline, AI insights, finance, audit, messages
  app.built.js           Generated — do not edit (gitignored)
  vendor/                Generated — local React UMD builds (gitignored)
```

## Honest scope notes

- **Mobile/email OTP verification is temporarily disabled.** Signup logs the account in immediately instead of requiring a code. The infrastructure is intact and dormant (`store.createOtpCode` / `verifyOtpCode`, `mailer.js`, the `/api/auth/verify-otp` and `/api/auth/resend-otp` routes) — re-enabling it means restoring the block noted in `server/routes/auth.js`'s `signup()` comment.
- **Trust badges** (New / Verified / Top Negotiator) are computed from real completed-deal counts (≥1 / ≥5) — not fabricated. The seeded demo sellers are force-marked `verified` for demo convenience regardless of deal count; a real seller only becomes verified by actually closing a deal.
- **Password reset** returns the token in the response and shows it in the UI when no SMTP is configured — keeps the flow testable without an inbox. Set `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS` in `.env` for real email delivery.
- **"Mark as paid"** is a manual seller action, not a payment-gateway integration — it's the input that drives the ledger and revenue numbers.
- **Seller category** is set per-product by the seller (or defaults to "Other"); a shop's marketplace category is whichever category most of its products belong to.
- New-order, message, and back-in-stock updates use lightweight polling, not websockets.

## Security notes

- Never commit `.env` (it's gitignored) — API keys and `DATABASE_URL` live there.
- All buyer/seller data access is authorized server-side per route; buyers can only see their own deals, sellers only their own products, deals, ledger, and audit trail.
