const { useState, useEffect, useRef } = React;

const STYLES = `
  :root {
    --ink: #14213D;
    --paper: #F7F4EC;
    --paper-raised: #FFFFFF;
    --amber: #E8A33D;
    --amber-deep: #C7822A;
    --success: #2F6F4F;
    --danger: #B23A48;
    --text: #3A3F4D;
    --text-soft: #6B7080;
    --line: #DCD6C6;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background:
      radial-gradient(1100px 520px at 85% -5%, rgba(232,163,61,0.13), transparent 60%),
      radial-gradient(900px 480px at -10% 105%, rgba(20,33,61,0.07), transparent 55%),
      var(--paper);
    background-attachment: fixed;
    color: var(--text);
    font-family: 'Inter', sans-serif;
  }
  .app { min-height: 100vh; display: flex; flex-direction: column; }
  .auth-screen {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }
  .auth-card {
    background: var(--paper-raised);
    border: 1px solid var(--line);
    border-radius: 14px;
    padding: 40px;
    width: 100%;
    max-width: 400px;
    box-shadow: 0 18px 48px rgba(20,33,61,0.12), 0 2px 6px rgba(20,33,61,0.05);
  }
  .auth-back {
    background: none;
    border: none;
    color: var(--text-soft);
    font-size: 12.5px;
    font-weight: 500;
    cursor: pointer;
    padding: 0;
    margin-bottom: 16px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .auth-back:hover { color: var(--amber-deep); }
  .auth-brand {
    font-family: 'Fraunces', serif;
    font-size: 28px;
    font-weight: 700;
    text-align: center;
    margin-bottom: 4px;
    color: var(--ink);
  }
  .auth-brand span { color: var(--amber); }
  .auth-sub { text-align: center; color: var(--text-soft); font-size: 13px; margin-bottom: 28px; }
  .role-toggle { display: flex; gap: 8px; margin-bottom: 20px; }
  .role-btn {
    flex: 1;
    padding: 10px;
    border: 1px solid var(--line);
    background: var(--paper);
    border-radius: 8px;
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-soft);
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .role-btn.active { background: var(--ink); border-color: var(--ink); color: var(--paper); }
  .auth-switch { text-align: center; font-size: 13px; color: var(--text-soft); margin-top: 18px; }
  .password-field { position: relative; margin-bottom: 16px; }
  .password-field input { padding-right: 42px; margin-bottom: 0; }
  .password-toggle {
    position: absolute;
    right: 6px;
    top: 50%;
    transform: translateY(-50%);
    width: 30px;
    height: 30px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    color: var(--text-soft);
    cursor: pointer;
    padding: 0;
    border-radius: 6px;
    transition: color 0.15s ease, background 0.15s ease;
  }
  .password-toggle:hover { color: var(--amber-deep); background: rgba(232,163,61,0.1); }
  .password-toggle svg { display: block; }
  .link-btn {
    background: none;
    border: none;
    color: var(--amber-deep);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    padding: 0;
  }
  .info-box {
    background: rgba(47,111,79,0.08);
    border: 1px solid rgba(47,111,79,0.3);
    color: var(--success);
    padding: 12px 16px;
    border-radius: 6px;
    font-size: 13px;
    margin-bottom: 16px;
  }
  .auth-switch button {
    background: none;
    border: none;
    color: var(--amber-deep);
    font-weight: 600;
    cursor: pointer;
    font-size: 13px;
    padding: 0;
  }
  .logout-btn {
    background: transparent;
    border: 1px solid rgba(247,244,236,0.25);
    color: rgba(247,244,236,0.75);
    padding: 6px 14px;
    border-radius: 999px;
    font-size: 12px;
    cursor: pointer;
  }
  .logout-btn:hover { border-color: var(--danger); color: var(--paper); }
  .user-chip {
    display: flex;
    align-items: center;
    gap: 10px;
    color: rgba(247,244,236,0.85);
    font-size: 13px;
  }
  .topbar {
    position: sticky;
    top: 0;
    z-index: 40;
    background: var(--ink);
    color: var(--paper);
    padding: 18px 32px 14px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    box-shadow: 0 2px 14px rgba(20,33,61,0.28);
  }
  .topbar-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
  }
  .brand {
    font-family: 'Fraunces', serif;
    font-size: 24px;
    font-weight: 700;
    letter-spacing: -0.01em;
  }
  .brand span { color: var(--amber); }
  .portal-switch {
    display: flex;
    gap: 2px;
    background: rgba(247,244,236,0.08);
    border-radius: 999px;
    padding: 3px;
  }
  .portal-btn {
    background: transparent;
    border: none;
    color: rgba(247,244,236,0.6);
    padding: 8px 18px;
    border-radius: 999px;
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .portal-btn:hover { color: var(--paper); }
  .portal-btn.active { background: var(--paper); color: var(--ink); }
  .tabs { display: flex; gap: 4px; }
  .tab {
    background: transparent;
    border: 1px solid rgba(247,244,236,0.25);
    color: rgba(247,244,236,0.75);
    padding: 8px 16px;
    border-radius: 999px;
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .tab:hover { border-color: var(--amber); color: var(--paper); }
  .tab.active { background: var(--amber); border-color: var(--amber); color: var(--ink); font-weight: 600; }
  .tab-badge {
    display: inline-block;
    background: var(--danger);
    color: white;
    font-size: 10px;
    font-weight: 700;
    min-width: 16px;
    height: 16px;
    line-height: 16px;
    text-align: center;
    border-radius: 999px;
    margin-left: 6px;
    padding: 0 4px;
  }
  .main { flex: 1; padding: 32px; max-width: 980px; margin: 0 auto; width: 100%; }
  .panel-title { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 600; margin: 0 0 4px; }
  .panel-sub { color: var(--text-soft); font-size: 14px; margin: 0 0 24px; }
  .card {
    background: var(--paper-raised);
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 24px;
    margin-bottom: 20px;
    box-shadow: 0 1px 3px rgba(20,33,61,0.05);
  }
  label { display: block; font-size: 13px; font-weight: 500; margin-bottom: 6px; color: var(--text); }
  .required-mark { color: var(--danger); }
  .storefront-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 20px;
    flex-wrap: wrap;
    margin-bottom: 20px;
  }
  .seller-group { margin-bottom: 28px; }
  .seller-group-head {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
    flex-wrap: wrap;
  }
  .seller-group-info { display: flex; flex-direction: column; gap: 3px; max-width: 560px; }
  .seller-group-name { font-family: 'Fraunces', serif; font-size: 16px; font-weight: 600; color: var(--ink); }
  .seller-group-desc { font-size: 12.5px; color: var(--text-soft); margin: 0; line-height: 1.45; }
  .back-link {
    background: none;
    border: none;
    color: var(--text-soft);
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    padding: 0;
    margin-bottom: 16px;
  }
  .back-link:hover { color: var(--amber-deep); }
  .shop-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 20px;
    flex-wrap: wrap;
    padding-bottom: 20px;
    margin-bottom: 20px;
    border-bottom: 1px solid var(--line);
  }
  .marketplace-toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 24px;
  }
  .search-field { position: relative; flex: 1; min-width: 220px; }
  .search-icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 18px;
    color: var(--text-soft);
    pointer-events: none;
  }
  .search-input {
    width: 100%;
    padding: 11px 14px 11px 38px;
    border: 1px solid var(--line);
    border-radius: 999px;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    background: var(--paper-raised);
    color: var(--text);
    margin-bottom: 0;
  }
  .search-input:focus { outline: 2px solid var(--amber); outline-offset: 1px; border-color: var(--amber); }
  .filter-select {
    width: auto;
    padding: 10px 14px;
    border: 1px solid var(--line);
    border-radius: 8px;
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 500;
    background: var(--paper-raised);
    color: var(--text);
    margin-bottom: 0;
    cursor: pointer;
  }
  .filter-check {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-soft);
    white-space: nowrap;
    cursor: pointer;
    margin-bottom: 0;
  }
  .filter-check input { width: auto; margin: 0; cursor: pointer; }
  .shop-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 18px;
  }
  .shop-card {
    background: var(--paper-raised);
    border: 1px solid var(--line);
    border-radius: 12px;
    padding: 22px 24px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 10px;
    box-shadow: 0 1px 3px rgba(20,33,61,0.05);
    transition: all 0.16s ease;
  }
  .shop-card:hover { transform: translateY(-3px); border-color: var(--amber); box-shadow: 0 12px 28px rgba(20,33,61,0.11); }
  .shop-card-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
  .shop-card-name { font-family: 'Fraunces', serif; font-size: 18px; font-weight: 600; color: var(--ink); line-height: 1.2; }
  .shop-card-desc { font-size: 13px; color: var(--text-soft); margin: 0; line-height: 1.5; flex: 1; }
  .shop-card-meta { display: flex; align-items: center; gap: 8px; font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: var(--text-soft); }
  .shop-card-cta { font-size: 13px; font-weight: 600; color: var(--amber-deep); margin-top: 2px; }
  .product-card.out-of-stock { opacity: 0.6; }
  .product-card.out-of-stock .product-stock { color: var(--danger); }
  .inline-rfq-card { border-color: var(--amber); border-width: 2px; margin-top: 14px; }
  .trust-badge {
    background: var(--paper-raised);
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 8px 16px;
    font-size: 12px;
    font-weight: 600;
    color: var(--text-soft);
    white-space: nowrap;
  }
  .trust-badge.verified { border-color: var(--success); color: var(--success); background: rgba(47,111,79,0.06); }
  .product-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 14px;
    margin-bottom: 20px;
  }
  .product-card {
    background: var(--paper-raised);
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 18px;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .product-card:hover { border-color: var(--amber); transform: translateY(-1px); }
  .product-card.selected { border-color: var(--amber); border-width: 2px; background: rgba(232,163,61,0.05); }
  .product-name { font-family: 'Fraunces', serif; font-size: 15px; font-weight: 600; color: var(--ink); margin-bottom: 2px; }
  .product-sku { font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: var(--text-soft); margin-bottom: 12px; }
  .product-price { font-size: 20px; font-weight: 600; color: var(--ink); }
  .product-price span { font-size: 12px; font-weight: 400; color: var(--text-soft); }
  .product-stock { font-size: 11px; color: var(--text-soft); margin-top: 6px; }
  .lead-flag {
    display: inline-block;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    padding: 2px 8px;
    border-radius: 4px;
    background: rgba(178,58,72,0.1);
    color: var(--danger);
    margin-left: 6px;
  }
  .lead-flag.new { background: rgba(232,163,61,0.2); color: var(--amber-deep); }
  .last-activity { font-size: 10px; color: var(--text-soft); margin-top: 4px; }
  .new-order-badge {
    background: var(--amber);
    color: var(--ink);
    font-size: 13px;
    font-weight: 700;
    padding: 8px 16px;
    border-radius: 999px;
    white-space: nowrap;
  }
  .card-actions { display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap; }
  .payment-badge {
    display: inline-block;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    padding: 2px 7px;
    border-radius: 4px;
    margin-left: 6px;
  }
  .payment-badge.paid { background: rgba(47,111,79,0.12); color: var(--success); }
  .payment-badge.unpaid { background: rgba(178,58,72,0.1); color: var(--danger); }
  .payment-badge.confirmed { background: rgba(232,163,61,0.18); color: var(--amber-deep); }
  .fin-hero {
    display: grid;
    grid-template-columns: 1.3fr 1fr;
    gap: 1px;
    background: var(--line);
    border-radius: 14px;
    overflow: hidden;
    margin-bottom: 24px;
    box-shadow: 0 2px 8px rgba(20,33,61,0.06);
  }
  .fin-hero-main {
    background: var(--ink);
    color: var(--paper);
    padding: 28px 32px;
  }
  .fin-hero-label {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: rgba(247,244,236,0.6);
    margin-bottom: 10px;
  }
  .fin-hero-value {
    font-family: 'Fraunces', serif;
    font-size: 42px;
    font-weight: 600;
    line-height: 1;
    color: var(--amber);
    margin-bottom: 12px;
  }
  .fin-hero-sub { font-size: 13px; color: rgba(247,244,236,0.8); }
  .fin-hero-gauge {
    background: var(--paper-raised);
    padding: 28px 32px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .fin-gauge-label { font-family: 'Fraunces', serif; font-size: 15px; font-weight: 600; color: var(--ink); }
  @media (max-width: 640px) {
    .fin-hero { grid-template-columns: 1fr; }
  }
  .stat-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
  }
  .stat-card {
    background: var(--paper-raised);
    border: 1px solid var(--line);
    border-left: 4px solid var(--line);
    border-radius: 10px;
    padding: 20px 22px;
    box-shadow: 0 1px 2px rgba(20,33,61,0.04);
    position: relative;
  }
  .stat-card.accent-success { border-left-color: var(--success); }
  .stat-card.accent-danger { border-left-color: var(--danger); }
  .stat-card.accent-amber { border-left-color: var(--amber); }
  .stat-card.accent-ink { border-left-color: var(--ink); }
  .stat-icon { font-size: 18px; position: absolute; top: 18px; right: 20px; opacity: 0.5; }
  .stat-label { font-size: 12px; color: var(--text-soft); margin-bottom: 8px; padding-right: 24px; }
  .stat-value { font-family: 'IBM Plex Mono', monospace; font-size: 26px; font-weight: 600; color: var(--ink); }
  .stat-value.success { color: var(--success); }
  .stat-value.danger { color: var(--danger); }
  .collection-card { margin-bottom: 20px; }
  .collection-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 10px; }
  .collection-pct { font-family: 'IBM Plex Mono', monospace; font-size: 20px; font-weight: 700; color: var(--success); }
  .progress-track {
    background: rgba(178,58,72,0.12);
    border-radius: 999px;
    height: 10px;
    overflow: hidden;
  }
  .progress-fill {
    height: 100%;
    background: var(--success);
    border-radius: 999px;
    transition: width 0.4s ease;
  }
  .collection-caption { font-size: 12px; color: var(--text-soft); margin: 8px 0 0; }
  .data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .data-table th {
    text-align: left;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: var(--text-soft);
    border-bottom: 1px solid var(--line);
    padding: 0 10px 10px 0;
  }
  .data-table td { padding: 10px 10px 10px 0; border-bottom: 1px solid var(--line); font-family: 'IBM Plex Mono', monospace; }
  .data-table td.emphasis { color: var(--ink); font-weight: 600; }
  .data-table td.danger { color: var(--danger); }
  .data-table td.success { color: var(--success); }
  .export-btn {
    background: transparent;
    border: 1px solid var(--ink);
    color: var(--ink);
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }
  .export-btn:hover { background: var(--ink); color: var(--paper); }
  .audit-event-type {
    display: inline-block;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.02em;
    padding: 2px 8px;
    border-radius: 4px;
    background: rgba(27,31,42,0.08);
    color: var(--ink);
  }
  .dc-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    flex-wrap: wrap;
  }
  .dc-name { font-weight: 600; color: var(--ink); font-size: 13px; }
  .dc-sku { font-family: 'IBM Plex Mono', monospace; font-size: 10px; color: var(--text-soft); margin-top: 1px; margin-bottom: 6px; }
  .card-btn {
    background: var(--paper-raised);
    border: 1px solid var(--line);
    color: var(--text);
    font-family: 'Inter', sans-serif;
    font-size: 11px;
    font-weight: 600;
    padding: 5px 11px;
    border-radius: 999px;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.15s ease;
  }
  .card-btn:hover { border-color: var(--amber-deep); color: var(--amber-deep); background: rgba(232,163,61,0.08); }
  .tabs-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }
  .msgs-tab { display: inline-flex; align-items: center; gap: 7px; }
  .msgs-tab svg { display: block; }
  .messages-layout { display: grid; grid-template-columns: 300px 1fr; gap: 16px; align-items: start; }
  .conv-list {
    background: var(--paper-raised);
    border: 1px solid var(--line);
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(20,33,61,0.05);
  }
  .conv-item { padding: 14px 16px; border-bottom: 1px solid var(--line); cursor: pointer; transition: background 0.15s ease; }
  .conv-item:last-child { border-bottom: none; }
  .conv-item:hover { background: var(--paper); }
  .conv-item.active { background: rgba(232,163,61,0.1); box-shadow: inset 3px 0 0 var(--amber); }
  .conv-name { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; font-size: 13px; font-weight: 600; color: var(--ink); }
  .conv-time { font-size: 10px; font-weight: 400; color: var(--text-soft); white-space: nowrap; }
  .conv-product { font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; color: var(--text-soft); margin-top: 2px; }
  .conv-preview { font-size: 12px; color: var(--text-soft); margin-top: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .conv-preview.unread { color: var(--ink); font-weight: 600; }
  .thread-pane {
    background: var(--paper-raised);
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 20px;
    box-shadow: 0 1px 3px rgba(20,33,61,0.05);
    display: flex;
    flex-direction: column;
    min-height: 440px;
  }
  .thread-head { padding-bottom: 12px; border-bottom: 1px solid var(--line); margin-bottom: 12px; }
  .thread-title { font-family: 'Fraunces', serif; font-size: 16px; font-weight: 600; color: var(--ink); }
  .thread-meta { font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: var(--text-soft); margin-top: 2px; }
  .thread-empty { flex: 1; display: grid; place-items: center; color: var(--text-soft); font-size: 13px; text-align: center; padding: 40px 20px; }
  @media (max-width: 780px) {
    .messages-layout { grid-template-columns: 1fr; }
    .thread-pane { min-height: 320px; }
  }
  .dm-box {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-height: 280px;
    min-height: 60px;
    overflow-y: auto;
    margin-bottom: 14px;
    padding: 2px 4px;
  }
  .dm-empty {
    color: var(--text-soft);
    font-size: 12px;
    text-align: center;
    padding: 18px 12px;
    background: var(--paper);
    border: 1px dashed var(--line);
    border-radius: 8px;
  }
  .dm-msg { max-width: 82%; padding: 8px 12px; border-radius: 8px; font-size: 13px; line-height: 1.4; }
  .dm-msg.mine { align-self: flex-end; background: var(--ink); color: var(--paper); }
  .dm-msg.theirs { align-self: flex-start; background: var(--paper); border: 1px solid var(--line); }
  .dm-msg-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.03em; opacity: 0.7; margin-bottom: 2px; }
  input, select {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--line);
    border-radius: 6px;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    background: var(--paper);
    color: var(--text);
    margin-bottom: 16px;
  }
  input:focus, select:focus { outline: 2px solid var(--amber); outline-offset: 1px; border-color: var(--amber); }
  textarea.shop-desc-input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--line);
    border-radius: 6px;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    line-height: 1.5;
    background: var(--paper);
    color: var(--text);
    margin-bottom: 8px;
    resize: vertical;
  }
  textarea.shop-desc-input:focus { outline: 2px solid var(--amber); outline-offset: 1px; border-color: var(--amber); }
  .row { display: flex; gap: 16px; }
  .row > * { flex: 1; }
  .btn {
    background: var(--ink);
    color: var(--paper);
    border: none;
    padding: 11px 22px;
    border-radius: 6px;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
    box-shadow: 0 1px 2px rgba(20,33,61,0.15);
  }
  .btn:hover { opacity: 0.88; transform: translateY(-1px); box-shadow: 0 4px 10px rgba(20,33,61,0.18); }
  .btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; box-shadow: none; }
  .btn.amber { background: var(--amber); color: var(--ink); }
  .btn.ghost { background: transparent; border: 1.5px solid var(--ink); color: var(--ink); box-shadow: none; }
  .btn.ghost:hover { background: var(--ink); color: var(--paper); opacity: 1; }
  .btn.lg { padding: 14px 28px; font-size: 15px; border-radius: 8px; }
  .quote-card {
    background: var(--paper);
    border: 1px dashed var(--line);
    border-radius: 8px;
    padding: 18px 20px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 13px;
  }
  .quote-card .total {
    font-size: 22px;
    font-weight: 500;
    color: var(--ink);
    margin-top: 8px;
  }
  .quote-line { display: flex; justify-content: space-between; padding: 3px 0; color: var(--text-soft); }
  .chat-area {
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-height: 200px;
    max-height: 420px;
    overflow-y: auto;
    padding: 4px;
    margin-bottom: 16px;
  }
  .msg { max-width: 78%; padding: 12px 16px; border-radius: 10px; font-size: 14px; line-height: 1.5; }
  .msg.buyer { align-self: flex-end; background: var(--ink); color: var(--paper); border-bottom-right-radius: 2px; }
  .msg.agent { align-self: flex-start; background: var(--paper); border: 1px solid var(--line); border-bottom-left-radius: 2px; }
  .reasoning-stamp {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px dashed var(--line);
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    color: var(--text-soft);
    display: flex;
    align-items: flex-start;
    gap: 6px;
  }
  .action-badge {
    display: inline-block;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 2px 8px;
    border-radius: 4px;
    margin-bottom: 4px;
  }
  .action-badge.accept { background: rgba(47,111,79,0.12); color: var(--success); }
  .action-badge.counter { background: rgba(232,163,61,0.18); color: var(--amber-deep); }
  .action-badge.escalate { background: rgba(178,58,72,0.12); color: var(--danger); }
  .action-badge.confirm_pending { background: rgba(27,31,42,0.08); color: var(--ink); }
  .chat-input-row { display: flex; gap: 10px; }
  .chat-input-row input { margin-bottom: 0; }
  .thinking { color: var(--text-soft); font-size: 13px; font-style: italic; padding: 8px 0; }
  .suggest-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
  .suggest-chip {
    background: rgba(232,163,61,0.08);
    border: 1px dashed var(--amber-deep);
    color: var(--amber-deep);
    font-family: 'Inter', sans-serif;
    font-size: 12px;
    font-weight: 500;
    padding: 6px 12px;
    border-radius: 999px;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .suggest-chip:hover { background: rgba(232,163,61,0.18); }
  .neg-savings { margin-top: 6px; font-size: 12px; font-weight: 600; color: var(--success); }
  .pipeline { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
  .pcol { background: var(--paper-raised); border: 1px solid var(--line); border-radius: 10px; padding: 14px; min-height: 200px; }
  .pcol h4 { font-family: 'Fraunces', serif; font-size: 14px; margin: 0 0 10px; padding-bottom: 8px; border-bottom: 2px solid; }
  .pcol.quote_sent h4 { border-color: var(--text-soft); }
  .pcol.negotiating h4 { border-color: var(--amber); }
  .pcol.confirmed h4 { border-color: var(--success); }
  .pcol.invoiced h4 { border-color: var(--ink); }
  .deal-card {
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: 6px;
    padding: 10px 12px;
    margin-bottom: 8px;
    font-size: 12px;
    cursor: pointer;
  }
  .deal-card:hover { border-color: var(--amber); }
  .deal-card.read-only { cursor: default; }
  .deal-card.read-only:hover { border-color: var(--line); }
  .deal-card .sku { font-weight: 600; color: var(--ink); }
  .deal-card .amt { font-family: 'IBM Plex Mono', monospace; color: var(--text-soft); margin-top: 4px; }
  .empty { color: var(--text-soft); font-size: 12px; text-align: center; padding: 20px 0; }
  .error-box { background: rgba(178,58,72,0.08); border: 1px solid rgba(178,58,72,0.3); color: var(--danger); padding: 12px 16px; border-radius: 6px; font-size: 13px; margin-bottom: 16px; }
  .edit-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
    padding: 12px 0;
    border-bottom: 1px solid var(--line);
  }
  .edit-row:last-child { border-bottom: none; }
  .edit-row-label { font-size: 14px; flex: 1; }
  .edit-row-fields { display: flex; gap: 12px; }
  .edit-row-fields input { width: 110px; margin-bottom: 0; }
  .edit-row-fields label { font-size: 11px; color: var(--text-soft); margin-bottom: 2px; }
  .add-product-row {
    display: flex;
    align-items: flex-end;
    gap: 12px;
    padding-top: 16px;
    margin-top: 8px;
    border-top: 1px dashed var(--line);
    flex-wrap: wrap;
  }
  .add-product-row > div:first-child { flex: 1; min-width: 160px; }
  .add-product-row input { margin-bottom: 0; }
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(27,31,42,0.55);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 40px 20px;
    z-index: 50;
    overflow-y: auto;
  }
  .invoice-sheet {
    background: var(--paper-raised);
    width: 100%;
    max-width: 560px;
    border-radius: 10px;
    padding: 40px;
    position: relative;
  }
  .invoice-sheet .close-btn {
    position: absolute;
    top: 16px;
    right: 16px;
    background: transparent;
    border: none;
    font-size: 20px;
    cursor: pointer;
    color: var(--text-soft);
  }
  .invoice-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 2px solid var(--ink);
    padding-bottom: 20px;
    margin-bottom: 24px;
  }
  .invoice-head .brand { color: var(--ink); font-size: 22px; }
  .invoice-head .meta { text-align: right; font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: var(--text-soft); }
  .invoice-table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px; }
  .invoice-table th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-soft); border-bottom: 1px solid var(--line); padding-bottom: 8px; }
  .invoice-table td { padding: 10px 0; border-bottom: 1px solid var(--line); font-family: 'IBM Plex Mono', monospace; }
  .invoice-total-row { display: flex; justify-content: flex-end; gap: 24px; font-family: 'IBM Plex Mono', monospace; padding-top: 8px; }
  .invoice-total-row .amount { font-size: 24px; color: var(--ink); }
  .print-btn { margin-top: 24px; }
  @media print {
    body * { visibility: hidden; }
    .invoice-sheet, .invoice-sheet * { visibility: visible; }
    .invoice-sheet { position: absolute; top: 0; left: 0; box-shadow: none; }
    .close-btn, .print-btn { display: none; }
  }
  @media (max-width: 720px) {
    .pipeline { grid-template-columns: 1fr; }
    .row { flex-direction: column; }
  }

  /* ---------- Landing page ---------- */
  .landing { min-height: 100vh; display: flex; flex-direction: column; }
  .landing-nav {
    position: sticky;
    top: 0;
    z-index: 40;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 40px;
    background: rgba(247,244,236,0.88);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--line);
  }
  .landing-nav .brand { color: var(--ink); font-size: 22px; }
  .nav-actions { display: flex; gap: 10px; align-items: center; }
  .hero {
    display: grid;
    grid-template-columns: 1.15fr 1fr;
    gap: 56px;
    align-items: center;
    max-width: 1100px;
    margin: 0 auto;
    padding: 76px 40px 72px;
    width: 100%;
  }
  .hero-eyebrow {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--amber-deep);
    margin-bottom: 18px;
  }
  .hero-title {
    font-family: 'Fraunces', serif;
    font-size: clamp(36px, 5vw, 54px);
    line-height: 1.08;
    font-weight: 700;
    color: var(--ink);
    letter-spacing: -0.02em;
    margin: 0 0 20px;
  }
  .hero-title em { color: var(--amber-deep); }
  .hero-sub { font-size: 17px; line-height: 1.65; color: var(--text-soft); margin: 0 0 28px; max-width: 480px; }
  .hero-ctas { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
  .hero-note { font-size: 12px; color: var(--text-soft); font-family: 'IBM Plex Mono', monospace; }
  .hero-visual { position: relative; padding-bottom: 26px; }
  .hero-chat {
    background: var(--paper-raised);
    border: 1px solid var(--line);
    border-radius: 14px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    box-shadow: 0 24px 56px rgba(20,33,61,0.16), 0 3px 8px rgba(20,33,61,0.06);
    transform: rotate(1.2deg);
  }
  .hero-chat .msg { font-size: 13px; }
  .hero-chat-head {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-soft);
    padding-bottom: 2px;
  }
  .hero-chat-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--success); animation: pulse-dot 1.6s ease-in-out infinite; }
  @keyframes pulse-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
  .hero-quote-float {
    position: absolute;
    left: -30px;
    bottom: 0;
    background: var(--ink);
    color: var(--paper);
    border-radius: 12px;
    padding: 16px 20px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
    min-width: 220px;
    box-shadow: 0 16px 36px rgba(20,33,61,0.3);
    transform: rotate(-2deg);
  }
  .hero-quote-float .quote-line { color: rgba(247,244,236,0.7); gap: 18px; }
  .hero-quote-float .total { color: var(--amber); font-size: 18px; font-weight: 600; margin-top: 6px; }
  .land-section { max-width: 1100px; margin: 0 auto; padding: 24px 40px 0; width: 100%; }
  .land-kicker {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--amber-deep);
    text-align: center;
    margin-bottom: 12px;
  }
  .land-h2 {
    font-family: 'Fraunces', serif;
    font-size: clamp(26px, 3.5vw, 36px);
    font-weight: 700;
    color: var(--ink);
    text-align: center;
    letter-spacing: -0.01em;
    margin: 0 0 14px;
  }
  .land-lede { text-align: center; color: var(--text-soft); font-size: 15px; line-height: 1.65; max-width: 580px; margin: 0 auto 44px; }
  .feature-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
  .feature-card {
    background: var(--paper-raised);
    border: 1px solid var(--line);
    border-radius: 12px;
    padding: 26px 24px;
    box-shadow: 0 1px 3px rgba(20,33,61,0.05);
    transition: all 0.18s ease;
  }
  .feature-card:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(20,33,61,0.11); border-color: var(--amber); }
  .feature-icon {
    width: 48px;
    height: 48px;
    display: grid;
    place-items: center;
    font-size: 24px;
    background: rgba(232,163,61,0.16);
    border-radius: 12px;
    margin-bottom: 16px;
  }
  .feature-title { font-family: 'Fraunces', serif; font-size: 17px; font-weight: 600; color: var(--ink); margin: 0 0 8px; }
  .feature-desc { font-size: 13.5px; line-height: 1.6; color: var(--text-soft); margin: 0; }
  .cta-band { max-width: 1100px; margin: 60px auto 64px; padding: 0 40px; width: 100%; }
  .cta-band-inner {
    position: relative;
    overflow: hidden;
    background: var(--ink);
    border-radius: 18px;
    padding: 60px 48px;
    text-align: center;
    box-shadow: 0 24px 56px rgba(20,33,61,0.25);
  }
  .cta-band-inner::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(600px 300px at 85% -20%, rgba(232,163,61,0.25), transparent 65%);
    pointer-events: none;
  }
  .cta-band h2 {
    position: relative;
    font-family: 'Fraunces', serif;
    font-size: clamp(26px, 3.5vw, 34px);
    font-weight: 700;
    color: var(--paper);
    margin: 0 0 12px;
  }
  .cta-band p { position: relative; color: rgba(247,244,236,0.75); font-size: 15px; margin: 0 auto 28px; max-width: 480px; }
  .cta-band .btn { position: relative; }
  .landing-footer {
    border-top: 1px solid var(--line);
    padding: 26px 40px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 10px;
    font-size: 12px;
    color: var(--text-soft);
  }
  .landing-footer .brand { font-size: 16px; color: var(--ink); }
  @media (max-width: 880px) {
    .hero { grid-template-columns: 1fr; padding-top: 52px; gap: 48px; }
    .hero-visual { max-width: 460px; margin-left: 30px; }
    .feature-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 560px) {
    .landing-nav { padding: 14px 20px; }
    .hero, .land-section, .cta-band { padding-left: 20px; padding-right: 20px; }
    .hero-visual { margin-left: 24px; }
  }
`;

// Visually hidden (but still technically present/focusable-by-browser)
// style for decoy autofill fields — keeps them off-screen without
// display:none, which some browsers ignore for autofill-targeting purposes.
const DECOY_STYLE = {
  position: "absolute",
  width: "1px",
  height: "1px",
  padding: 0,
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0,0,0,0)",
  whiteSpace: "nowrap",
  border: 0,
};

function PasswordField({ label, value, onChange, placeholder, autoComplete, required }) {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <label>{label}</label>
      <div className="password-field">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          minLength={6}
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setVisible((v) => !v)}
          tabIndex={-1}
          aria-label={visible ? "Hide password" : "Show password"}
          title={visible ? "Hide password" : "Show password"}
        >
          {visible ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
    </>
  );
}

function AuthScreen({ onAuthed, initialMode = "login", onBack }) {
  const [mode, setMode] = useState(initialMode); // "login" | "signup" | "forgot" | "reset"
  const [role, setRole] = useState("buyer");
  const [identifier, setIdentifier] = useState(""); // login: username/email/mobile
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  function switchMode(next) {
    setMode(next);
    // Never carry a typed password across forms — e.g. typing it into
    // Sign up by mistake and then finding it pre-filled on Log in.
    setPassword("");
    setNewPassword("");
    setError(null);
    setInfo(null);
  }

  async function submitLogin(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      if (data.user.role !== role) {
        await fetch("/api/auth/logout", { method: "POST" });
        throw new Error(`This account is registered as a ${data.user.role}. Select "I'm a ${data.user.role === "seller" ? "Seller" : "Buyer"}" above and try again.`);
      }
      onAuthed(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function submitSignup(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role, name, email: email || undefined, mobile: mobile || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      onAuthed(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function submitForgot(e) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setResetToken(data.reset_token);
      setInfo(data.message);
      setMode("reset");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function submitReset(e) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, new_password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setInfo("Password reset. You can log in with your new password now.");
      setMode("login");
      setPassword("");
      setNewPassword("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        {onBack && (
          <button type="button" className="auth-back" onClick={onBack}>← Back to home</button>
        )}
        <div className="auth-brand">Negoti<span>AI</span></div>
        <div className="auth-sub">
          {mode === "login" && "Log in to continue"}
          {mode === "signup" && "Create your account"}
          {mode === "forgot" && "Reset your password"}
          {mode === "reset" && "Set a new password"}
        </div>

        {(mode === "signup" || mode === "login") && (
          <div className="role-toggle">
            <button type="button" className={"role-btn" + (role === "buyer" ? " active" : "")} onClick={() => setRole("buyer")}>
              I'm a Buyer
            </button>
            <button type="button" className={"role-btn" + (role === "seller" ? " active" : "")} onClick={() => setRole("seller")}>
              I'm a Seller
            </button>
          </div>
        )}

        {mode === "login" && (
          <form onSubmit={submitLogin} autoComplete="off">
            {/* Decoy fields absorb the browser's autofill so it doesn't
                overwrite the real fields below with a saved credential. */}
            <input type="text" name="fakeusernameremembered" style={DECOY_STYLE} tabIndex={-1} autoComplete="off" />
            <input type="password" name="fakepasswordremembered" style={DECOY_STYLE} tabIndex={-1} autoComplete="off" />

            <label>Username, Email, or Mobile</label>
            <input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. meridian_retail"
              autoComplete="off"
              required
            />
            <PasswordField
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              autoComplete="off"
              required
            />
            <div style={{ textAlign: "right", marginBottom: "16px", marginTop: "-8px" }}>
              <button type="button" className="link-btn" onClick={() => switchMode("forgot")}>Forgot password?</button>
            </div>
            {error && <div className="error-box">{error}</div>}
            <button className="btn amber" style={{ width: "100%" }} disabled={loading}>
              {loading ? "Please wait..." : "Log In"}
            </button>
          </form>
        )}

        {mode === "signup" && (
          <form onSubmit={submitSignup} autoComplete="off">
            {/* Same decoy trick — a signup form on a domain you've signed up
                on before is exactly where Chrome likes to "help" by filling
                in an old saved password. */}
            <input type="text" name="fakeusernameremembered" style={DECOY_STYLE} tabIndex={-1} autoComplete="off" />
            <input type="password" name="fakepasswordremembered" style={DECOY_STYLE} tabIndex={-1} autoComplete="off" />

            <label>{role === "seller" ? "Company / seller name" : "Your company / name"}</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Meridian Retail Co." autoComplete="off" required />

            <label>Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. meridian_retail" autoComplete="off" required />

            <label>Email <span style={{ color: "var(--text-soft)", fontWeight: 400 }}>(optional)</span></label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" autoComplete="off" />

            <label>Mobile <span style={{ color: "var(--text-soft)", fontWeight: 400 }}>(optional)</span></label>
            <input type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="e.g. 9876543210" autoComplete="off" />

            <PasswordField
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              autoComplete="off"
              required
            />

            {error && <div className="error-box">{error}</div>}
            <button className="btn amber" style={{ width: "100%" }} disabled={loading}>
              {loading ? "Please wait..." : "Sign Up"}
            </button>
          </form>
        )}

        {mode === "forgot" && (
          <form onSubmit={submitForgot}>
            <label>Username, Email, or Mobile</label>
            <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="Enter your account identifier" required />
            {error && <div className="error-box">{error}</div>}
            <button className="btn amber" style={{ width: "100%" }} disabled={loading}>
              {loading ? "Please wait..." : "Send Reset Link"}
            </button>
          </form>
        )}

        {mode === "reset" && (
          <form onSubmit={submitReset}>
            {info && <div className="info-box">{info}</div>}
            <label>Reset Token</label>
            <input value={resetToken} onChange={(e) => setResetToken(e.target.value)} placeholder="Reset token" required />
            <PasswordField
              label="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              autoComplete="new-password"
              required
            />
            {error && <div className="error-box">{error}</div>}
            <button className="btn amber" style={{ width: "100%" }} disabled={loading}>
              {loading ? "Please wait..." : "Reset Password"}
            </button>
          </form>
        )}

        <div className="auth-switch">
          {mode === "login" && (
            <>Don't have an account? <button onClick={() => switchMode("signup")}>Sign up</button></>
          )}
          {(mode === "signup" || mode === "forgot" || mode === "reset") && (
            <>Already have an account? <button onClick={() => switchMode("login")}>Log in</button></>
          )}
        </div>
      </div>
    </div>
  );
}

function LandingPage({ onLogin, onSignup }) {
  const features = [
    { icon: "⚡", title: "Instant itemized quotes", desc: "Buyers pick a product and quantity and get a full quote in seconds — unit price, bulk discount, and total. No back-and-forth emails." },
    { icon: "🤝", title: "AI negotiates within your rules", desc: "Every seller gets an always-on negotiation agent. Buyers haggle in plain language; the agent counters or accepts — but never goes below the floor you set." },
    { icon: "🧾", title: "Pipeline, invoices & ledger", desc: "Confirmed deals flow into a kanban pipeline, turn into invoices in one click, and reconcile live into your revenue and dues ledger." },
  ];

  return (
    <div className="landing">
      <nav className="landing-nav">
        <div className="brand">Negoti<span>AI</span></div>
        <div className="nav-actions">
          <button className="btn ghost" onClick={onLogin}>Log in</button>
          <button className="btn amber" onClick={onSignup}>Get started</button>
        </div>
      </nav>

      <header className="hero">
        <div>
          <div className="hero-eyebrow">B2B quotes · Negotiation · Invoicing</div>
          <h1 className="hero-title">Your storefront gets an AI that <em>negotiates</em> for you.</h1>
          <p className="hero-sub">
            NegotiAI connects buyers and sellers of any kind of goods — stationery, groceries,
            restaurant supplies, electricals, anything sold in bulk. Buyers get instant quotes and
            haggle in plain language; sellers set the rules once and let their agent close deals
            around the clock.
          </p>
          <div className="hero-ctas">
            <button className="btn amber lg" onClick={onSignup}>Create a free account</button>
            <button className="btn ghost lg" onClick={onLogin}>I already have an account</button>
          </div>
          <p className="hero-note">Free to join · 0% commission · Rules you control</p>
        </div>
        <div className="hero-visual">
          <div className="hero-chat">
            <div className="hero-chat-head"><span className="hero-chat-dot" /> Live negotiation</div>
            <div className="msg buyer">Can you do ₹85/unit if I take 500?</div>
            <div className="msg agent">
              <div className="action-badge counter">counter</div>
              <div>I can offer ₹88/unit at 500 units — that's 12% off list price, our best at this volume.</div>
            </div>
            <div className="msg buyer">Deal. Send the invoice.</div>
            <div className="msg agent">
              <div className="action-badge accept">accept</div>
              <div>Confirmed — 500 units at ₹88/unit. Your invoice is ready. 🤝</div>
            </div>
          </div>
          <div className="hero-quote-float">
            <div className="quote-line"><span>Corrugated Box L</span><span>500 units</span></div>
            <div className="quote-line"><span>Unit price</span><span>₹88</span></div>
            <div className="total">Total: ₹44,000</div>
          </div>
        </div>
      </header>

      <section className="land-section">
        <div className="land-kicker">Everything in one place</div>
        <h2 className="land-h2">From first quote to final payment</h2>
        <p className="land-lede">
          NegotiAI covers the whole B2B deal lifecycle — quoting, negotiating, order tracking,
          invoicing, and collections — so you don't need five tools and a spreadsheet.
        </p>
        <div className="feature-grid">
          {features.map((f) => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="cta-band">
        <div className="cta-band-inner">
          <h2>Stop losing deals to slow quotes.</h2>
          <p>Join NegotiAI free — as a buyer or a seller — and let the agent handle the haggling.</p>
          <button className="btn amber lg" onClick={onSignup}>Get started free</button>
        </div>
      </div>

      <footer className="landing-footer">
        <div className="brand">Negoti<span>AI</span></div>
        <div>B2B Quote & Negotiation Agent · Built for direct buyer–seller trade</div>
      </footer>
    </div>
  );
}

function MessageIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function Topbar({ user, tab, setTab, onLogout, newOrderCount, unreadMessages }) {
  const tabsByPortal = {
    buyer: [
      { id: "rfq", label: "Request Quote" },
      { id: "negotiate", label: "Negotiate" },
      { id: "orders", label: "My Orders" },
    ],
    seller: [
      { id: "setup", label: "Seller Setup" },
      { id: "pipeline", label: "Pipeline" },
      { id: "finance", label: "Finance" },
      { id: "audit", label: "Audit Log" },
    ],
  };
  const tabs = tabsByPortal[user.role];

  return (
    <div className="topbar">
      <div className="topbar-row">
        <div className="brand">Negoti<span>AI</span></div>
        <div className="user-chip">
          <span>{user.name} · {user.role === "seller" ? "Seller" : "Buyer"}</span>
          <button className="logout-btn" onClick={onLogout}>Log out</button>
        </div>
      </div>
      <div className="tabs-row">
        <div className="tabs">
          {tabs.map((t) => (
            <button
              key={t.id}
              className={"tab" + (tab === t.id ? " active" : "")}
              onClick={() => setTab(t.id)}
            >
              {t.label}
              {t.id === "pipeline" && newOrderCount > 0 && <span className="tab-badge">{newOrderCount}</span>}
            </button>
          ))}
        </div>
        <button
          className={"tab msgs-tab" + (tab === "messages" ? " active" : "")}
          onClick={() => setTab("messages")}
        >
          <MessageIcon />
          Messages
          {unreadMessages > 0 && <span className="tab-badge">{unreadMessages}</span>}
        </button>
      </div>
    </div>
  );
}

function SellerSetup({ catalog, rules, shopDescription, onSaved }) {
  const [localCatalog, setLocalCatalog] = useState(catalog);
  const [localRules, setLocalRules] = useState(rules);
  const [localDescription, setLocalDescription] = useState(shopDescription || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newStock, setNewStock] = useState("");
  const [addingProduct, setAddingProduct] = useState(false);
  const [addError, setAddError] = useState(null);

  useEffect(() => setLocalCatalog(catalog), [catalog]);
  useEffect(() => setLocalRules(rules), [rules]);
  useEffect(() => setLocalDescription(shopDescription || ""), [shopDescription]);

  function updateProduct(id, field, value) {
    setLocalCatalog((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
    setSaved(false);
  }

  function updateTier(index, field, value) {
    setLocalRules((prev) => ({
      ...prev,
      bulk_discount_tiers: prev.bulk_discount_tiers.map((t, i) => (i === index ? { ...t, [field]: value } : t)),
    }));
    setSaved(false);
  }

  async function addProduct(e) {
    e.preventDefault();
    if (!newName.trim() || !newPrice || !newStock) {
      setAddError("Name, price, and stock are all required.");
      return;
    }
    setAddingProduct(true);
    setAddError(null);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), base_price: Number(newPrice), stock: Number(newStock) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add product");
      setLocalCatalog(data.catalog);
      setNewName("");
      setNewPrice("");
      setNewStock("");
      onSaved?.();
    } catch (err) {
      setAddError(err.message);
    } finally {
      setAddingProduct(false);
    }
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          catalog: localCatalog,
          shop_description: localDescription,
          min_margin_percent: Number(localRules.min_margin_percent),
          max_discount_percent: Number(localRules.max_discount_percent),
          bulk_discount_tiers: localRules.bulk_discount_tiers.map((t) => ({
            min_qty: Number(t.min_qty),
            extra_discount: Number(t.extra_discount),
          })),
          payment_terms_allowed: localRules.payment_terms_allowed,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSaved(true);
      onSaved?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!localRules) return <div className="main"><p className="panel-sub">Loading...</p></div>;

  return (
    <div className="main">
      <h2 className="panel-title">Seller Setup</h2>
      <p className="panel-sub">Edit your price list and negotiation boundaries. The negotiation agent will never go outside these rules — change a rule here and it takes effect on the next negotiation message.</p>

      <div className="card">
        <h3 style={{ fontFamily: "Fraunces, serif", fontSize: "16px", margin: "0 0 4px" }}>Shop Profile</h3>
        <p style={{ fontSize: "13px", color: "var(--text-soft)", margin: "0 0 14px" }}>
          A short line buyers see under your name on the marketplace. Describe what you sell.
        </p>
        <label>Shop description</label>
        <textarea
          className="shop-desc-input"
          value={localDescription}
          onChange={(e) => { setLocalDescription(e.target.value); setSaved(false); }}
          placeholder="e.g. Office stationery and school supplies in bulk — notebooks, pens, and desk essentials."
          maxLength={200}
          rows={2}
        />
        <div style={{ fontSize: "11px", color: "var(--text-soft)", textAlign: "right", marginTop: "-8px" }}>
          {localDescription.length}/200
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontFamily: "Fraunces, serif", fontSize: "16px", margin: "0 0 14px" }}>Your Products</h3>
        {localCatalog.map((p) => (
          <div key={p.id} className="edit-row">
            <div className="edit-row-label">
              {p.name} <span style={{ color: "var(--text-soft)" }}>({p.sku})</span>
            </div>
            <div className="edit-row-fields">
              <div>
                <label style={{ marginBottom: "4px" }}>Price (₹)</label>
                <input
                  type="number"
                  value={p.base_price}
                  onChange={(e) => updateProduct(p.id, "base_price", e.target.value)}
                  style={{ marginBottom: 0 }}
                />
              </div>
              <div>
                <label style={{ marginBottom: "4px" }}>Stock</label>
                <input
                  type="number"
                  value={p.stock}
                  onChange={(e) => updateProduct(p.id, "stock", e.target.value)}
                  style={{ marginBottom: 0 }}
                />
              </div>
            </div>
          </div>
        ))}

        <form onSubmit={addProduct} className="add-product-row">
          <div>
            <label style={{ marginBottom: "4px" }}>New product name</label>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Bubble Wrap Roll" style={{ marginBottom: 0 }} />
          </div>
          <div>
            <label style={{ marginBottom: "4px" }}>Price (₹)</label>
            <input type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} style={{ marginBottom: 0, width: "110px" }} />
          </div>
          <div>
            <label style={{ marginBottom: "4px" }}>Stock</label>
            <input type="number" value={newStock} onChange={(e) => setNewStock(e.target.value)} style={{ marginBottom: 0, width: "110px" }} />
          </div>
          <button className="btn" disabled={addingProduct}>{addingProduct ? "Adding..." : "+ Add Product"}</button>
        </form>
        {addError && <div className="error-box" style={{ marginTop: "12px" }}>{addError}</div>}
      </div>

      <div className="card">
        <h3 style={{ fontFamily: "Fraunces, serif", fontSize: "16px", margin: "0 0 14px" }}>Negotiation Rules</h3>

        <div className="row">
          <div>
            <label>Minimum margin (%)</label>
            <input
              type="number"
              value={localRules.min_margin_percent}
              onChange={(e) => { setLocalRules({ ...localRules, min_margin_percent: e.target.value }); setSaved(false); }}
            />
          </div>
          <div>
            <label>Maximum discount (%)</label>
            <input
              type="number"
              value={localRules.max_discount_percent}
              onChange={(e) => { setLocalRules({ ...localRules, max_discount_percent: e.target.value }); setSaved(false); }}
            />
          </div>
        </div>

        <label>Bulk discount tiers</label>
        {localRules.bulk_discount_tiers.map((t, i) => (
          <div className="row" key={i} style={{ marginBottom: "12px" }}>
            <div>
              <input
                type="number"
                value={t.min_qty}
                onChange={(e) => updateTier(i, "min_qty", e.target.value)}
                style={{ marginBottom: 0 }}
                placeholder="Min qty"
              />
            </div>
            <div>
              <input
                type="number"
                value={t.extra_discount}
                onChange={(e) => updateTier(i, "extra_discount", e.target.value)}
                style={{ marginBottom: 0 }}
                placeholder="Extra discount %"
              />
            </div>
          </div>
        ))}

        <label>Accepted payment terms (comma-separated)</label>
        <input
          value={localRules.payment_terms_allowed.join(", ")}
          onChange={(e) => {
            setLocalRules({ ...localRules, payment_terms_allowed: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) });
            setSaved(false);
          }}
        />

        {error && <div className="error-box">{error}</div>}

        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginTop: "6px" }}>
          <button className="btn amber" onClick={save} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
          {saved && <span style={{ color: "var(--success)", fontSize: "13px" }}>✓ Saved</span>}
        </div>
      </div>
    </div>
  );
}

// Word-prefix matching for marketplace search: the query must start at a
// word boundary, so "rice" matches "Basmati Rice" but NOT "prices", while
// partial typing still works ("statio" matches "Stationery").
function textMatches(text, query) {
  if (!text || !query) return false;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp("\\b" + escaped, "i").test(text);
}

function RFQForm({ onQuoteCreated }) {
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [quantity, setQuantity] = useState(100);
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState(null);
  const [quote, setQuote] = useState(null);

  // Two-level marketplace: a shops directory, then one shop's products.
  const [openSellerId, setOpenSellerId] = useState(null);
  const [shopQuery, setShopQuery] = useState("");
  const [productQuery, setProductQuery] = useState("");
  const [sortBy, setSortBy] = useState("featured");
  const [inStockOnly, setInStockOnly] = useState(false);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => setProducts(data.products || []))
      .catch(() => {})
      .finally(() => setLoadingProducts(false));
  }, []);

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const isValid = selectedProductId && Number(quantity) > 0;

  function selectProduct(id) {
    setSelectedProductId(id);
    setQuote(null);
    setError(null);
  }

  function openShop(sellerId) {
    setOpenSellerId(sellerId);
    setSelectedProductId(null);
    setQuote(null);
    setError(null);
    setProductQuery("");
    setSortBy("featured");
    setInStockOnly(false);
  }

  function backToShops() {
    setOpenSellerId(null);
    setSelectedProductId(null);
    setQuote(null);
    setError(null);
  }

  async function submitRFQ(e) {
    e.preventDefault();
    if (!isValid) {
      setError("Please select a product and quantity.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: selectedProductId, quantity: Number(quantity) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get quote");
      setQuote(data);
      onQuoteCreated(data.deal_id);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Group products by seller into shop objects, with price range + count.
  const shopsById = products.reduce((acc, p) => {
    if (!acc[p.seller_id]) {
      acc[p.seller_id] = {
        seller_id: p.seller_id,
        seller_name: p.seller_name,
        description: p.seller_description,
        verified: p.seller_verified,
        completed: p.seller_completed_deals,
        products: [],
      };
    }
    acc[p.seller_id].products.push(p);
    return acc;
  }, {});
  const shops = Object.values(shopsById).map((s) => {
    const prices = s.products.map((p) => p.base_price);
    return { ...s, count: s.products.length, priceMin: Math.min(...prices), priceMax: Math.max(...prices) };
  });

  const header = (
    <>
      <h2 className="panel-title">Browse & Request a Quote</h2>
      <p className="panel-sub">Buy direct from any seller on the marketplace — no marketplace commissions, no middleman. Pick a shop, choose a product, and get an instant, itemized quote.</p>
    </>
  );

  if (loadingProducts && products.length === 0) {
    return <div className="main">{header}<div className="card"><p className="empty" style={{ padding: "8px 0" }}>Loading the marketplace...</p></div></div>;
  }
  if (!loadingProducts && products.length === 0) {
    return <div className="main">{header}<div className="card"><p className="empty" style={{ padding: "8px 0" }}>No sellers have listed products yet.</p></div></div>;
  }

  // ---- Shop detail view ----
  const openShopObj = shops.find((s) => s.seller_id === openSellerId);
  if (openShopObj) {
    let shopProducts = openShopObj.products;
    const q = productQuery.trim();
    if (q) shopProducts = shopProducts.filter((p) => textMatches(p.name, q) || textMatches(p.sku, q));
    if (inStockOnly) shopProducts = shopProducts.filter((p) => p.stock > 0);
    if (sortBy === "price_asc") shopProducts = [...shopProducts].sort((a, b) => a.base_price - b.base_price);
    else if (sortBy === "price_desc") shopProducts = [...shopProducts].sort((a, b) => b.base_price - a.base_price);
    else if (sortBy === "name") shopProducts = [...shopProducts].sort((a, b) => a.name.localeCompare(b.name));

    return (
      <div className="main">
        <button className="back-link" onClick={backToShops}>← All shops</button>

        <div className="shop-header">
          <div className="seller-group-info">
            <h2 className="panel-title" style={{ margin: 0 }}>{openShopObj.seller_name}</h2>
            {openShopObj.description && <p className="seller-group-desc" style={{ fontSize: "14px", marginTop: "4px" }}>{openShopObj.description}</p>}
          </div>
          <span className={"trust-badge" + (openShopObj.verified ? " verified" : "")}>
            {openShopObj.verified ? "✓ Verified Seller" : "New Seller"}
            {openShopObj.completed > 0 && ` · ${openShopObj.completed} completed deal${openShopObj.completed === 1 ? "" : "s"}`}
          </span>
        </div>

        <div className="marketplace-toolbar">
          <div className="search-field">
            <span className="search-icon">⌕</span>
            <input
              className="search-input"
              value={productQuery}
              onChange={(e) => setProductQuery(e.target.value)}
              placeholder="Search products in this shop..."
            />
          </div>
          <select className="filter-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="featured">Sort: Featured</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="name">Name: A–Z</option>
          </select>
          <label className="filter-check">
            <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} />
            In stock only
          </label>
        </div>

        {shopProducts.length === 0 ? (
          <div className="card"><p className="empty" style={{ padding: "8px 0" }}>No products match your search or filters in this shop.</p></div>
        ) : (
          <div className="product-grid">
            {shopProducts.map((p) => (
              <div
                key={p.id}
                className={"product-card" + (selectedProductId === p.id ? " selected" : "") + (p.stock === 0 ? " out-of-stock" : "")}
                onClick={() => selectProduct(p.id)}
              >
                <div className="product-name">{p.name}</div>
                <div className="product-sku">{p.sku}</div>
                <div className="product-price">₹{p.base_price}<span>/unit</span></div>
                <div className="product-stock">{p.stock > 0 ? `${p.stock.toLocaleString()} in stock` : "Out of stock"}</div>
              </div>
            ))}
          </div>
        )}

        {selectedProduct && selectedProduct.seller_id === openSellerId && (
          <div className="card inline-rfq-card">
            <h3 style={{ fontFamily: "Fraunces, serif", fontSize: "16px", margin: "0 0 14px" }}>
              Request Quote — {selectedProduct.name}
            </h3>
            <form onSubmit={submitRFQ}>
              <label>Quantity <span className="required-mark">*</span></label>
              <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />

              {error && <div className="error-box">{error}</div>}
              <button className="btn amber" disabled={loading || !isValid}>{loading ? "Generating..." : "Get Instant Quote"}</button>
            </form>

            {quote && quote.deal_id && selectedProduct.id === selectedProductId && (
              <div className="quote-card" style={{ marginTop: "18px" }}>
                <div className="quote-line"><span>{quote.quote.product_name}</span><span>{quote.quote.quantity} units</span></div>
                <div className="quote-line"><span>Unit price</span><span>₹{quote.quote.unit_price}</span></div>
                <div className="quote-line"><span>Discount applied</span><span>{quote.quote.discount_percent}%</span></div>
                <div className="total">Total: ₹{quote.quote.total.toLocaleString()}</div>
                <p style={{ fontSize: "13px", color: "var(--text-soft)", marginTop: "14px" }}>
                  Want a better price? Head to the <strong>Negotiate</strong> tab to talk directly with the seller's AI agent.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ---- Shops directory view ----
  const sq = shopQuery.trim();
  const visibleShops = sq
    ? shops.filter(
        (s) =>
          textMatches(s.seller_name, sq) ||
          textMatches(s.description, sq) ||
          s.products.some((p) => textMatches(p.name, sq))
      )
    : shops;

  return (
    <div className="main">
      {header}

      <div className="marketplace-toolbar">
        <div className="search-field">
          <span className="search-icon">⌕</span>
          <input
            className="search-input"
            value={shopQuery}
            onChange={(e) => setShopQuery(e.target.value)}
            placeholder="Search shops or products — e.g. rice, stationery, LED..."
          />
        </div>
      </div>

      {visibleShops.length === 0 ? (
        <div className="card"><p className="empty" style={{ padding: "8px 0" }}>No shops match “{shopQuery}”. Try a different search.</p></div>
      ) : (
        <div className="shop-grid">
          {visibleShops.map((s) => (
            <div key={s.seller_id} className="shop-card" onClick={() => openShop(s.seller_id)}>
              <div className="shop-card-head">
                <span className="shop-card-name">{s.seller_name}</span>
                <span className={"trust-badge" + (s.verified ? " verified" : "")}>
                  {s.verified ? "✓ Verified" : "New"}
                </span>
              </div>
              {s.description && <p className="shop-card-desc">{s.description}</p>}
              <div className="shop-card-meta">
                <span>{s.count} product{s.count === 1 ? "" : "s"}</span>
                <span>·</span>
                <span>{s.priceMin === s.priceMax ? `₹${s.priceMin}` : `₹${s.priceMin.toLocaleString()}–₹${s.priceMax.toLocaleString()}`}</span>
              </div>
              <div className="shop-card-cta">Browse shop →</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NegotiationChat({ deals, dealId, onSelectDeal, refreshDeals }) {
  const [deal, setDeal] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const chatAreaRef = useRef(null);

  // Anything quoted can be negotiated — confirmed deals stay listed so the
  // buyer can re-read how a deal closed.
  const negotiable = deals.filter((d) => ["quote_sent", "negotiating", "confirmed"].includes(d.status));

  async function loadDeal(id) {
    const res = await fetch(`/api/deals/${id}`);
    const data = await res.json();
    if (res.ok) setDeal(data.deal);
  }

  useEffect(() => {
    if (dealId) loadDeal(dealId);
    else setDeal(null);
  }, [dealId]);

  // Default to the most recent quote so the tab is never a dead end.
  useEffect(() => {
    if (!dealId && negotiable.length > 0) onSelectDeal(negotiable[0].id);
  }, [dealId, negotiable.length]);

  useEffect(() => {
    // Scroll only the chat box itself, never the page — using scrollIntoView
    // here would try to center the new message in the whole viewport,
    // dragging the entire page (topbar included) down with it.
    const el = chatAreaRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [deal?.history?.length]);

  async function sendMessage(e) {
    e.preventDefault();
    if (!message.trim() || !dealId) return;
    setLoading(true);
    setError(null);
    const outgoing = message;
    setMessage("");
    try {
      const res = await fetch("/api/negotiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deal_id: dealId, buyer_message: outgoing }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Negotiation failed");
      await loadDeal(dealId);
      refreshDeals?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // One-click openers — negotiation is the core of the product, so make the
  // first ask effortless. Clicking fills the input; the buyer still hits Send.
  const SUGGESTIONS = [
    "Can you do 10% off on this order?",
    "What's your best price if I double the quantity?",
    "Any discount if I pay in advance?",
  ];

  const savings =
    deal?.quote?.base_price && deal?.quote?.quantity && deal?.quote?.total
      ? Math.max(0, +(deal.quote.base_price * deal.quote.quantity - deal.quote.total).toFixed(2))
      : 0;

  return (
    <div className="main">
      <h2 className="panel-title">Negotiate</h2>
      <p className="panel-sub">The heart of NegotiAI — haggle over any quote in plain language. The seller's AI agent replies instantly and never steps outside the seller's rules.</p>

      {negotiable.length === 0 ? (
        <div className="card">
          <p className="empty" style={{ padding: "8px 0" }}>
            No quotes to negotiate yet. Browse the marketplace, request a quote on anything — then come back here and push for a better price.
          </p>
        </div>
      ) : (
        <div className="messages-layout">
          <div className="conv-list">
            {negotiable.map((d) => (
              <div
                key={d.id}
                className={"conv-item" + (d.id === dealId ? " active" : "")}
                onClick={() => onSelectDeal(d.id)}
              >
                <div className="conv-name">
                  <span>{d.quote?.product_name || d.sku}</span>
                  <span className="conv-time">
                    {d.status === "confirmed" ? "✓ closed" : d.status === "negotiating" ? "negotiating" : "quote sent"}
                  </span>
                </div>
                <div className="conv-product">{d.quote?.quantity} units · ₹{d.quote?.total?.toLocaleString()}</div>
                {d.quote?.discount_percent > 0 && (
                  <div className="conv-preview">{d.quote.discount_percent}% off negotiated so far</div>
                )}
              </div>
            ))}
          </div>

          <div className="thread-pane">
            {deal ? (
              <>
                <div className="thread-head">
                  <div className="thread-title">{deal.quote?.product_name || deal.sku}</div>
                  <div className="thread-meta">
                    {deal.quote?.quantity} units · ₹{deal.quote?.unit_price}/unit · Total ₹{deal.quote?.total?.toLocaleString()}
                  </div>
                  {savings > 0 && (
                    <div className="neg-savings">
                      You've negotiated {deal.quote.discount_percent}% off — saving ₹{savings.toLocaleString()} vs list price
                    </div>
                  )}
                </div>

                <div className="chat-area" ref={chatAreaRef} style={{ flex: 1, minHeight: "200px" }}>
                  {(!deal.history || deal.history.length === 0) && !loading && (
                    <div className="empty" style={{ margin: "auto" }}>
                      No messages yet — open with one of the asks below, or write your own.
                    </div>
                  )}
                  {deal.history?.map((h, i) => (
                    <div key={i} className={"msg " + h.role}>
                      {h.role === "agent" && h.action && (
                        <div className={"action-badge " + h.action}>
                          {h.action === "confirm_pending" ? "confirm?" : h.action}
                        </div>
                      )}
                      <div>{h.message}</div>
                      {h.reasoning && (
                        <div className="reasoning-stamp">
                          ⎯ {h.reasoning}
                          {h.provider && <span style={{ opacity: 0.6 }}> · via {h.provider}</span>}
                        </div>
                      )}
                    </div>
                  ))}
                  {loading && <div className="thinking">Agent is evaluating your request...</div>}
                </div>

                {error && <div className="error-box">{error}</div>}

                {deal.status !== "confirmed" && (
                  <div className="suggest-row">
                    {SUGGESTIONS.map((s) => (
                      <button key={s} type="button" className="suggest-chip" onClick={() => setMessage(s)}>
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                <form className="chat-input-row" onSubmit={sendMessage}>
                  <input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="e.g. Can you do 12% off for this order?"
                    disabled={loading || deal.status === "confirmed"}
                  />
                  <button className="btn amber" disabled={loading || deal.status === "confirmed"}>Send</button>
                </form>
                {deal.status === "confirmed" && (
                  <p style={{ fontSize: "13px", color: "var(--success)", marginTop: "10px" }}>
                    ✓ Deal confirmed at ₹{deal.quote?.total?.toLocaleString()}. Track it under My Orders.
                  </p>
                )}
              </>
            ) : (
              <div className="thread-empty">Pick a quote on the left to start negotiating.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function InvoicePreview({ dealId, onClose }) {
  const [invoice, setInvoice] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`/api/deals/${dealId}/invoice`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setInvoice(data.invoice);
      })
      .catch(() => setError("Failed to load invoice"));
  }, [dealId]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="invoice-sheet" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose} aria-label="Close">✕</button>

        {error && <div className="error-box">{error}</div>}

        {invoice && (
          <>
            <div className="invoice-head">
              <div>
                <div className="brand">Negoti<span style={{ color: "var(--amber)" }}>AI</span></div>
                <div style={{ fontSize: "12px", color: "var(--text-soft)", marginTop: "4px" }}>Tax Invoice</div>
              </div>
              <div className="meta">
                <div>{invoice.invoice_number}</div>
                <div>{new Date(invoice.invoiced_at).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}</div>
                <div style={{ marginTop: "8px" }}>Bill To: {invoice.buyer_name}</div>
              </div>
            </div>

            <table className="invoice-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Original Price</th>
                  <th>Discounted Price</th>
                  <th>Discount</th>
                  <th style={{ textAlign: "right" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.line_items.map((li, i) => (
                  <tr key={i}>
                    <td>{li.description} <span style={{ color: "var(--text-soft)" }}>({li.sku})</span></td>
                    <td>{li.quantity}</td>
                    <td style={{ color: "var(--text-soft)", textDecoration: li.discount_percent > 0 ? "line-through" : "none" }}>₹{li.original_unit_price}</td>
                    <td>₹{li.unit_price}</td>
                    <td>{li.discount_percent}%</td>
                    <td style={{ textAlign: "right" }}>₹{li.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {invoice.total_savings > 0 && (
              <div style={{ textAlign: "right", fontSize: "12px", color: "var(--success)", marginBottom: "4px" }}>
                You saved ₹{invoice.total_savings.toLocaleString()} vs. original pricing
              </div>
            )}

            <div className="invoice-total-row">
              <span style={{ color: "var(--text-soft)", alignSelf: "center" }}>Total Due</span>
              <span className="amount">₹{invoice.total.toLocaleString()}</span>
            </div>

            <button className="btn print-btn" onClick={() => window.print()}>Print / Save as PDF</button>
          </>
        )}
      </div>
    </div>
  );
}

function timeAgo(isoString) {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// A quote/negotiation with no buyer activity in this window is flagged as an
// at-risk lead needing follow-up — the B2B equivalent of cart abandonment.
const STALE_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes, tuned for live demos

function isStale(deal) {
  if (deal.status !== "quote_sent" && deal.status !== "negotiating") return false;
  return Date.now() - new Date(deal.last_activity_at).getTime() > STALE_THRESHOLD_MS;
}

function MessagesView({ user, initialDealId }) {
  const [conversations, setConversations] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [activeId, setActiveId] = useState(initialDealId || null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const boxRef = useRef(null);

  async function loadConversations() {
    const res = await fetch("/api/conversations");
    const data = await res.json();
    if (res.ok) setConversations(data.conversations || []);
    setLoaded(true);
  }

  async function loadMessages(dealId) {
    const res = await fetch(`/api/deals/${dealId}/messages`);
    const data = await res.json();
    if (res.ok) setMessages(data.messages || []);
  }

  useEffect(() => {
    loadConversations();
  }, []);

  // Light polling keeps the open thread and list previews fresh while the
  // other party replies — same lean stand-in for push used elsewhere.
  useEffect(() => {
    if (activeId) loadMessages(activeId);
    const interval = setInterval(() => {
      loadConversations();
      if (activeId) loadMessages(activeId);
    }, 12000);
    return () => clearInterval(interval);
  }, [activeId]);

  useEffect(() => {
    if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight;
  }, [messages.length]);

  const active = conversations.find((c) => c.deal_id === activeId);

  async function send(e) {
    e.preventDefault();
    if (!text.trim() || !activeId) return;
    setSending(true);
    setError(null);
    const outgoing = text.trim();
    setText("");
    try {
      const res = await fetch(`/api/deals/${activeId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: outgoing }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send");
      await loadMessages(activeId);
      await loadConversations();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="main">
      <h2 className="panel-title">Messages</h2>
      <p className="panel-sub">
        Direct, human-to-human messages with {user.role === "buyer" ? "sellers" : "buyers"} — one thread per order,
        separate from the AI negotiation.
      </p>

      {loaded && conversations.length === 0 ? (
        <div className="card">
          <p className="empty" style={{ padding: "8px 0" }}>
            No conversations yet. {user.role === "buyer"
              ? "Once you request a quote, you can message that seller here."
              : "Once a buyer places an order, their thread will show up here."}
          </p>
        </div>
      ) : (
        <div className="messages-layout">
          <div className="conv-list">
            {conversations.map((c) => (
              <div
                key={c.deal_id}
                className={"conv-item" + (c.deal_id === activeId ? " active" : "")}
                onClick={() => setActiveId(c.deal_id)}
              >
                <div className="conv-name">
                  <span>{c.counterparty_name}</span>
                  {c.last_message && <span className="conv-time">{timeAgo(c.last_message.at)}</span>}
                </div>
                <div className="conv-product">{c.product_name} · {c.quantity} units</div>
                <div className={"conv-preview" + (c.last_message && c.last_message.sender_role !== user.role ? " unread" : "")}>
                  {c.last_message
                    ? `${c.last_message.sender_role === user.role ? "You: " : ""}${c.last_message.message}`
                    : "No messages yet"}
                </div>
              </div>
            ))}
          </div>

          <div className="thread-pane">
            {active ? (
              <>
                <div className="thread-head">
                  <div className="thread-title">{active.counterparty_name}</div>
                  <div className="thread-meta">
                    {active.product_name} · {active.quantity} units · ₹{active.total?.toLocaleString()}
                  </div>
                </div>
                <div className="dm-box" ref={boxRef} style={{ flex: 1, maxHeight: "none" }}>
                  {messages.length === 0 ? (
                    <div className="dm-empty">No messages yet on this order — say hello 👋</div>
                  ) : (
                    messages.map((m) => (
                      <div key={m.id} className={"dm-msg " + (m.sender_role === user.role ? "mine" : "theirs")}>
                        <div className="dm-msg-label">{m.sender_role === "seller" ? "Seller" : "Buyer"}</div>
                        <div>{m.message}</div>
                      </div>
                    ))
                  )}
                </div>
                {error && <div className="error-box">{error}</div>}
                <form className="chat-input-row" onSubmit={send}>
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={user.role === "buyer" ? "e.g. When can you deliver this order?" : "e.g. We're out of stock on this item right now"}
                    disabled={sending}
                  />
                  <button className="btn amber" disabled={sending}>Send</button>
                </form>
              </>
            ) : (
              <div className="thread-empty">Select a conversation on the left to view the thread.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Read-only view of the AI negotiation on a deal, for the seller — shows
// what their agent said to the buyer and the reasoning behind each move.
function NegotiationHistoryModal({ dealId, onClose }) {
  const [deal, setDeal] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`/api/deals/${dealId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setDeal(data.deal);
      })
      .catch(() => setError("Failed to load negotiation"));
  }, [dealId]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="invoice-sheet" style={{ maxWidth: "520px" }} onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose} aria-label="Close">✕</button>
        <h3 style={{ fontFamily: "Fraunces, serif", fontSize: "18px", margin: "0 0 2px" }}>
          Negotiation — {deal?.quote?.product_name || deal?.sku || "..."}
        </h3>
        <p style={{ fontSize: "12px", color: "var(--text-soft)", margin: "0 0 16px" }}>
          {deal ? `${deal.buyer_name} · ${deal.quote?.quantity} units · ₹${deal.quote?.total?.toLocaleString()}` : "Loading..."}
        </p>

        {error && <div className="error-box">{error}</div>}

        <div className="chat-area" style={{ maxHeight: "440px" }}>
          {deal && (!deal.history || deal.history.length === 0) && (
            <div className="empty" style={{ margin: "auto" }}>No negotiation — the buyer took the instant quote as-is.</div>
          )}
          {deal?.history?.map((h, i) => (
            <div key={i} className={"msg " + h.role}>
              {h.role === "agent" && h.action && (
                <div className={"action-badge " + h.action}>
                  {h.action === "confirm_pending" ? "confirm?" : h.action}
                </div>
              )}
              <div>{h.message}</div>
              {h.reasoning && <div className="reasoning-stamp">⎯ {h.reasoning}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Pipeline({ deals, refresh, readOnly, onReorder, onMessage }) {
  const [invoiceDealId, setInvoiceDealId] = useState(null);
  const [negotiationDealId, setNegotiationDealId] = useState(null);
  const columns = [
    { id: "quote_sent", label: "Quote Sent" },
    { id: "negotiating", label: "Negotiating" },
    { id: "confirmed", label: "Confirmed" },
    { id: "invoiced", label: "Invoiced" },
  ];

  const newOrderCount = !readOnly ? deals.filter((d) => !d.seller_acknowledged).length : 0;
  const confirmedOrders = deals.filter((d) => d.status === "confirmed" || d.status === "invoiced");
  const OVERDUE_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours, tuned for real use (vs. the 10-min lead-staleness window)

  function isOverdue(d) {
    return d.status === "invoiced" && d.payment_status !== "paid" && Date.now() - new Date(d.invoiced_at).getTime() > OVERDUE_THRESHOLD_MS;
  }

  async function markInvoiced(id) {
    await fetch(`/api/deals/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "invoiced" }),
    });
    refresh();
  }

  async function acknowledge(id) {
    await fetch(`/api/deals/${id}/acknowledge`, { method: "POST" });
    refresh();
  }

  async function markPaid(id) {
    await fetch(`/api/deals/${id}/mark-paid`, { method: "POST" });
    refresh();
  }

  async function sendReminder(id) {
    await fetch(`/api/deals/${id}/send-reminder`, { method: "POST" });
    refresh();
  }

  function handleCardClick(col, id) {
    // Read-only (buyer) view can look at an invoice once it exists, but can
    // never trigger the seller-only action of invoicing a confirmed deal.
    if (col === "confirmed" && !readOnly) markInvoiced(id);
    if (col === "invoiced") setInvoiceDealId(id);
  }

  return (
    <div className="main">
      <div className="storefront-head">
        <div>
          <h2 className="panel-title">{readOnly ? "My Orders" : "Deal Pipeline"}</h2>
          <p className="panel-sub">
            {readOnly
              ? "Track the status of every order you've requested, from quote to invoice."
              : "Every RFQ and negotiation in one view. Deals flagged \"needs follow-up\" have gone quiet — reach out before you lose the lead."}
          </p>
        </div>
        {newOrderCount > 0 && (
          <div className="new-order-badge">{newOrderCount} new order{newOrderCount === 1 ? "" : "s"}</div>
        )}
      </div>

      {readOnly && deals.length === 0 && (
        <div className="card">
          <p className="empty" style={{ padding: "8px 0" }}>
            No orders yet. Submit a quote request first — your orders will show up here automatically.
          </p>
        </div>
      )}

      <div className="pipeline">
        {columns.map((col) => (
          <div key={col.id} className={"pcol " + col.id}>
            <h4>{col.label}</h4>
            {deals.filter((d) => d.status === col.id).length === 0 && (
              <div className="empty">No deals here</div>
            )}
            {deals.filter((d) => d.status === col.id).map((d) => (
              <div
                key={d.id}
                className={"deal-card" + (readOnly && col.id !== "invoiced" ? " read-only" : "")}
                onClick={() => handleCardClick(col.id, d.id)}
                title={
                  col.id === "confirmed" && !readOnly
                    ? "Click to mark as invoiced"
                    : col.id === "invoiced"
                    ? "Click to view invoice"
                    : ""
                }
              >
                <div className="dc-top">
                  <div className="dc-name">{readOnly ? (d.quote?.product_name || d.sku) : d.buyer_name}</div>
                  {!readOnly && !d.seller_acknowledged && <span className="lead-flag new">New</span>}
                  {!readOnly && d.seller_acknowledged && col.id === "invoiced" && isOverdue(d) && <span className="lead-flag">Overdue</span>}
                  {!readOnly && d.seller_acknowledged && col.id !== "invoiced" && isStale(d) && <span className="lead-flag">Needs follow-up</span>}
                </div>
                <div className="dc-sku">{d.sku}</div>
                <div className="amt">{d.quote?.quantity} units · ₹{d.quote?.total?.toLocaleString()}</div>
                {col.id === "invoiced" && (
                  <span className={"payment-badge " + d.payment_status}>
                    {d.payment_status === "paid" ? "Paid" : "Unpaid"}
                  </span>
                )}
                {!readOnly && <div className="last-activity">Last activity: {timeAgo(d.last_activity_at)}</div>}

                {!readOnly && (
                  <div className="card-actions">
                    {!d.seller_acknowledged && (
                      <button className="card-btn" onClick={(e) => { e.stopPropagation(); acknowledge(d.id); }}>Acknowledge</button>
                    )}
                    {col.id === "invoiced" && d.payment_status !== "paid" && (
                      <>
                        <button className="card-btn" onClick={(e) => { e.stopPropagation(); markPaid(d.id); }}>Mark paid</button>
                        <button className="card-btn" onClick={(e) => { e.stopPropagation(); sendReminder(d.id); }}>Send reminder</button>
                      </>
                    )}
                    <button className="card-btn" onClick={(e) => { e.stopPropagation(); setNegotiationDealId(d.id); }}>Negotiation</button>
                    {onMessage && (
                      <button className="card-btn" onClick={(e) => { e.stopPropagation(); onMessage(d.id); }}>Message</button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {readOnly && confirmedOrders.length > 0 && (
        <div className="card" style={{ marginTop: "28px" }}>
          <h3 style={{ fontFamily: "Fraunces, serif", fontSize: "16px", margin: "0 0 4px" }}>Confirmed Orders</h3>
          <p style={{ fontSize: "13px", color: "var(--text-soft)", margin: "0 0 16px" }}>
            Every deal you've closed — view the invoice, reorder the same quantity, or message the seller directly.
          </p>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {confirmedOrders.map((d) => (
                  <tr key={d.id}>
                    <td className="emphasis" style={{ fontFamily: "Inter, sans-serif" }}>{d.quote?.product_name || d.sku}</td>
                    <td>{d.quote?.quantity}</td>
                    <td>₹{d.quote?.unit_price}</td>
                    <td className="emphasis">₹{d.quote?.total?.toLocaleString()}</td>
                    <td>
                      {d.status === "invoiced" ? (
                        <span className={"payment-badge " + d.payment_status} style={{ marginLeft: 0 }}>
                          {d.payment_status === "paid" ? "Paid" : "Invoiced · Unpaid"}
                        </span>
                      ) : (
                        <span className="payment-badge confirmed" style={{ marginLeft: 0 }}>Confirmed</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        {d.status === "invoiced" && (
                          <button className="card-btn" onClick={() => setInvoiceDealId(d.id)}>View invoice</button>
                        )}
                        {onReorder && (
                          <button className="card-btn" onClick={() => onReorder(d.product_id, d.quote.quantity)}>Reorder</button>
                        )}
                        {onMessage && (
                          <button className="card-btn" onClick={() => onMessage(d.id)}>Message seller</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {invoiceDealId && <InvoicePreview dealId={invoiceDealId} onClose={() => setInvoiceDealId(null)} />}
      {negotiationDealId && <NegotiationHistoryModal dealId={negotiationDealId} onClose={() => setNegotiationDealId(null)} />}
    </div>
  );
}

function FinanceTab() {
  const [stats, setStats] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [statsRes, ledgerRes] = await Promise.all([fetch("/api/revenue"), fetch("/api/ledger")]);
    const statsData = await statsRes.json();
    const ledgerData = await ledgerRes.json();
    setStats(statsData.stats);
    setLedger(ledgerData.ledger || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  if (loading || !stats) return <div className="main"><p className="panel-sub">Loading...</p></div>;

  const totalBilled = stats.total_revenue + stats.outstanding_dues;
  const collectionRate = totalBilled > 0 ? Math.round((stats.total_revenue / totalBilled) * 100) : 100;

  return (
    <div className="main">
      <h2 className="panel-title">Finance</h2>
      <p className="panel-sub">Your revenue, dues, and cash flow — reconciled live from every deal, no spreadsheets.</p>

      <div className="fin-hero">
        <div className="fin-hero-main">
          <div className="fin-hero-label">Collected revenue</div>
          <div className="fin-hero-value">₹{stats.total_revenue.toLocaleString("en-IN")}</div>
          <div className="fin-hero-sub">
            {stats.outstanding_dues > 0
              ? <>₹{stats.outstanding_dues.toLocaleString("en-IN")} still outstanding across your buyers</>
              : <>All invoiced deals are paid up — nothing outstanding</>}
          </div>
        </div>
        <div className="fin-hero-gauge">
          <div className="collection-head">
            <span className="fin-gauge-label">Collection rate</span>
            <span className="collection-pct">{collectionRate}%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${collectionRate}%` }} />
          </div>
          <p className="collection-caption">
            ₹{stats.total_revenue.toLocaleString("en-IN")} collected of ₹{totalBilled.toLocaleString("en-IN")} billed
          </p>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card accent-danger">
          <div className="stat-icon">⏳</div>
          <div className="stat-label">Outstanding Dues</div>
          <div className="stat-value danger">₹{stats.outstanding_dues.toLocaleString("en-IN")}</div>
        </div>
        <div className="stat-card accent-amber">
          <div className="stat-icon">📊</div>
          <div className="stat-label">Pipeline Value</div>
          <div className="stat-value">₹{stats.pipeline_value.toLocaleString("en-IN")}</div>
        </div>
        <div className="stat-card accent-ink">
          <div className="stat-icon">📈</div>
          <div className="stat-label">Avg. Deal Size</div>
          <div className="stat-value">₹{stats.avg_deal_size.toLocaleString("en-IN")}</div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontFamily: "Fraunces, serif", fontSize: "16px", margin: "0 0 16px" }}>Digital Ledger — Dues by Buyer</h3>
        {ledger.length === 0 ? (
          <p className="empty" style={{ padding: "8px 0" }}>No invoiced deals yet — the ledger fills in once orders are invoiced.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Buyer</th>
                <th>Invoices</th>
                <th>Total Invoiced</th>
                <th>Paid</th>
                <th>Outstanding</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((row, i) => (
                <tr key={i}>
                  <td className="emphasis">{row.buyer_name}</td>
                  <td>{row.invoice_count}</td>
                  <td>₹{row.total_invoiced.toLocaleString("en-IN")}</td>
                  <td className="success">₹{row.total_paid.toLocaleString("en-IN")}</td>
                  <td className={row.outstanding > 0 ? "danger" : ""}>₹{row.outstanding.toLocaleString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function AuditLogTab() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/audit-log");
    const data = await res.json();
    setEntries(data.entries || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function exportCsv() {
    const header = "Timestamp,Event,Buyer,SKU,Detail\n";
    const rows = entries.map((e) =>
      [new Date(e.at).toISOString(), e.event_type, e.buyer_name, e.sku, `"${e.detail.replace(/"/g, '""')}"`].join(",")
    );
    const csv = header + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `negotiai-audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <div className="main"><p className="panel-sub">Loading...</p></div>;

  return (
    <div className="main">
      <div className="storefront-head">
        <div>
          <h2 className="panel-title">Audit Log</h2>
          <p className="panel-sub">A transparent, timestamped record of every deal lifecycle event — separate from negotiation chat, for compliance and reconciliation.</p>
        </div>
        {entries.length > 0 && <button className="export-btn" onClick={exportCsv}>Export CSV</button>}
      </div>

      <div className="card">
        {entries.length === 0 ? (
          <p className="empty" style={{ padding: "8px 0" }}>No audit events yet.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Event</th>
                <th>Buyer</th>
                <th>SKU</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id}>
                  <td>{new Date(e.at).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                  <td><span className="audit-event-type">{e.event_type.replace(/_/g, " ")}</span></td>
                  <td>{e.buyer_name}</td>
                  <td>{e.sku}</td>
                  <td style={{ fontFamily: "Inter, sans-serif" }}>{e.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(undefined); // undefined = checking, null = logged out
  const [authMode, setAuthMode] = useState(null); // null = landing page, "login" | "signup" = auth screen
  const [tab, setTab] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [rules, setRules] = useState(null);
  const [shopDescription, setShopDescription] = useState("");
  const [activeDealId, setActiveDealId] = useState(null);
  const [deals, setDeals] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [messagesDealId, setMessagesDealId] = useState(null);

  async function loadConversations() {
    const res = await fetch("/api/conversations");
    if (!res.ok) return;
    const data = await res.json();
    setConversations(data.conversations || []);
  }

  async function loadSetup() {
    if (!user || user.role !== "seller") return;
    const res = await fetch("/api/setup");
    if (!res.ok) return;
    const data = await res.json();
    setCatalog(data.catalog);
    setRules(data.rules);
    setShopDescription(data.shop_description || "");
  }

  async function loadDeals() {
    const res = await fetch("/api/deals");
    if (!res.ok) return;
    const data = await res.json();
    setDeals(data.deals || []);
  }

  async function checkSession() {
    const res = await fetch("/api/auth/me");
    const data = await res.json();
    setUser(data.user);
    if (data.user) setTab(data.user.role === "seller" ? "setup" : "rfq");
  }

  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    if (user) {
      loadSetup();
      loadDeals();
      loadConversations();
    }
  }, [user]);

  // Keep the topbar messages badge fresh for both roles.
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(loadConversations, 20000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (tab === "pipeline" || tab === "orders" || tab === "negotiate") loadDeals();
  }, [tab]);

  // Lightweight polling so a seller sees new orders arrive without manually
  // refreshing — there's no websocket/push infra here, so this is a lean
  // stand-in that still gives a "live" feel.
  useEffect(() => {
    if (!user || user.role !== "seller") return;
    const interval = setInterval(loadDeals, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const newOrderCount = user?.role === "seller" ? deals.filter((d) => !d.seller_acknowledged).length : 0;
  // "Unread" proxy without read-tracking: threads where the other party spoke last.
  const unreadMessages = user
    ? conversations.filter((c) => c.last_message && c.last_message.sender_role !== user.role).length
    : 0;

  function openMessages(dealId) {
    setMessagesDealId(dealId || null);
    setTab("messages");
    loadConversations();
  }

  function handleAuthed(newUser) {
    setUser(newUser);
    setTab(newUser.role === "seller" ? "setup" : "rfq");
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setAuthMode(null); // back to the landing page
    setTab(null);
    setDeals([]);
    setActiveDealId(null);
    setConversations([]);
    setMessagesDealId(null);
  }

  function handleQuoteCreated(dealId) {
    setActiveDealId(dealId);
    setTab("negotiate");
    loadDeals();
  }

  async function handleReorder(productId, quantity) {
    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId, quantity }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reorder");
      handleQuoteCreated(data.deal_id);
    } catch (err) {
      console.error("Reorder failed:", err.message);
    }
  }

  if (user === undefined) {
    return <div className="app"><style>{STYLES}</style></div>; // brief loading blank while session check resolves
  }

  if (!user) {
    return (
      <div className="app">
        <style>{STYLES}</style>
        {authMode ? (
          <AuthScreen
            key={authMode}
            initialMode={authMode}
            onAuthed={handleAuthed}
            onBack={() => setAuthMode(null)}
          />
        ) : (
          <LandingPage onLogin={() => setAuthMode("login")} onSignup={() => setAuthMode("signup")} />
        )}
      </div>
    );
  }

  return (
    <div className="app">
      <style>{STYLES}</style>
      <Topbar user={user} tab={tab} setTab={setTab} onLogout={handleLogout} newOrderCount={newOrderCount} unreadMessages={unreadMessages} />
      {tab === "setup" && <SellerSetup catalog={catalog} rules={rules} shopDescription={shopDescription} onSaved={loadSetup} />}
      {tab === "rfq" && <RFQForm onQuoteCreated={handleQuoteCreated} />}
      {tab === "negotiate" && (
        <NegotiationChat deals={deals} dealId={activeDealId} onSelectDeal={setActiveDealId} refreshDeals={loadDeals} />
      )}
      {tab === "pipeline" && <Pipeline deals={deals} refresh={loadDeals} onMessage={openMessages} />}
      {tab === "orders" && <Pipeline deals={deals} refresh={loadDeals} readOnly onReorder={handleReorder} onMessage={openMessages} />}
      {tab === "messages" && <MessagesView key={messagesDealId || "inbox"} user={user} initialDealId={messagesDealId} />}
      {tab === "finance" && <FinanceTab />}
      {tab === "audit" && <AuditLogTab />}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
