const jwt = require("jsonwebtoken");
const { DateTime } = require("luxon");
const RefreshToken = require("../models/RefreshToken");
const {
    JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET,
    ACCESS_TOKEN_TTL,
    REFRESH_TOKEN_TTL,
} = require("../config");

function signAccessToken(user) {
    const payload = { sub: user._id.toString(), roles: user.roles || [] };
    return jwt.sign(payload, JWT_ACCESS_SECRET, {
        expiresIn: ACCESS_TOKEN_TTL,
    });
}

function signRefreshToken(user) {
    const payload = { sub: user._id.toString() };
    const token = jwt.sign(payload, JWT_REFRESH_SECRET, {
        expiresIn: REFRESH_TOKEN_TTL,
    });
    const expiresAt = DateTime.now().plus({ days: 30 }).toJSDate(); // matches default 30d
    return { token, expiresAt };
}

async function persistRefreshToken(user, token, expiresAt, meta = {}) {
    return RefreshToken.create({
        user: user._id,
        token,
        expiresAt,
        userAgent: meta.userAgent,
        ip: meta.ip,
    });
}

async function revokeRefreshToken(token) {
    const doc = await RefreshToken.findOne({ token, revokedAt: null });
    if (doc) {
        doc.revokedAt = new Date();
        await doc.save();
    }
}

async function verifyRefreshToken(token) {
    const payload = jwt.verify(token, JWT_REFRESH_SECRET);
    const doc = await RefreshToken.findOne({ token, revokedAt: null });
    if (!doc) throw new Error("Refresh token invalid or revoked");
    return payload; // contains sub
}

module.exports = {
    signAccessToken,
    signRefreshToken,
    persistRefreshToken,
    revokeRefreshToken,
    verifyRefreshToken,
};
