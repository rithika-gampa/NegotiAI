const store = require("../store");
const { isMailConfigured, sendOtpEmail } = require("../mailer");

// Short-lived cache of session users so every API request doesn't pay a
// full DB round trip just to re-load the same unchanged user row — on a
// remote Postgres that single lookup adds ~hundreds of ms to EVERY call.
// 60s is short enough that role/name edits (which the app doesn't even
// offer) would still propagate quickly.
const USER_CACHE_TTL_MS = 60 * 1000;
const userCache = new Map(); // userId -> { user, at }

async function getSessionUser(userId) {
  const hit = userCache.get(userId);
  if (hit && Date.now() - hit.at < USER_CACHE_TTL_MS) return hit.user;
  const user = await store.findUserById(userId);
  if (user) userCache.set(userId, { user, at: Date.now() });
  else userCache.delete(userId);
  return user;
}

// Masks a contact value for display ("you@company.com" -> "yo•••@company.com",
// "9876543210" -> "•••••43210").
function maskDestination(target, value) {
  if (target === "email") {
    const [name, domain] = value.split("@");
    if (!domain) return value;
    const shown = name.slice(0, 2);
    return `${shown}${"•".repeat(Math.max(1, name.length - 2))}@${domain}`;
  }
  const digits = value.replace(/\D/g, "");
  return "•".repeat(Math.max(0, digits.length - 4)) + digits.slice(-4);
}

// POST /api/auth/signup  { username, password, role, name, email?, mobile? }
//
// OTP verification is TEMPORARILY DISABLED (the account is verified + logged
// in immediately without a code) — re-enable later by restoring the "issue
// OTP + pending_verification" block that used to live here (see
// verifyOtp/resendOtp below, and mailer.js / store.createOtpCode /
// store.verifyOtpCode, all still intact and unused). Mobile is still a
// required field; only the verification step is skipped.
async function signup(req, res) {
  const { username, password, role, name, email, mobile } = req.body;

  if (!username || !password || !name) {
    return res.status(400).json({ error: "username, password, and name are required" });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }
  if (!["buyer", "seller"].includes(role)) {
    return res.status(400).json({ error: 'role must be "buyer" or "seller"' });
  }
  if (!mobile || !/^\d{10}$/.test(String(mobile).trim())) {
    return res.status(400).json({ error: "Mobile number is required and must be exactly 10 digits" });
  }
  if (email && !/^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(String(email).trim())) {
    return res.status(400).json({ error: "Email must be a Gmail address ending in @gmail.com" });
  }

  try {
    if (await store.findUserByUsername(username)) {
      return res.status(409).json({ error: "That username is already taken" });
    }
    const user = await store.createUser({ username, password, role, name, email, mobile });
    await store.markUserVerified(user.id, "auto");
    req.session.userId = user.id;
    res.json({ user: store.toPublicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(409).json({ error: err.message });
  }
}

// POST /api/auth/verify-otp  { user_id, code }
async function verifyOtp(req, res) {
  try {
    const { user_id, code } = req.body;
    if (!user_id || !code) return res.status(400).json({ error: "user_id and code are required" });

    const result = await store.verifyOtpCode(user_id, code);
    if (result === "expired") return res.status(400).json({ error: "That code has expired. Request a new one." });
    if (result !== "ok") return res.status(400).json({ error: "That code isn't right. Check and try again." });

    const user = await store.findUserById(user_id);
    if (!user) return res.status(404).json({ error: "Account not found" });
    req.session.userId = user.id; // now verified — log them in
    res.json({ user: store.toPublicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Verification failed" });
  }
}

// POST /api/auth/resend-otp  { user_id }
async function resendOtp(req, res) {
  try {
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ error: "user_id is required" });
    const user = await store.findUserById(user_id);
    if (!user) return res.status(404).json({ error: "Account not found" });

    const target = user.email ? "email" : "mobile";
    const destination = user.email || user.mobile;
    if (!destination) return res.status(400).json({ error: "No contact on file to verify" });
    const code = await store.createOtpCode(user.id, target, destination);
    const delivered = target === "email" ? await sendOtpEmail(destination, code, user.name) : false;
    res.json({
      target,
      destination_masked: maskDestination(target, destination),
      delivered,
      demo_code: delivered ? undefined : code,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not resend code" });
  }
}

// POST /api/auth/login  { identifier, password }
// identifier can be a username, email, or mobile number.
async function login(req, res) {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: "identifier and password are required" });
    }

    const user = await store.findUserByIdentifier(identifier);
    if (!user || !store.verifyPassword(user, password)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    req.session.userId = user.id;
    res.json({ user: store.toPublicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
}

// POST /api/auth/logout
function logout(req, res) {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ ok: true });
  });
}

// GET /api/auth/me
async function me(req, res) {
  try {
    if (!req.session.userId) return res.json({ user: null });
    const user = await getSessionUser(req.session.userId);
    res.json({ user: store.toPublicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load session" });
  }
}

// POST /api/auth/forgot-password  { identifier }
// There's no real email provider wired up in this demo, so the reset token
// is returned directly in the response instead of being emailed — that
// keeps the whole flow testable without an inbox. A real deployment would
// email/SMS this token instead of returning it.
async function forgotPassword(req, res) {
  try {
    const { identifier } = req.body;
    if (!identifier) return res.status(400).json({ error: "identifier is required" });

    const user = await store.findUserByIdentifier(identifier);
    if (!user) {
      return res.status(404).json({ error: "No account found with that username, email, or mobile number" });
    }

    const token = await store.createPasswordResetToken(user.id);
    res.json({
      message: "In a live deployment this token would be sent by email or SMS. For this demo, use it directly below.",
      reset_token: token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to start password reset" });
  }
}

// POST /api/auth/reset-password  { token, new_password }
async function resetPassword(req, res) {
  try {
    const { token, new_password } = req.body;
    if (!token || !new_password) {
      return res.status(400).json({ error: "token and new_password are required" });
    }
    if (new_password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const userId = await store.consumePasswordResetToken(token);
    if (!userId) {
      return res.status(400).json({ error: "That reset token is invalid or has expired" });
    }

    await store.updateUserPassword(userId, new_password);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to reset password" });
  }
}

// POST /api/auth/change-password  { current_password, new_password }  (requires auth)
async function changePassword(req, res) {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ error: "current_password and new_password are required" });
    }
    if (new_password.length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters" });
    }
    const user = await store.findUserById(req.user.id);
    if (!store.verifyPassword(user, current_password)) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }
    await store.updateUserPassword(user.id, new_password);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to change password" });
  }
}

// Middleware: require any logged-in user
async function requireAuth(req, res, next) {
  try {
    if (!req.session.userId) return res.status(401).json({ error: "Not logged in" });
    const user = await getSessionUser(req.session.userId);
    if (!user) return res.status(401).json({ error: "Not logged in" });
    req.user = user;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Auth check failed" });
  }
}

// Middleware factory: require a specific role
function requireRole(role) {
  return (req, res, next) => {
    requireAuth(req, res, () => {
      if (req.user.role !== role) {
        return res.status(403).json({ error: `This action requires a ${role} account` });
      }
      next();
    });
  };
}

module.exports = {
  signup,
  verifyOtp,
  resendOtp,
  login,
  logout,
  me,
  forgotPassword,
  resetPassword,
  changePassword,
  requireAuth,
  requireRole,
};
