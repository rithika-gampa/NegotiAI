const store = require("../store");

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

// POST /api/auth/signup  { username, password, role, name, email?, mobile? }
async function signup(req, res) {
  const { username, password, role, name, email, mobile } = req.body;

  if (!username || !password || !name) {
    return res.status(400).json({ error: "username, password, and name are required" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }
  if (!["buyer", "seller"].includes(role)) {
    return res.status(400).json({ error: 'role must be "buyer" or "seller"' });
  }

  try {
    if (await store.findUserByUsername(username)) {
      return res.status(409).json({ error: "That username is already taken" });
    }
    const user = await store.createUser({ username, password, role, name, email, mobile });
    req.session.userId = user.id;
    res.json({ user: store.toPublicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(409).json({ error: err.message });
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
    if (new_password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
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
  login,
  logout,
  me,
  forgotPassword,
  resetPassword,
  requireAuth,
  requireRole,
};
