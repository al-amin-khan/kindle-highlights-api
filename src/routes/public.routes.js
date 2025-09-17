const router = require("express").Router();
const { publicLimiter } = require("../middlewares/rateLimit");
const ctrl = require("../controllers/public.controller");

/**
 * @swagger
 * /public/highlights/daily:
 *   get:
 *     summary: Public daily highlights (rate limited)
 *     tags: [Public]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 10 }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DailyPublicResponse'
 */
router.get("/highlights/daily", publicLimiter, ctrl.dailyHighlights);

module.exports = router;
