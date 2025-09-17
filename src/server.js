require("dotenv").config();
const { PORT, NODE_ENV } = require("./config");
const { connectDB } = require("./db/connect");
const app = require("./app");
const { initScheduler } = require("./jobs/scheduler");

(async () => {
    try {
        await connectDB();
        initScheduler();
        app.listen(PORT, () => {
            console.log(`[server] ${NODE_ENV} server listening on :${PORT}`);
        });
    } catch (err) {
        console.error("[server] fatal:", err);
        process.exit(1);
    }
})();
