const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
const {
    signAccessToken,
    signRefreshToken,
    persistRefreshToken,
    revokeRefreshToken,
    verifyRefreshToken,
} = require("../services/token.service");
const { ADMIN_BOOTSTRAP_TOKEN } = require("../config");

/**
 * POST /api/v1/auth/bootstrap
 * Body: { token, email, password }
 * One-time: Creates the first admin user when no users exist.
 */
async function bootstrap(req, res) {
    const { token, email, password } = req.body || {};
    if (!token || token !== ADMIN_BOOTSTRAP_TOKEN) {
        return res.status(403).json({ error: "Forbidden" });
    }
    const count = await User.countDocuments();
    if (count > 0)
        return res.status(400).json({ error: "Already initialized" });
    const passwordHash = await User.hashPassword(password);
    const user = await User.create({ email, passwordHash, roles: ["admin"] });
    return res.json({
        message: "Admin created",
        user: { id: user._id, email: user.email },
    });
}

/**
 * POST /api/v1/auth/login
 * Body: { email, password }
 */
async function login(req, res) {
    const { email, password } = req.body || {};
    const user = await User.findOne({ email: (email || "").toLowerCase() });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });
    const accessToken = signAccessToken(user);
    const { token: refreshToken, expiresAt } = signRefreshToken(user);
    await persistRefreshToken(user, refreshToken, expiresAt, {
        userAgent: req.headers["user-agent"],
        ip: req.ip,
    });
    return res.json({ accessToken, refreshToken });
}

/**
 * POST /api/v1/auth/refresh
 * Body: { refreshToken }
 */
async function refresh(req, res) {
    const { refreshToken } = req.body || {};
    if (!refreshToken)
        return res.status(400).json({ error: "Missing refreshToken" });
    const payload = await verifyRefreshToken(refreshToken);
    const user = await User.findById(payload.sub);
    if (!user || !user.isActive)
        return res.status(401).json({ error: "Invalid user" });
    const accessToken = signAccessToken(user);
    return res.json({ accessToken });
}

/**
 * POST /api/v1/auth/logout
 * Body: { refreshToken }
 */
async function logout(req, res) {
    const { refreshToken } = req.body || {};
    if (refreshToken) await revokeRefreshToken(refreshToken);
    return res.json({ message: "Logged out" });
}

/**
 * GET /api/v1/auth/me
 * Header: Authorization: Bearer <accessToken>
 */
async function me(req, res) {
    return res.json({ user: { id: req.user.id, roles: req.user.roles } });
}

module.exports = { bootstrap, login, refresh, logout, me };
