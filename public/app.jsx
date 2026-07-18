const { useState, useEffect, useRef } = React;

// Lightweight toast system — a module-level pub/sub so any component can fire
// a toast without prop-drilling a callback through the whole tree.
const toastListeners = new Set();
function showToast(message, type = "success") {
  toastListeners.forEach((fn) => fn({ message, type }));
}
function ToastHost() {
  const [toasts, setToasts] = useState([]);
  useEffect(() => {
    const listener = (t) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { ...t, id }]);
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 3200);
    };
    toastListeners.add(listener);
    return () => toastListeners.delete(listener);
  }, []);
  return (
    <div className="toast-host">
      {toasts.map((t) => (
        <div key={t.id} className={"toast " + t.type}>{t.message}</div>
      ))}
    </div>
  );
}

const STYLES = `
  :root {
    --ink: #17293A;
    --paper: #F1F6F5;
    --paper-raised: #FFFFFF;
    --amber: #0D9488;
    --amber-deep: #0B7D6E;
    --success: #15803D;
    --danger: #B23A48;
    --text: #33414B;
    --text-soft: #5F736E;
    --line: #D8E4E1;
    /* Fixed (non-flipping) brand-dark banner colors — used by the stat "hero"
       panels (AI Insights, Finance) so they stay a deliberate dark navy card
       in both themes instead of inverting to a light card in dark mode. */
    --banner-bg: #17293A;
    --banner-text: #F1F6F5;
  }
  /* Dark mode: --ink and --paper flip together so every "solid fill + text"
     pairing (buttons, badges, hero bands) stays internally consistent —
     see the theme toggle in App() which stamps data-theme on <html>. */
  :root[data-theme="dark"] {
    --ink: #E9F1EF;
    --paper: #0F171E;
    --paper-raised: #182430;
    --text: #D6E2DF;
    --text-soft: #8CA19C;
    --line: #2A3941;
  }
  * { box-sizing: border-box; }
  @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes toastIn { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }
  .toast-host {
    position: fixed;
    right: 20px;
    bottom: 20px;
    z-index: 200;
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: flex-end;
  }
  .toast {
    background: var(--ink);
    color: var(--paper);
    padding: 12px 18px;
    border-radius: 8px;
    font-size: 13.5px;
    font-weight: 500;
    box-shadow: 0 8px 24px rgba(20,33,61,0.28);
    animation: toastIn 0.25s ease;
    display: flex;
    align-items: center;
    gap: 9px;
    max-width: 340px;
  }
  .toast::before { font-size: 15px; }
  .toast.success::before { content: "✓"; color: #7BD6A8; font-weight: 700; }
  .toast.error { background: var(--danger); }
  .toast.error::before { content: "!"; font-weight: 700; }
  .toast.info::before { content: "•"; color: var(--amber); }
  body {
    margin: 0;
    background:
      radial-gradient(1100px 520px at 85% -5%, rgba(13,148,136,0.13), transparent 60%),
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
  .password-toggle:hover { color: var(--amber-deep); background: rgba(13,148,136,0.1); }
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
    border: 1px solid color-mix(in srgb, var(--paper) 25%, transparent);
    color: color-mix(in srgb, var(--paper) 75%, transparent);
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
    color: color-mix(in srgb, var(--paper) 85%, transparent);
    font-size: 13px;
  }
  .user-chip-name {
    background: transparent;
    border: none;
    color: inherit;
    font: inherit;
    cursor: pointer;
    padding: 0;
  }
  .user-chip-name:hover { color: var(--paper); text-decoration: underline; }
  .theme-toggle-btn {
    background: transparent;
    border: 1px solid color-mix(in srgb, var(--paper) 25%, transparent);
    color: color-mix(in srgb, var(--paper) 85%, transparent);
    padding: 5px 9px;
    border-radius: 999px;
    font-size: 13px;
    cursor: pointer;
    line-height: 1;
  }
  .theme-toggle-btn:hover { border-color: var(--amber); }
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
    background: color-mix(in srgb, var(--paper) 8%, transparent);
    border-radius: 999px;
    padding: 3px;
  }
  .portal-btn {
    background: transparent;
    border: none;
    color: color-mix(in srgb, var(--paper) 60%, transparent);
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
    border: 1px solid color-mix(in srgb, var(--paper) 25%, transparent);
    color: color-mix(in srgb, var(--paper) 75%, transparent);
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
  .main { flex: 1; padding: 32px; max-width: 980px; margin: 0 auto; width: 100%; animation: fadeInUp 0.28s ease; }
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
  .shop-card-head { display: flex; flex-direction: column; align-items: flex-start; gap: 10px; }
  .shop-card-name { font-family: 'Fraunces', serif; font-size: 17px; font-weight: 600; color: var(--ink); line-height: 1.3; }
  .shop-card-desc { font-size: 13px; color: var(--text-soft); margin: 0; line-height: 1.5; flex: 1; }
  .shop-card-meta { display: flex; align-items: center; gap: 8px; font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: var(--text-soft); }
  .shop-card-category-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    align-self: flex-start;
    background: rgba(13,148,136,0.1);
    color: var(--amber-deep);
    font-size: 11px;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 999px;
  }
  .shop-card-cta { font-size: 13px; font-weight: 600; color: var(--amber-deep); margin-top: 2px; }
  .shop-card-title { display: flex; align-items: center; gap: 10px; min-width: 0; }
  .shop-card-icon {
    width: 34px;
    height: 34px;
    flex-shrink: 0;
    border-radius: 9px;
    background: rgba(13,148,136,0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 17px;
  }
  .marketplace-stats-row { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 20px; }
  .stat-chip {
    background: var(--paper-raised);
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 10px 18px;
    display: flex;
    align-items: baseline;
    gap: 8px;
    box-shadow: 0 1px 3px rgba(20,33,61,0.05);
  }
  .stat-chip-value { font-family: 'IBM Plex Mono', monospace; font-size: 18px; font-weight: 700; color: var(--ink); }
  .stat-chip-label { font-size: 12px; color: var(--text-soft); }
  .category-filter-bar { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 28px; }
  .category-pill {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    background: var(--paper-raised);
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 9px 16px;
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 600;
    color: var(--text);
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .category-pill:hover { border-color: var(--amber-deep); }
  .category-pill.active { background: var(--ink); border-color: var(--ink); color: var(--paper); }
  .category-pill-icon { font-size: 15px; }
  .category-pill-count { font-family: 'IBM Plex Mono', monospace; font-size: 11px; opacity: 0.65; }
  .category-section { margin-bottom: 36px; }
  .category-section-head { display: flex; align-items: baseline; gap: 10px; margin-bottom: 14px; }
  .category-section-icon { font-size: 22px; }
  .category-section-title { font-family: 'Fraunces', serif; font-size: 20px; font-weight: 600; color: var(--ink); margin: 0; }
  .category-section-count { font-size: 12px; color: var(--text-soft); }

  /* ---- Swiggy-style marketplace: tiles / category rail / clean cards ---- */
  .stat-tile-row { display: flex; gap: 14px; margin-bottom: 22px; flex-wrap: wrap; }
  .stat-tile {
    flex: 1;
    min-width: 160px;
    background: var(--paper-raised);
    border: 1px solid var(--line);
    border-radius: 14px;
    padding: 18px 22px;
    box-shadow: 0 1px 3px rgba(20,33,61,0.05);
  }
  .stat-tile.highlight { background: rgba(13,148,136,0.12); border-color: rgba(13,148,136,0.28); }
  .stat-tile-label { font-family: 'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-soft); margin-bottom: 8px; }
  .stat-tile.highlight .stat-tile-label { color: var(--amber-deep); }
  .stat-tile-value { font-family: 'Fraunces', serif; font-size: 27px; font-weight: 700; color: var(--ink); line-height: 1; }
  .stat-tile.highlight .stat-tile-value { color: var(--amber-deep); }

  .category-rail { display: flex; gap: 22px; overflow-x: auto; padding: 4px 2px 10px; margin-bottom: 26px; }
  .category-rail-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
  }
  .category-rail-icon {
    width: 62px;
    height: 62px;
    border-radius: 50%;
    background: var(--paper-raised);
    border: 2px solid var(--line);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-soft);
    transition: all 0.15s ease;
  }
  .category-rail-item:hover .category-rail-icon { border-color: var(--amber-deep); color: var(--amber-deep); }
  .category-rail-item.active .category-rail-icon { border-color: var(--amber); background: rgba(13,148,136,0.14); color: var(--amber-deep); }
  .category-rail-label { font-size: 12px; font-weight: 600; color: var(--text); white-space: nowrap; }
  .category-rail-item.active .category-rail-label { color: var(--amber-deep); }

  .shop-card-v2 {
    background: var(--paper-raised);
    border: none;
    border-radius: 16px;
    padding: 20px 22px;
    cursor: pointer;
    box-shadow: 0 1px 3px rgba(20,33,61,0.06);
    transition: all 0.15s ease;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .shop-card-v2:hover { transform: translateY(-2px); box-shadow: 0 10px 26px rgba(20,33,61,0.1); }
  .shop-card-v2-top { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
  .shop-card-v2-name { font-family: 'Fraunces', serif; font-size: 18px; font-weight: 700; color: var(--ink); line-height: 1.25; }
  .badge-pill { font-size: 10.5px; font-weight: 700; padding: 6px 12px; border-radius: 999px; white-space: nowrap; flex-shrink: 0; }
  .badge-pill.outline { border: 1.5px solid var(--amber); color: var(--amber-deep); background: rgba(13,148,136,0.06); }
  .badge-pill.solid { background: var(--amber); color: var(--ink); }
  .badge-pill.muted { border: 1px solid var(--line); color: var(--text-soft); }
  .shop-card-v2-meta { font-family: 'IBM Plex Mono', monospace; font-size: 12.5px; color: var(--text-soft); }
  .shop-card-v2-cta { font-size: 13px; font-weight: 700; color: var(--amber-deep); margin-top: 4px; }
  .product-card.out-of-stock { opacity: 0.6; }
  .product-card.out-of-stock .product-stock { color: var(--danger); }
  .notify-btn {
    margin-top: 10px;
    width: 100%;
    background: var(--paper-raised);
    border: 1px solid var(--amber-deep);
    color: var(--amber-deep);
    font-family: 'Inter', sans-serif;
    font-size: 12px;
    font-weight: 600;
    padding: 7px 10px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }
  .notify-btn:hover:not(:disabled) { background: rgba(13,148,136,0.08); }
  .notify-btn:disabled { border-color: var(--success); color: var(--success); cursor: default; }
  .restock-banner {
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(13,148,136,0.09);
    border: 1px solid rgba(13,148,136,0.35);
    border-radius: 10px;
    padding: 12px 16px;
    margin-bottom: 20px;
    font-size: 14px;
    color: var(--text);
  }
  .restock-bell { display: flex; align-items: center; color: var(--amber-deep); flex-shrink: 0; }
  .restock-dismiss { background: none; border: none; color: var(--text-soft); font-size: 15px; cursor: pointer; padding: 2px 6px; }
  .restock-dismiss:hover { color: var(--ink); }
  .wait-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: rgba(13,148,136,0.12);
    color: var(--amber-deep);
    font-size: 11px;
    font-weight: 600;
    padding: 2px 9px;
    border-radius: 999px;
    margin-left: 8px;
    white-space: nowrap;
  }
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
  .product-card.selected { border-color: var(--amber); border-width: 2px; background: rgba(13,148,136,0.05); }
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
  .lead-flag.new { background: rgba(13,148,136,0.2); color: var(--amber-deep); }
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
  .card-actions { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
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
  .payment-badge.confirmed { background: rgba(13,148,136,0.18); color: var(--amber-deep); }
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
    background: var(--banner-bg);
    color: var(--banner-text);
    padding: 28px 32px;
  }
  .fin-hero-label {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: color-mix(in srgb, var(--banner-text) 60%, transparent);
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
  .fin-hero-sub { font-size: 13px; color: color-mix(in srgb, var(--banner-text) 80%, transparent); }
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
  /* --- Deal Intelligence --- */
  .di-hero {
    display: grid;
    grid-template-columns: 1.1fr 1fr;
    gap: 1px;
    background: var(--line);
    border-radius: 14px;
    overflow: hidden;
    margin-bottom: 24px;
    box-shadow: 0 2px 8px rgba(20,33,61,0.06);
  }
  .di-hero-main { background: var(--banner-bg); color: var(--banner-text); padding: 28px 32px; display: flex; align-items: center; gap: 26px; }
  .di-donut { flex-shrink: 0; }
  .di-hero-label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: color-mix(in srgb, var(--banner-text) 60%, transparent); margin-bottom: 8px; }
  .di-hero-value { font-family: 'Fraunces', serif; font-size: 40px; font-weight: 600; line-height: 1; color: var(--amber); margin-bottom: 10px; }
  .di-hero-sub { font-size: 13px; color: color-mix(in srgb, var(--banner-text) 80%, transparent); line-height: 1.5; }
  .di-hero-gauge { background: var(--paper-raised); padding: 26px 30px; display: flex; flex-direction: column; justify-content: center; }
  .di-gauge-value { font-family: 'IBM Plex Mono', monospace; font-size: 24px; font-weight: 700; color: var(--success); }
  .di-bar-track { background: rgba(20,33,61,0.08); border-radius: 999px; height: 12px; overflow: hidden; margin: 10px 0 6px; position: relative; }
  .di-bar-fill { height: 100%; border-radius: 999px; transition: width 0.5s ease; }
  .di-funnel-row { display: flex; align-items: center; gap: 14px; margin-bottom: 12px; }
  .di-funnel-label { width: 110px; font-size: 13px; color: var(--text); font-weight: 500; flex-shrink: 0; }
  .di-funnel-bar { flex: 1; background: rgba(20,33,61,0.06); border-radius: 6px; height: 26px; overflow: hidden; }
  .di-funnel-fill { height: 100%; display: flex; align-items: center; padding-left: 10px; color: var(--paper); font-family: 'IBM Plex Mono', monospace; font-size: 12px; font-weight: 600; border-radius: 6px; min-width: 30px; transition: width 0.5s ease; }
  .di-insight {
    background: rgba(13,148,136,0.08);
    border: 1px solid rgba(13,148,136,0.35);
    border-radius: 10px;
    padding: 16px 20px;
    font-size: 14px;
    color: var(--text);
    line-height: 1.55;
    margin-top: 4px;
  }
  .di-insight strong { color: var(--amber-deep); }
  @media (max-width: 640px) { .di-hero { grid-template-columns: 1fr; } .di-hero-main { flex-direction: column; text-align: center; } }
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
  .dc-name { font-family: 'Fraunces', serif; font-weight: 600; color: var(--ink); font-size: 14.5px; line-height: 1.25; }
  .dc-sku { font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; color: var(--text-soft); margin-top: 3px; margin-bottom: 8px; }
  .card-btn {
    background: var(--paper-raised);
    border: 1px solid var(--line);
    color: var(--text);
    font-family: 'Inter', sans-serif;
    font-size: 11.5px;
    font-weight: 600;
    padding: 6px 13px;
    border-radius: 999px;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.15s ease;
  }
  .card-btn:hover { border-color: var(--amber-deep); color: var(--amber-deep); background: rgba(13,148,136,0.08); }
  .card-btn.primary { background: var(--ink); border-color: var(--ink); color: var(--paper); }
  .card-btn.primary:hover { opacity: 0.88; background: var(--ink); color: var(--paper); border-color: var(--ink); }
  .main.wide { max-width: 1180px; }
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
  .conv-item.active { background: rgba(13,148,136,0.1); box-shadow: inset 3px 0 0 var(--amber); }
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
  .ai-generate-btn {
    background: rgba(13,148,136,0.08);
    border: 1px solid var(--amber);
    color: var(--amber-deep);
    font-family: 'Inter', sans-serif;
    font-size: 12px;
    font-weight: 700;
    padding: 6px 13px;
    border-radius: 999px;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.15s ease;
  }
  .ai-generate-btn:hover:not(:disabled) { background: rgba(13,148,136,0.16); }
  .ai-generate-btn:disabled { opacity: 0.6; cursor: not-allowed; }
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
  .action-badge.counter { background: rgba(13,148,136,0.18); color: var(--amber-deep); }
  .action-badge.escalate { background: rgba(178,58,72,0.12); color: var(--danger); }
  .action-badge.confirm_pending { background: rgba(27,31,42,0.08); color: var(--ink); }
  .chat-input-row { display: flex; gap: 10px; }
  .chat-input-row input { margin-bottom: 0; }
  .thinking { color: var(--text-soft); font-size: 13px; font-style: italic; padding: 8px 0; }
  .suggest-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
  .suggest-chip {
    background: rgba(13,148,136,0.08);
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
  .suggest-chip:hover { background: rgba(13,148,136,0.18); }
  .neg-savings { margin-top: 6px; font-size: 12px; font-weight: 600; color: var(--success); }
  .pipeline { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; }
  .pcol { background: var(--paper-raised); border: 1px solid var(--line); border-radius: 12px; padding: 16px; min-height: 200px; box-shadow: 0 1px 3px rgba(20,33,61,0.05); }
  .pcol h4 { font-family: 'Fraunces', serif; font-weight: 600; font-size: 15px; margin: 0 0 14px; padding-bottom: 10px; border-bottom: 2px solid; }
  .pcol.quote_sent h4 { border-color: var(--text-soft); }
  .pcol.negotiating h4 { border-color: var(--amber); }
  .pcol.confirmed h4 { border-color: var(--success); }
  .pcol.invoiced h4 { border-color: var(--ink); }
  .deal-card {
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 14px 16px;
    margin-bottom: 10px;
    font-size: 12.5px;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .deal-card:hover { border-color: var(--amber); box-shadow: 0 4px 12px rgba(20,33,61,0.08); transform: translateY(-1px); }
  .deal-card.read-only { cursor: default; }
  .deal-card.read-only:hover { border-color: var(--line); box-shadow: none; transform: none; }
  .deal-card .sku { font-weight: 600; color: var(--ink); }
  .deal-card .amt { font-family: 'IBM Plex Mono', monospace; color: var(--ink); font-weight: 600; font-size: 12.5px; margin-top: 6px; }
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
  .floating-assistant { position: fixed; right: 24px; bottom: 24px; z-index: 60; display: flex; flex-direction: column; align-items: flex-end; gap: 12px; }
  .floating-assistant-btn {
    width: 56px; height: 56px; border-radius: 50%; border: none; cursor: pointer;
    background: var(--ink); color: var(--paper); font-size: 22px;
    box-shadow: 0 8px 24px rgba(27,31,42,0.28); display: flex; align-items: center; justify-content: center;
  }
  .floating-assistant-btn:hover { background: var(--amber-deep); }
  .floating-assistant-panel {
    width: min(360px, calc(100vw - 48px)); background: var(--paper); border: 1px solid var(--line);
    border-radius: 14px; box-shadow: 0 16px 40px rgba(27,31,42,0.22); display: flex; flex-direction: column;
    overflow: hidden;
  }
  .floating-assistant-head {
    display: flex; align-items: center; justify-content: space-between; padding: 14px 16px;
    background: var(--ink); color: var(--paper); font-family: 'Fraunces', serif; font-size: 15px;
  }
  .floating-assistant-head .close-btn { position: static; background: transparent; border: none; font-size: 16px; cursor: pointer; color: var(--paper); }
  .floating-assistant-body { padding: 14px 16px 16px; }
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
    background: color-mix(in srgb, var(--paper) 88%, transparent);
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
  .hero-quote-float .quote-line { color: color-mix(in srgb, var(--paper) 70%, transparent); gap: 18px; }
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
    background: rgba(13,148,136,0.16);
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
    background: radial-gradient(600px 300px at 85% -20%, rgba(13,148,136,0.25), transparent 65%);
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
  .cta-band p { position: relative; color: color-mix(in srgb, var(--paper) 75%, transparent); font-size: 15px; margin: 0 auto 28px; max-width: 480px; }
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
      <label>{label}{required && <span className="required-mark"> *</span>}</label>
      <div className="password-field">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          minLength={8}
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
  const [otp, setOtp] = useState("");
  const [verifyState, setVerifyState] = useState(null); // { userId, target, dest, demoCode }
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  function switchMode(next) {
    setMode(next);
    // Never carry a typed password across forms — e.g. typing it into
    // Sign up by mistake and then finding it pre-filled on Log in.
    setPassword("");
    setNewPassword("");
    setOtp("");
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
    if (!/^\d{10}$/.test(mobile.trim())) {
      setError("Mobile number is required and must be exactly 10 digits.");
      return;
    }
    if (email.trim() && !/^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(email.trim())) {
      setError("Email must be a Gmail address ending in @gmail.com.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role, name, email: email || undefined, mobile: mobile || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      // OTP verification is temporarily disabled — signup logs straight in.
      onAuthed(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function submitVerify(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: verifyState.userId, code: otp.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");
      onAuthed(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function resendCode() {
    setError(null);
    setInfo(null);
    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: verifyState.userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not resend code");
      setVerifyState((s) => ({ ...s, dest: data.destination_masked, demoCode: data.demo_code, delivered: data.delivered }));
      setInfo(data.delivered ? "A new code was sent to your email." : "A new code was generated.");
    } catch (err) {
      setError(err.message);
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
          {mode === "verify" && "Verify your account"}
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

            <label>Username, Email, or Mobile <span className="required-mark">*</span></label>
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

            <label>{role === "seller" ? "Company / seller name" : "Your company / name"} <span className="required-mark">*</span></label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Meridian Retail Co." autoComplete="off" required />

            <label>Username <span className="required-mark">*</span></label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. meridian_retail" autoComplete="off" required />

            <label>Mobile <span className="required-mark">*</span></label>
            <input
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="10-digit mobile number"
              inputMode="numeric"
              maxLength={10}
              pattern="\d{10}"
              autoComplete="off"
              required
            />

            <label>Email <span style={{ color: "var(--text-soft)", fontWeight: 400 }}>(optional — Gmail only)</span></label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@gmail.com"
              pattern="[a-zA-Z0-9._%+\-]+@gmail\.com"
              title="Enter a Gmail address ending in @gmail.com"
              autoComplete="off"
            />

            <PasswordField
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="off"
              required
            />

            {error && <div className="error-box">{error}</div>}
            <button className="btn amber" style={{ width: "100%" }} disabled={loading}>
              {loading ? "Please wait..." : "Sign Up"}
            </button>
          </form>
        )}

        {mode === "verify" && verifyState && (
          <form onSubmit={submitVerify} autoComplete="off">
            <p style={{ fontSize: "13px", color: "var(--text-soft)", margin: "0 0 16px", lineHeight: 1.5 }}>
              We sent a 6-digit code to your {verifyState.target === "email" ? "email" : "mobile"}{" "}
              <strong style={{ color: "var(--text)" }}>{verifyState.dest}</strong>.{" "}
              {verifyState.delivered ? "Check your inbox (and spam folder), then enter it below." : "Enter it below to finish creating your account."}
            </p>

            {verifyState.demoCode && (
              <div className="info-box" style={{ marginBottom: "16px" }}>
                Demo mode — your code is <strong style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.1em" }}>{verifyState.demoCode}</strong>.
                A live deployment would send this by email/SMS instead of showing it here.
              </div>
            )}
            {info && <div className="info-box" style={{ marginBottom: "16px" }}>{info}</div>}

            <label>Verification code</label>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="6-digit code"
              inputMode="numeric"
              autoComplete="one-time-code"
              style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "18px", letterSpacing: "0.2em", textAlign: "center" }}
              required
            />

            {error && <div className="error-box">{error}</div>}
            <button className="btn amber" style={{ width: "100%" }} disabled={loading || otp.length < 6}>
              {loading ? "Verifying..." : "Verify & Continue"}
            </button>
            <div style={{ textAlign: "center", marginTop: "14px" }}>
              <button type="button" className="link-btn" onClick={resendCode}>Resend code</button>
            </div>
          </form>
        )}

        {mode === "forgot" && (
          <form onSubmit={submitForgot}>
            <label>Username, Email, or Mobile <span className="required-mark">*</span></label>
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
            <label>Reset Token <span className="required-mark">*</span></label>
            <input value={resetToken} onChange={(e) => setResetToken(e.target.value)} placeholder="Reset token" required />
            <PasswordField
              label="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
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
          {mode === "verify" && (
            <>Entered the wrong details? <button onClick={() => switchMode("signup")}>Start over</button></>
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

function Topbar({ user, tab, setTab, onLogout, newOrderCount, unreadMessages, theme, onToggleTheme, onOpenProfile }) {
  const tabsByPortal = {
    buyer: [
      { id: "rfq", label: "Request Quote" },
      { id: "negotiate", label: "Negotiate" },
      { id: "orders", label: "My Orders" },
    ],
    seller: [
      { id: "setup", label: "Seller Setup" },
      { id: "pipeline", label: "Pipeline" },
      { id: "insights", label: "AI Insights" },
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
          <button className="user-chip-name" onClick={onOpenProfile} title="View profile">
            {user.name} · {user.role === "seller" ? "Seller" : "Buyer"}
          </button>
          <button className="theme-toggle-btn" onClick={onToggleTheme} aria-label="Toggle dark mode" title="Toggle dark mode">
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
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

function SellerSetup({ catalog, rules, shopDescription, waitCounts, onSaved }) {
  const [localCatalog, setLocalCatalog] = useState(catalog);
  const [localRules, setLocalRules] = useState(rules);
  const [localDescription, setLocalDescription] = useState(shopDescription || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newStock, setNewStock] = useState("");
  const [newCategory, setNewCategory] = useState("Other");
  const [addingProduct, setAddingProduct] = useState(false);
  const [addError, setAddError] = useState(null);
  const [generatingDesc, setGeneratingDesc] = useState(false);

  useEffect(() => setLocalCatalog(catalog), [catalog]);
  useEffect(() => setLocalRules(rules), [rules]);
  useEffect(() => setLocalDescription(shopDescription || ""), [shopDescription]);

  async function generateDescription() {
    setGeneratingDesc(true);
    try {
      const res = await fetch("/api/setup/generate-description", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate a description");
      setLocalDescription(data.description);
      setSaved(false);
      showToast("AI drafted a description — review it, then Save Changes");
    } catch (err) {
      showToast(err.message || "Couldn't generate a description", "error");
    } finally {
      setGeneratingDesc(false);
    }
  }

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
        body: JSON.stringify({ name: newName.trim(), base_price: Number(newPrice), stock: Number(newStock), category: newCategory }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add product");
      setLocalCatalog(data.catalog);
      setNewName("");
      setNewPrice("");
      setNewStock("");
      showToast("Product added to your catalog");
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
      showToast("Changes saved — new rules apply to the next negotiation");
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
          <label style={{ marginBottom: 0 }}>Shop description</label>
          <button type="button" className="ai-generate-btn" onClick={generateDescription} disabled={generatingDesc}>
            {generatingDesc ? "Generating..." : "✨ Generate with AI"}
          </button>
        </div>
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
              {waitCounts && waitCounts[p.id] > 0 && (
                <span className="wait-badge" title="Buyers waiting for this to come back in stock">
                  <IconBell size={11} /> {waitCounts[p.id]} waiting
                </span>
              )}
            </div>
            <div className="edit-row-fields">
              <div>
                <label style={{ marginBottom: "4px" }}>Category</label>
                <select
                  value={p.category || "Other"}
                  onChange={(e) => updateProduct(p.id, "category", e.target.value)}
                  style={{ marginBottom: 0, width: "150px" }}
                >
                  {CATEGORY_ORDER.map((c) => (
                    <option key={c} value={c}>{categoryIcon(c)} {c}</option>
                  ))}
                </select>
              </div>
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
            <label style={{ marginBottom: "4px" }}>Category</label>
            <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} style={{ marginBottom: 0, width: "150px" }}>
              {CATEGORY_ORDER.map((c) => (
                <option key={c} value={c}>{categoryIcon(c)} {c}</option>
              ))}
            </select>
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

const CATEGORY_ORDER = ["Stationery", "Grocery", "Food & Catering", "Electricals", "Packaging", "Furniture", "Textiles", "Other"];
const CATEGORY_ICON = {
  "Stationery": "✏️",
  "Grocery": "🛒",
  "Food & Catering": "🍽️",
  "Electricals": "🔌",
  "Packaging": "📦",
  "Furniture": "🪑",
  "Textiles": "🧶",
  "Other": "🗂️",
};
function categoryIcon(cat) {
  return CATEGORY_ICON[cat] || CATEGORY_ICON.Other;
}

// Clean stroke-based SVG icons, colored via currentColor, replacing native
// emoji glyphs in the category rail / shop headers — emoji render
// inconsistently across OS/browsers and clash with the app's teal palette.
// (Native <select><option> text can't hold SVG/JSX, so categoryIcon() above
// — the emoji-string version — is kept for those two dropdowns only.)
function IconIsvg({ children, size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}
function IconStationery(props) {
  return <IconIsvg {...props}><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" /></IconIsvg>;
}
function IconGrocery(props) {
  return <IconIsvg {...props}><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></IconIsvg>;
}
function IconFood(props) {
  return <IconIsvg {...props}><path d="M3 2v7c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2V2" /><path d="M7 2v20" /><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" /></IconIsvg>;
}
function IconElectric(props) {
  return <IconIsvg {...props}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></IconIsvg>;
}
function IconTag(props) {
  return <IconIsvg {...props}><path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82Z" /><circle cx="7" cy="7" r="1.4" fill="currentColor" stroke="none" /></IconIsvg>;
}
function IconStore(props) {
  return <IconIsvg {...props}><path d="M3 9l1-6h16l1 6" /><path d="M3 9a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0" /><path d="M4 9v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9" /><path d="M9 21v-6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v6" /></IconIsvg>;
}
function IconBell(props) {
  return <IconIsvg {...props}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></IconIsvg>;
}
function IconFurniture(props) {
  return <IconIsvg {...props}><rect x="3" y="6" width="18" height="5" rx="1" /><line x1="5" y1="11" x2="5" y2="19" /><line x1="19" y1="11" x2="19" y2="19" /></IconIsvg>;
}
function IconTextile(props) {
  return <IconIsvg {...props}><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 .55.45 1 1 1h10a1 1 0 0 0 1-1V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" /></IconIsvg>;
}

const CATEGORY_SVG_ICON = {
  "Stationery": IconStationery,
  "Grocery": IconGrocery,
  "Food & Catering": IconFood,
  "Electricals": IconElectric,
  "Packaging": IconTag,
  "Furniture": IconFurniture,
  "Textiles": IconTextile,
  "Other": IconTag,
};
function CategoryIcon({ category, size }) {
  const Cmp = CATEGORY_SVG_ICON[category] || IconTag;
  return <Cmp size={size} />;
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
  const [activeCategory, setActiveCategory] = useState(null);
  const [notified, setNotified] = useState([]); // buyer's own waitlist product ids (this session)
  const [backInStock, setBackInStock] = useState([]); // back-in-stock alerts

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => setProducts(data.products || []))
      .catch(() => {})
      .finally(() => setLoadingProducts(false));
    fetch("/api/my-notifications")
      .then((res) => res.json())
      .then((data) => setBackInStock(data.notifications || []))
      .catch(() => {});
  }, []);

  async function notifyMe(product) {
    setNotified((prev) => [...prev, product.id]);
    try {
      const res = await fetch("/api/stock-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: product.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      showToast(data.already ? "You're already on the waitlist for this" : `We'll notify you when ${product.name} is back in stock`);
    } catch (err) {
      setNotified((prev) => prev.filter((id) => id !== product.id));
      showToast(err.message || "Couldn't join the waitlist", "error");
    }
  }

  async function dismissBackInStock() {
    setBackInStock([]);
    await fetch("/api/my-notifications/seen", { method: "POST" }).catch(() => {});
  }

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
    // A shop's "category" is whichever category most of its products belong
    // to — lets the marketplace group shops without requiring every seller
    // to carry a single, explicitly-tagged category.
    const catCounts = {};
    for (const p of s.products) catCounts[p.category || "Other"] = (catCounts[p.category || "Other"] || 0) + 1;
    const category = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0][0];
    return { ...s, count: s.products.length, priceMin: Math.min(...prices), priceMax: Math.max(...prices), category };
  });

  const banner = backInStock.length > 0 ? (
    <div className="restock-banner">
      <span className="restock-bell"><IconBell size={18} /></span>
      <div style={{ flex: 1 }}>
        <strong>Back in stock: </strong>
        {backInStock.map((n) => n.product_name).join(", ")} — you asked to be notified.
      </div>
      <button className="restock-dismiss" onClick={dismissBackInStock} aria-label="Dismiss">✕</button>
    </div>
  ) : null;

  if (loadingProducts && products.length === 0) {
    return <div className="main"><div className="card"><p className="empty" style={{ padding: "8px 0" }}>Loading the marketplace...</p></div></div>;
  }
  if (!loadingProducts && products.length === 0) {
    return <div className="main"><div className="card"><p className="empty" style={{ padding: "8px 0" }}>No sellers have listed products yet.</p></div></div>;
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
      <div className="main wide">
        {banner}
        <button className="back-link" onClick={backToShops}>← All shops</button>

        <div className="shop-header">
          <div className="seller-group-info">
            <h2 className="panel-title" style={{ margin: 0, display: "inline-flex", alignItems: "center", gap: "10px" }}>
              <CategoryIcon category={openShopObj.category} size={22} /> {openShopObj.seller_name}
            </h2>
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
                onClick={() => (p.stock > 0 ? selectProduct(p.id) : null)}
                style={p.stock === 0 ? { cursor: "default" } : undefined}
              >
                <div className="product-name">{p.name}</div>
                <div className="product-sku">{p.sku}</div>
                <div className="product-price">₹{p.base_price}<span>/unit</span></div>
                <div className="product-stock">{p.stock > 0 ? `${p.stock.toLocaleString()} in stock` : "Out of stock"}</div>
                {p.stock === 0 && (
                  <button
                    className="notify-btn"
                    disabled={notified.includes(p.id)}
                    onClick={(e) => { e.stopPropagation(); notifyMe(p); }}
                  >
                    {notified.includes(p.id) ? "✓ On the waitlist" : <><IconBell size={13} /> Notify me when back</>}
                  </button>
                )}
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
  let visibleShops = shops;
  if (activeCategory) visibleShops = visibleShops.filter((s) => s.category === activeCategory);
  if (sq) {
    visibleShops = visibleShops.filter(
      (s) =>
        textMatches(s.seller_name, sq) ||
        textMatches(s.description, sq) ||
        s.products.some((p) => textMatches(p.name, sq))
    );
  }

  const categoryCounts = {};
  for (const s of shops) categoryCounts[s.category] = (categoryCounts[s.category] || 0) + 1;
  const presentCategories = CATEGORY_ORDER.filter((c) => categoryCounts[c] > 0);
  const verifiedCount = shops.filter((s) => s.verified).length;

  function renderShopCard(s) {
    // A simple, honest trust ladder computed from real completed-deal counts
    // (no fabricated numbers): more closed deals = a stronger badge.
    const badge =
      s.completed >= 5 ? { cls: "solid", label: "★ Top Negotiator" } :
      s.verified ? { cls: "outline", label: "✓ Verified" } :
      { cls: "muted", label: "New" };

    return (
      <div key={s.seller_id} className="shop-card-v2" onClick={() => openShop(s.seller_id)}>
        <div className="shop-card-v2-top">
          <span className="shop-card-v2-name">{s.seller_name}</span>
          <span className={"badge-pill " + badge.cls}>{badge.label}</span>
        </div>
        <div className="shop-card-v2-meta">
          {s.count} product{s.count === 1 ? "" : "s"} · {s.priceMin === s.priceMax ? `₹${s.priceMin}` : `₹${s.priceMin.toLocaleString()}–₹${s.priceMax.toLocaleString()}`}
        </div>
        <div className="shop-card-v2-cta">Browse shop →</div>
      </div>
    );
  }

  return (
    <div className="main wide">
      {banner}

      <div className="stat-tile-row">
        <div className="stat-tile">
          <div className="stat-tile-label">Sellers</div>
          <div className="stat-tile-value">{shops.length}</div>
        </div>
        <div className="stat-tile highlight">
          <div className="stat-tile-label">Verified Sellers</div>
          <div className="stat-tile-value">{verifiedCount}</div>
        </div>
      </div>

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

      <div className="category-rail">
        <button className={"category-rail-item" + (!activeCategory ? " active" : "")} onClick={() => setActiveCategory(null)}>
          <span className="category-rail-icon"><IconStore size={24} /></span>
          <span className="category-rail-label">All</span>
        </button>
        {presentCategories.map((cat) => (
          <button
            key={cat}
            className={"category-rail-item" + (activeCategory === cat ? " active" : "")}
            onClick={() => setActiveCategory(cat)}
          >
            <span className="category-rail-icon"><CategoryIcon category={cat} size={24} /></span>
            <span className="category-rail-label">{cat}</span>
          </button>
        ))}
      </div>

      {visibleShops.length === 0 ? (
        <div className="card"><p className="empty" style={{ padding: "8px 0" }}>
          {sq ? `No shops match "${shopQuery}". Try a different search.` : "No shops in this category yet."}
        </p></div>
      ) : (
        <div className="shop-grid">{visibleShops.map(renderShopCard)}</div>
      )}
    </div>
  );
}

function NegotiationChat({ deals, dealId, onSelectDeal, onDealPatched }) {
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
    return res.ok ? data.deal : null;
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
      const updated = await loadDeal(dealId);
      if (updated) onDealPatched?.(dealId, updated);
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

// Builds the same invoice shape the server's GET /api/deals/:id/invoice
// returns, but from a deal object the caller already has in memory (from the
// deals list) — so opening an invoice is instant with no network round trip
// and no loading flash. Falls back to a live fetch only if the deal wasn't
// already loaded (e.g. a direct link).
function buildInvoiceFromDeal(deal) {
  const q = deal.quote;
  return {
    invoice_number: deal.invoice_number,
    invoiced_at: deal.invoiced_at,
    buyer_name: deal.buyer_name,
    line_items: [
      {
        description: q.product_name || deal.sku,
        sku: deal.sku,
        quantity: q.quantity,
        original_unit_price: q.base_price,
        original_total: +(q.base_price * q.quantity).toFixed(2),
        unit_price: q.unit_price,
        discount_percent: q.discount_percent,
        total: q.total,
      },
    ],
    total_savings: +(q.base_price * q.quantity - q.total).toFixed(2),
    total: q.total,
  };
}

function InvoicePreview({ dealId, deals, onClose }) {
  const fromMemory = deals?.find((d) => d.id === dealId && d.status === "invoiced");
  const [invoice, setInvoice] = useState(fromMemory ? buildInvoiceFromDeal(fromMemory) : null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Already have everything we need locally — skip the network round trip.
    if (fromMemory) return;
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
    const res = await fetch(`/api/deals/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "invoiced" }),
    });
    if (res.ok) showToast("Invoice generated"); else showToast("Couldn't generate invoice", "error");
    refresh();
  }

  async function acknowledge(id) {
    const res = await fetch(`/api/deals/${id}/acknowledge`, { method: "POST" });
    if (res.ok) showToast("Order acknowledged"); else showToast("Couldn't acknowledge order", "error");
    refresh();
  }

  async function markPaid(id) {
    const res = await fetch(`/api/deals/${id}/mark-paid`, { method: "POST" });
    if (res.ok) showToast("Marked as paid"); else showToast("Couldn't mark as paid", "error");
    refresh();
  }

  async function sendReminder(id) {
    const res = await fetch(`/api/deals/${id}/send-reminder`, { method: "POST" });
    if (res.ok) showToast("Payment reminder sent to buyer"); else showToast("Couldn't send reminder", "error");
    refresh();
  }

  function handleCardClick(col, id) {
    // Read-only (buyer) view can look at an invoice once it exists, but can
    // never trigger the seller-only action of invoicing a confirmed deal.
    if (col === "confirmed" && !readOnly) markInvoiced(id);
    if (col === "invoiced") setInvoiceDealId(id);
  }

  return (
    <div className="main wide">
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
                      <button className="card-btn primary" onClick={(e) => { e.stopPropagation(); acknowledge(d.id); }}>Acknowledge</button>
                    )}
                    {col.id === "invoiced" && d.payment_status !== "paid" && (
                      <>
                        <button className="card-btn primary" onClick={(e) => { e.stopPropagation(); markPaid(d.id); }}>Mark paid</button>
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

      {invoiceDealId && <InvoicePreview dealId={invoiceDealId} deals={deals} onClose={() => setInvoiceDealId(null)} />}
      {negotiationDealId && <NegotiationHistoryModal dealId={negotiationDealId} onClose={() => setNegotiationDealId(null)} />}
    </div>
  );
}

function WinRateDonut({ pct }) {
  const r = 15.9155; // circumference = 100
  return (
    <svg className="di-donut" width="112" height="112" viewBox="0 0 36 36">
      <circle cx="18" cy="18" r={r} fill="none" stroke="color-mix(in srgb, var(--banner-text) 18%, transparent)" strokeWidth="3.2" />
      <circle
        cx="18" cy="18" r={r} fill="none" stroke="var(--amber)" strokeWidth="3.2"
        strokeDasharray={`${pct} ${100 - pct}`} strokeDashoffset="25" strokeLinecap="round"
      />
      <text x="18" y="18.7" textAnchor="middle" dominantBaseline="middle"
        fontFamily="'IBM Plex Mono', monospace" fontSize="8" fontWeight="700" fill="var(--banner-text)">{pct}%</text>
      <text x="18" y="23.5" textAnchor="middle" dominantBaseline="middle"
        fontFamily="Inter, sans-serif" fontSize="2.6" fill="color-mix(in srgb, var(--banner-text) 60%, transparent)">WIN RATE</text>
    </svg>
  );
}

// Shared chat core for both the seller's embedded "Ask AI" panel and the
// buyer's floating help widget — same message list, input, and network call,
// just mounted in different chrome around it.
function AssistantChat({ endpoint, placeholder, suggestions, emptyText }) {
  const [messages, setMessages] = useState([]); // { role: "buyer" | "agent", text }
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const bodyRef = useRef(null);

  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, loading]);

  async function send(text) {
    const q = (text ?? input).trim();
    if (!q || loading) return;
    const history = messages.map((m) => ({ role: m.role === "buyer" ? "user" : "assistant", text: m.text }));
    setMessages((prev) => [...prev, { role: "buyer", text: q }]);
    setInput("");
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q, history }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setMessages((prev) => [...prev, { role: "agent", text: data.reply }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {messages.length === 0 && !loading ? (
        <p className="empty" style={{ padding: "0 0 16px", margin: 0 }}>{emptyText}</p>
      ) : (
        <div className="chat-area" ref={bodyRef} style={{ minHeight: "80px", maxHeight: "320px" }}>
          {messages.map((m, i) => (
            <div key={i} className={"msg " + m.role}>{m.text}</div>
          ))}
          {loading && <div className="thinking">Thinking...</div>}
        </div>
      )}

      {error && <div className="error-box">{error}</div>}

      {messages.length === 0 && suggestions && (
        <div className="suggest-row">
          {suggestions.map((s) => (
            <button key={s} type="button" className="suggest-chip" onClick={() => send(s)}>{s}</button>
          ))}
        </div>
      )}

      <form
        className="chat-input-row"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={placeholder} />
        <button className="btn" type="submit" disabled={loading}>Send</button>
      </form>
    </>
  );
}

function SellerAssistantCard() {
  return (
    <div className="card">
      <h3 style={{ fontFamily: "Fraunces, serif", fontSize: "16px", margin: "0 0 4px" }}>🤖 Ask AI about your business</h3>
      <p className="panel-sub" style={{ margin: "0 0 16px" }}>
        Ask about your win rate, negotiation rules, revenue, or anything else on this dashboard.
      </p>
      <AssistantChat
        endpoint="/api/assistant/seller"
        placeholder="e.g. Why is my win rate low?"
        emptyText="Ask a question about your deals, rules, or revenue — grounded in your real numbers."
        suggestions={["Why is my win rate low?", "Which rule should I loosen?", "Am I giving away too much margin?"]}
      />
    </div>
  );
}

function FloatingBuyerAssistant() {
  const [open, setOpen] = useState(false);
  return (
    <div className="floating-assistant">
      {open && (
        <div className="floating-assistant-panel">
          <div className="floating-assistant-head">
            <span>🤖 NegotiAI Help</span>
            <button className="close-btn" onClick={() => setOpen(false)} aria-label="Close chat">✕</button>
          </div>
          <div className="floating-assistant-body">
            <AssistantChat
              endpoint="/api/assistant/buyer"
              placeholder="Ask a question..."
              emptyText="Ask me how quotes, negotiation, or invoices work — or about your own orders."
              suggestions={["How does negotiation work?", "Where do I see my invoices?", "How many active deals do I have?"]}
            />
          </div>
        </div>
      )}
      <button className="floating-assistant-btn" onClick={() => setOpen((o) => !o)} aria-label="Open help chat">
        {open ? "✕" : "💬"}
      </button>
    </div>
  );
}

function DealIntelligence() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/deal-intelligence")
      .then((res) => res.json())
      .then((data) => setStats(data.stats))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const header = (
    <>
      <h2 className="panel-title">AI Deal Intelligence</h2>
      <p className="panel-sub">What your negotiation agent actually did for you — every number below is computed from real deals, not estimates.</p>
    </>
  );

  if (loading) return <div className="main">{header}<div className="card"><p className="empty" style={{ padding: "8px 0" }}>Crunching your negotiation data...</p></div></div>;
  if (!stats) return <div className="main">{header}<div className="error-box">Couldn't load deal intelligence.</div></div>;

  if (stats.total_deals === 0) {
    return (
      <div className="main">{header}
        <div className="card"><p className="empty" style={{ padding: "8px 0" }}>
          No deals yet. Once buyers request quotes and negotiate with your agent, this dashboard fills in automatically.
        </p></div>
        <SellerAssistantCard />
      </div>
    );
  }

  const discountRoomUsed = stats.max_discount_pct > 0
    ? Math.min(100, Math.round((stats.avg_discount_pct / stats.max_discount_pct) * 100))
    : 0;
  const maxFunnel = Math.max(1, stats.funnel.quote_sent, stats.funnel.negotiating, stats.funnel.confirmed, stats.funnel.invoiced);
  const funnelRows = [
    { label: "Quote sent", val: stats.funnel.quote_sent, color: "var(--text-soft)" },
    { label: "Negotiating", val: stats.funnel.negotiating, color: "var(--amber)" },
    { label: "Confirmed", val: stats.funnel.confirmed, color: "var(--success)" },
    { label: "Invoiced", val: stats.funnel.invoiced, color: "var(--ink)" },
  ];

  return (
    <div className="main">
      {header}

      <div className="di-hero">
        <div className="di-hero-main">
          <WinRateDonut pct={stats.win_rate} />
          <div>
            <div className="di-hero-label">Negotiations handled by your agent</div>
            <div className="di-hero-value">{stats.negotiated_deals}</div>
            <div className="di-hero-sub">
              {stats.closed_deals} deal{stats.closed_deals === 1 ? "" : "s"} closed · ₹{stats.closed_revenue.toLocaleString("en-IN")} in closed revenue
              {stats.avg_rounds_to_close > 0 && <> · avg {stats.avg_rounds_to_close} exchanges to close</>}
            </div>
          </div>
        </div>
        <div className="di-hero-gauge">
          <div className="di-hero-label" style={{ color: "var(--text-soft)" }}>Margin protected by the agent</div>
          <div className="di-gauge-value">₹{stats.margin_protected.toLocaleString("en-IN")}</div>
          <div className="di-bar-track">
            <div className="di-bar-fill" style={{ width: `${discountRoomUsed}%`, background: "var(--amber)" }} />
          </div>
          <p className="collection-caption">
            Agent gave an avg <strong>{stats.avg_discount_pct}%</strong> discount — using {discountRoomUsed}% of the {stats.max_discount_pct}% room you allowed. The rest stayed as margin.
          </p>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card accent-success">
          <div className="stat-icon">🎯</div>
          <div className="stat-label">Win Rate</div>
          <div className="stat-value success">{stats.win_rate}%</div>
        </div>
        <div className="stat-card accent-amber">
          <div className="stat-icon">🤝</div>
          <div className="stat-label">Avg Discount Given</div>
          <div className="stat-value">{stats.avg_discount_pct}%</div>
        </div>
        <div className="stat-card accent-ink">
          <div className="stat-icon">💬</div>
          <div className="stat-label">Avg Exchanges to Close</div>
          <div className="stat-value">{stats.avg_rounds_to_close || "—"}</div>
        </div>
        <div className="stat-card accent-danger">
          <div className="stat-icon">💸</div>
          <div className="stat-label">Savings Passed to Buyers</div>
          <div className="stat-value">₹{stats.total_discount_given.toLocaleString("en-IN")}</div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontFamily: "Fraunces, serif", fontSize: "16px", margin: "0 0 16px" }}>Deal Funnel</h3>
        {funnelRows.map((r) => (
          <div key={r.label} className="di-funnel-row">
            <div className="di-funnel-label">{r.label}</div>
            <div className="di-funnel-bar">
              <div className="di-funnel-fill" style={{ width: `${Math.max(6, (r.val / maxFunnel) * 100)}%`, background: r.color }}>
                {r.val}
              </div>
            </div>
          </div>
        ))}
      </div>

      {stats.top_negotiated_product && (
        <div className="di-insight">
          💡 Your most-negotiated product is <strong>{stats.top_negotiated_product}</strong> ({stats.top_negotiated_count} negotiation{stats.top_negotiated_count === 1 ? "" : "s"}).
          Buyers push hardest here — worth reviewing its price and discount tiers in Seller Setup.
        </div>
      )}

      <SellerAssistantCard />
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

function ProfilePage({ user, theme, onToggleTheme }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  async function submitPasswordChange(e) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation don't match.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to change password");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSaved(true);
      showToast("Password updated");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="main">
      <h2 className="panel-title">Profile</h2>
      <p className="panel-sub">Your account details and preferences.</p>

      <div className="card">
        <h3 style={{ fontFamily: "Fraunces, serif", fontSize: "16px", margin: "0 0 16px" }}>Account</h3>
        <div className="quote-line"><span>{user.role === "seller" ? "Company / seller name" : "Company / name"}</span><span>{user.name}</span></div>
        <div className="quote-line"><span>Username</span><span>{user.username}</span></div>
        <div className="quote-line"><span>Role</span><span style={{ textTransform: "capitalize" }}>{user.role}</span></div>
        <div className="quote-line"><span>Mobile</span><span>{user.mobile || "Not set"}</span></div>
        <div className="quote-line"><span>Email</span><span>{user.email || "Not set"}</span></div>
      </div>

      <div className="card">
        <h3 style={{ fontFamily: "Fraunces, serif", fontSize: "16px", margin: "0 0 16px" }}>Appearance</h3>
        <div className="quote-line">
          <span>Theme</span>
          <button type="button" className="btn ghost" style={{ padding: "6px 16px" }} onClick={onToggleTheme}>
            {theme === "dark" ? "☀️ Switch to light" : "🌙 Switch to dark"}
          </button>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontFamily: "Fraunces, serif", fontSize: "16px", margin: "0 0 16px" }}>Change Password</h3>
        <form onSubmit={submitPasswordChange}>
          <label>Current password</label>
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" required />
          <label>New password</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 8 characters" autoComplete="new-password" required />
          <label>Confirm new password</label>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" required />
          {error && <div className="error-box">{error}</div>}
          {saved && <p style={{ color: "var(--success)", fontSize: "13px" }}>Password updated successfully.</p>}
          <button className="btn" type="submit" disabled={saving} style={{ marginTop: "8px" }}>
            {saving ? "Saving..." : "Update Password"}
          </button>
        </form>
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
  const [waitCounts, setWaitCounts] = useState({});
  const [shopDescription, setShopDescription] = useState("");
  const [activeDealId, setActiveDealId] = useState(null);
  const [deals, setDeals] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [messagesDealId, setMessagesDealId] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }

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
    setWaitCounts(data.wait_counts || {});
  }

  async function loadDeals() {
    const res = await fetch("/api/deals");
    if (!res.ok) return;
    const data = await res.json();
    setDeals(data.deals || []);
  }

  // Merges a single deal we already fetched (e.g. right after a negotiate
  // turn) into the list in place — avoids a full /api/deals round trip just
  // to refresh one row's "X% off" preview.
  function patchDeal(id, patch) {
    setDeals((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
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
      showToast("New quote created — negotiate or confirm it");
      handleQuoteCreated(data.deal_id);
    } catch (err) {
      showToast(err.message || "Reorder failed", "error");
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
      <ToastHost />
      <Topbar
        user={user}
        tab={tab}
        setTab={setTab}
        onLogout={handleLogout}
        newOrderCount={newOrderCount}
        unreadMessages={unreadMessages}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenProfile={() => setTab("profile")}
      />
      {tab === "setup" && <SellerSetup catalog={catalog} rules={rules} shopDescription={shopDescription} waitCounts={waitCounts} onSaved={loadSetup} />}
      {tab === "rfq" && <RFQForm onQuoteCreated={handleQuoteCreated} />}
      {tab === "negotiate" && (
        <NegotiationChat deals={deals} dealId={activeDealId} onSelectDeal={setActiveDealId} onDealPatched={patchDeal} />
      )}
      {tab === "pipeline" && <Pipeline deals={deals} refresh={loadDeals} onMessage={openMessages} />}
      {tab === "orders" && <Pipeline deals={deals} refresh={loadDeals} readOnly onReorder={handleReorder} onMessage={openMessages} />}
      {tab === "messages" && <MessagesView key={messagesDealId || "inbox"} user={user} initialDealId={messagesDealId} />}
      {tab === "insights" && <DealIntelligence />}
      {tab === "finance" && <FinanceTab />}
      {tab === "audit" && <AuditLogTab />}
      {tab === "profile" && <ProfilePage user={user} theme={theme} onToggleTheme={toggleTheme} />}
      {user.role === "buyer" && <FloatingBuyerAssistant />}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
