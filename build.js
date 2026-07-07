// Precompiles public/app.jsx (JSX) into public/app.built.js (plain JS)
// using Babel at build time — no client-side Babel/eval needed at all.
// This avoids any conflict with browser extensions that hook eval() or
// scan/inject <script> tags on the page.

const babel = require("@babel/core");
const fs = require("fs");
const path = require("path");

const srcPath = path.join(__dirname, "public", "app.jsx");
const outPath = path.join(__dirname, "public", "app.built.js");

const source = fs.readFileSync(srcPath, "utf8");
const result = babel.transform(source, {
  presets: ["@babel/preset-react"],
  filename: "app.jsx",
});

fs.writeFileSync(outPath, result.code, "utf8");
console.log(`Built ${outPath} (${result.code.length} bytes)`);

// Vendor React locally so the app never depends on a CDN (unpkg, etc.) —
// avoids both flaky networks and any browser extension that interferes
// with third-party script loads.
const vendorDir = path.join(__dirname, "public", "vendor");
fs.mkdirSync(vendorDir, { recursive: true });
fs.copyFileSync(
  path.join(__dirname, "node_modules", "react", "umd", "react.production.min.js"),
  path.join(vendorDir, "react.production.min.js")
);
fs.copyFileSync(
  path.join(__dirname, "node_modules", "react-dom", "umd", "react-dom.production.min.js"),
  path.join(vendorDir, "react-dom.production.min.js")
);
console.log(`Vendored React into ${vendorDir}`);
