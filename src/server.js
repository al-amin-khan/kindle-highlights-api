require("dotenv").config();
const { PORT, NODE_ENV } = require("./config");
const { connectDB } = require("./db/connect");
const app = require("./app");
const { initScheduler } = require("./jobs/scheduler");

let bootstrapPromise;

async function bootstrap(options = {}) {
    const { withScheduler = false } = options;

    if (!bootstrapPromise) {
        bootstrapPromise = connectDB().catch((err) => {
            bootstrapPromise = null;
            throw err;
        });
    }

    await bootstrapPromise;

    if (withScheduler) {
        initScheduler();
    }

    return app;
}

if (require.main === module) {
    bootstrap({ withScheduler: true })
        .then(() => {
            app.listen(PORT, () => {
                console.log(`[server] ${NODE_ENV} server listening on :${PORT}`);
            });
        })
        .catch((err) => {
            console.error("[server] fatal:", err);
            process.exit(1);
        });
}

module.exports = async (req, res) => {
    try {
        await bootstrap();
        return app(req, res);
    } catch (err) {
        console.error("[server] handler error:", err);
        res.statusCode = 500;
        res.end("Internal Server Error");
    }
};

module.exports.bootstrap = bootstrap;
