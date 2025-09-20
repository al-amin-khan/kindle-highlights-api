const { bootstrap } = require("../src/server");
const { runSelection } = require("../src/jobs/scheduler");

module.exports = async (req, res) => {
    if (req.method !== "GET" && req.method !== "POST") {
        res.statusCode = 405;
        res.setHeader("Allow", "GET, POST");
        res.end("Method Not Allowed");
        return;
    }

    try {
        await bootstrap();
        const { doc } = await runSelection("vercel-cron");

        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.end(
            JSON.stringify({ ok: true, windowKey: doc.key }, null, 2)
        );
    } catch (err) {
        console.error("[cron] handler error:", err);
        res.statusCode = 500;
        res.end("Cron execution failed");
    }
};
