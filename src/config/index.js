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
    PUBLIC_DAILY_DEFAULT_LIMIT: parseInt(
        process.env.PUBLIC_DAILY_DEFAULT_LIMIT || "5",
        10
    ),
    PUBLIC_DAILY_MAX_LIMIT: parseInt(
        process.env.PUBLIC_DAILY_MAX_LIMIT || "10",
        10
    ),
    PUBLIC_RATE_LIMIT_WINDOW_MS: parseInt(
        process.env.PUBLIC_RATE_LIMIT_WINDOW_MS || "60000",
        10
    ),
    PUBLIC_RATE_LIMIT_MAX: parseInt(
        process.env.PUBLIC_RATE_LIMIT_MAX || "60",
        10
    ),
    CORS_OPTIONS,
    ADMIN_BOOTSTRAP_TOKEN: process.env.ADMIN_BOOTSTRAP_TOKEN,
    DAILY_WINDOW_MODE: process.env.DAILY_WINDOW_MODE || "daily",  // daily|halfday
    TZ: process.env.TZ || "Asia/Dhaka",
    NO_REPEAT_DAYS: parseInt(process.env.NO_REPEAT_DAYS || '15', 10),
};
