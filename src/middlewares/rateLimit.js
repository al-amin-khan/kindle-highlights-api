const rateLimit = require("express-rate-limit");
const {
    PUBLIC_RATE_LIMIT_WINDOW_MS,
    PUBLIC_RATE_LIMIT_MAX,
} = require("../config");

const publicLimiter = rateLimit({
    windowMs: PUBLIC_RATE_LIMIT_WINDOW_MS,
    max: PUBLIC_RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later." },
});

module.exports = { publicLimiter };
