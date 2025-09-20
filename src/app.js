const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const { CORS_OPTIONS, TRUST_PROXY } = require("./config");
const errorHandler = require("./middlewares/error");
const notFound = require("./middlewares/notFound");

const healthRoutes = require("./routes/health.routes");
const authRoutes = require("./routes/auth.routes");
const publicRoutes = require("./routes/public.routes");
const highlightsRoutes = require("./routes/highlights.routes");
const adminRoutes = require("./routes/admin.routes");

const { swaggerUi, swaggerSpec } = require("./config/swagger");

const app = express();

app.set("trust proxy", TRUST_PROXY);

// Security & parsing
app.use(helmet());
app.use(cors(CORS_OPTIONS));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

// Docs
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use("/api/v1/health", healthRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/public", publicRoutes);
app.use("/api/v1", highlightsRoutes);
app.use("/api/v1/admin", adminRoutes);

// 404 + error
app.use(notFound);
app.use(errorHandler);

module.exports = app;
