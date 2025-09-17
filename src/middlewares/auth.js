const jwt = require("jsonwebtoken");
const { JWT_ACCESS_SECRET } = require("../config");

function authenticate(req, res, next) {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Missing token" });
    try {
        const payload = jwt.verify(token, JWT_ACCESS_SECRET);
        req.user = { id: payload.sub, roles: payload.roles || [] };
        return next();
    } catch (e) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
}

function authorize(...allowed) {
    return (req, res, next) => {
        const roles = req.user?.roles || [];
        const ok = roles.some((r) => allowed.includes(r));
        if (!ok) return res.status(403).json({ error: "Forbidden" });
        next();
    };
}

module.exports = { authenticate, authorize };
