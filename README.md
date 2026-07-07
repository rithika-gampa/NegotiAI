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

It works for **any kind of goods** — the demo marketplace ships with four seeded storefronts spanning office stationery, wholesale grocery, electricals, and restaurant/food-service supply, all running through the same negotiation engine.

## What's in the box

**For buyers**
- **Marketplace directory** — browse seller shops (name, what they sell, trust badge, price range), search across shops and products, open any shop for its full catalog with in-shop search, price sorting, and in-stock filters
- **Instant quotes** — pick a product and quantity, get an itemized quote with bulk discounts applied in seconds
- **Negotiation hub** — the heart of the app. Every quote you hold in one place; chat with the seller's AI agent, use one-click opener chips ("Can you do 10% off?"), and watch a live savings tracker ("You've negotiated 3% off — saving ₹12,240 vs list price")
- **My Orders** — kanban tracker plus a Confirmed Orders table with view-invoice / reorder / message-seller actions

**For sellers**
- **Seller Setup** — product catalog (price/stock, add products), shop description shown on the marketplace, and negotiation rules: minimum margin %, maximum discount %, bulk discount tiers, accepted payment terms. The agent can never go outside these
- **Deal Pipeline** — kanban of every deal with new-order alerts, stale-lead ("needs follow-up") flags, overdue-payment flags, and a **Negotiation** button showing the full transcript of what your AI agent said and the reasoning behind every counter
- **Finance** — collected revenue, outstanding dues, pipeline value, average deal size, collection-rate gauge, and a per-buyer digital ledger — all reconciled live from real deal data
- **Audit Log** — timestamped compliance trail of every lifecycle event (quote created, confirmed, invoiced, paid, reminder sent), exportable as CSV

**For both**
- **Messages** — an inbox of direct human-to-human threads (one per order), deliberately separate from the AI negotiation, for stock issues / delivery questions / anything the AI shouldn't decide
- **Invoices** — one click from a confirmed deal; shows original vs negotiated price per line and total savings; print/save as PDF

## Quick tour (for reviewers)

After starting the app (below), four demo seller accounts are auto-seeded, password **`demo123`**:

| Username | Storefront |
|---|---|
| `saraswati_stationery` | Office stationery & school supplies |
| `greenbasket_grocery` | Wholesale grocery staples |
| `brightvolt_electricals` | Electrical goods & fittings |
| `tandoor_foodservice` | Bulk ingredients for restaurants & caterers |

Suggested 3-minute path:
1. Sign up as a **buyer** → browse the marketplace → open a shop → request a quote (try 500+ units to see bulk tiers kick in)
2. Open **Negotiate** → click a suggestion chip → send → watch the agent counter with visible reasoning, then accept its offer and confirm
3. Log in as that **seller** (`demo123`) → Pipeline → open the **Negotiation** transcript → invoice the deal → mark it paid → check **Finance** and the **Audit Log**

## The negotiation agent

The system prompt in `server/routes/negotiate.js` forces the model to:
- Stay within `min_margin_percent` / `max_discount_percent` / bulk tiers — a deal below the seller's floor is impossible, not just discouraged
- Return structured JSON only: `{ action, quote, message_to_buyer, reasoning }` where action ∈ accept / counter / escalate
- Require an explicit confirmation step before finalizing — a bare "ok" never closes a deal
- Never reveal the seller's internal rules to the buyer, only outcomes

Provider fallback (`server/llmClient.js`): tries `PRIMARY_PROVIDER` first, then each of `BACKUP_PROVIDERS` in order (Anthropic / Groq / Gemini / xAI supported), skipping providers with no API key — so a single provider outage doesn't kill negotiations.

## Stack

- **Backend:** Node.js + Express (`server/`)
- **Database:** PostgreSQL — accounts, products, rules, deals, messages, audit log all persist across restarts/redeploys. Schema + migrations run automatically on startup
- **Auth:** cookie sessions (`express-session`) + bcrypt password hashing; role checks enforced server-side on every route, not just hidden in the UI
- **Frontend:** React, written as `public/app.jsx` and precompiled to plain JS by `build.js` at startup — no client-side Babel, no eval, no CDN (React is vendored locally)
- **AI:** multi-provider fallback client (`server/llmClient.js`)

## Run locally

```bash
npm install
cp .env.example .env
# edit .env — set DATABASE_URL, PRIMARY_PROVIDER, and the matching API key(s)
npm start
```

Open http://localhost:3000

Needs a Postgres `DATABASE_URL` (free tiers: [Neon](https://neon.tech), [Supabase](https://supabase.com), or Render's own Postgres via `render.yaml`). The schema, migrations, and demo sellers are created automatically on first startup — no manual steps.

`npm start` runs `npm run build` first (via `prestart`), compiling `app.jsx` → `app.built.js` and vendoring React into `public/vendor/`. After editing `app.jsx`, restart (or run `npm run build`) — there's no watch mode.

## Deploy on Render

1. Push this repo to GitHub
2. Render → New + → Blueprint → connect the repo (`render.yaml` provisions the web service **and** the Postgres database, wiring `DATABASE_URL` automatically)
3. Add your AI provider API key(s) as secret env vars
4. Deploy — demo sellers seed themselves on first boot

## Project structure

```
build.js                Precompiles app.jsx → app.built.js, vendors React locally
server/
  server.js             Express entry point, routes, startup (schema + seed)
  db.js                 Postgres pool, schema, idempotent migrations
  store.js              All data access (users, products, rules, deals, messages, ledger, audit)
  seed.js               Seeds the 4 themed demo storefronts (idempotent)
  llmClient.js          Multi-provider AI fallback (anthropic / groq / gemini / xai)
  routes/
    auth.js             Signup/login/logout/reset + session-user cache middleware
    quote.js            POST /api/quote — instant itemized quotes
    negotiate.js        POST /api/negotiate — the AI agent + system prompt
    deals.js            Deals, pipeline actions, invoices, messages, finance, audit
public/
  index.html            Loads vendored React + app.built.js (no CDN)
  app.jsx               Entire frontend: landing, auth, marketplace, negotiation hub,
                        pipeline, finance, audit, messages
  app.built.js          Generated — do not edit (gitignored)
  vendor/               Generated — local React UMD builds (gitignored)
```

## Honest scope notes

- **Password reset** returns the token in the response and shows it in the UI instead of emailing it — there's no email provider wired up, which keeps the flow fully testable. Production would send it by email/SMS.
- **"Mark as paid"** is a manual seller action, not a payment-gateway integration — it's the input that drives the ledger and revenue numbers.
- **Seller verification** is a simple heuristic (verified after the first completed deal), not KYC.
- New-order and message updates use lightweight polling, not websockets.

## Security notes

- Never commit `.env` (it's gitignored) — API keys and `DATABASE_URL` live there.
- All buyer/seller data access is authorized server-side per route; buyers can only see their own deals, sellers only their own products, deals, ledger, and audit trail.
#   N e g o t i A I  
 