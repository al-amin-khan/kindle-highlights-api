function parseTrustProxy(value) {
    if (value === undefined) {
        return process.env.VERCEL ? 1 : false;
    }

    if (value === "false" || value === "0") {
        return false;
    }

    if (value === "true") {
        return true;
    }

    const numeric = Number(value);
    if (!Number.isNaN(numeric)) {
        return numeric;
    }

    return value;
}

function parseInteger(value, fallback, options = {}) {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) {
        return fallback;
    }

    const { min, max } = options;
    if (typeof min === "number" && parsed < min) {
        return min;
    }
    if (typeof max === "number" && parsed > max) {
        return max;
    }

    return parsed;
}

const ORIGINS = (process.env.CORS_ORIGINS || "*")
    .split(",")
    .map((s) => s.trim());

const CORS_OPTIONS = {
    origin: ORIGINS.length === 1 && ORIGINS[0] === "*" ? true : ORIGINS,
    credentials: false,
};

module.exports = {
    PORT: process.env.PORT || 8080,
    NODE_ENV: process.env.NODE_ENV || "development",
    MONGO_URI: process.env.MONGO_URI,
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    ACCESS_TOKEN_TTL: process.env.ACCESS_TOKEN_TTL || "15m",
    REFRESH_TOKEN_TTL: process.env.REFRESH_TOKEN_TTL || "30d",
    PUBLIC_DAILY_DEFAULT_LIMIT: parseInteger(
        process.env.PUBLIC_DAILY_DEFAULT_LIMIT,
        10,
        { min: 1 }
    ),
    PUBLIC_DAILY_MAX_LIMIT: parseInteger(
        process.env.PUBLIC_DAILY_MAX_LIMIT,
        10,
        { min: 1 }
    ),
    PUBLIC_RATE_LIMIT_WINDOW_MS: parseInteger(
        process.env.PUBLIC_RATE_LIMIT_WINDOW_MS,
        60000,
        { min: 1 }
    ),
    PUBLIC_RATE_LIMIT_MAX: parseInteger(
        process.env.PUBLIC_RATE_LIMIT_MAX,
        60,
        { min: 1 }
    ),
    TRUST_PROXY: parseTrustProxy(process.env.TRUST_PROXY),
    CORS_OPTIONS,
    ADMIN_BOOTSTRAP_TOKEN: process.env.ADMIN_BOOTSTRAP_TOKEN,
    DAILY_WINDOW_MODE: process.env.DAILY_WINDOW_MODE || "daily", // daily|halfday
    TZ: process.env.TZ || "Asia/Dhaka",
    NO_REPEAT_DAYS: parseInteger(process.env.NO_REPEAT_DAYS, 15, { min: 0 }),
    ENABLE_LOCAL_SCHEDULER: process.env.ENABLE_LOCAL_SCHEDULER === "true",
};
