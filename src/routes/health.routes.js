const router = require("express").Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Service health check
 *     tags: [Health]
 */
router.get("/", (req, res) => {
    res.json({ ok: true, uptime: process.uptime() });
});

module.exports = router;
