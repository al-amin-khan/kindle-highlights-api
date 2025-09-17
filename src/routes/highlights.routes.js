const router = require("express").Router();
const { authenticate, authorize } = require("../middlewares/auth");
const {
    listHighlights,
    getHighlightById,
    listBooks,
} = require("../controllers/highlights.controller");

/**
 * @swagger
 * /highlights:
 *   get:
 *     summary: Search/list highlights (admin)
 *     security: [{ bearerAuth: [] }]
 *     tags: [Highlights]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: Full-text search on content
 *       - in: query
 *         name: bookTitle
 *         schema: { type: string }
 *       - in: query
 *         name: author
 *         schema: { type: string }
 *       - in: query
 *         name: lang
 *         schema: { type: string }
 *         description: CSV e.g. "en,bn"
 *       - in: query
 *         name: dateFrom
 *         schema: { type: string }
 *       - in: query
 *         name: dateTo
 *         schema: { type: string }
 *       - in: query
 *         name: servedFrom
 *         schema: { type: string }
 *       - in: query
 *         name: servedTo
 *         schema: { type: string }
 *       - in: query
 *         name: hasLocation
 *         schema: { type: boolean }
 *       - in: query
 *         name: hasPage
 *         schema: { type: boolean }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [dateAdded, createdAt, lastServedAt] }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [asc, desc] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100 }
 *     responses:
 *       200:
 *         description: Paginated results
 */
router.get("/highlights", authenticate, authorize("admin"), listHighlights);

/**
 * @swagger
 * /highlights/{id}:
 *   get:
 *     summary: Get a single highlight by id (admin)
 *     security: [{ bearerAuth: [] }]
 *     tags: [Highlights]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 */
router.get(
    "/highlights/:id",
    authenticate,
    authorize("admin"),
    getHighlightById
);

/**
 * @swagger
 * /books:
 *   get:
 *     summary: List books (admin) with counts
 *     security: [{ bearerAuth: [] }]
 *     tags: [Books]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *       - in: query
 *         name: lang
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100 }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [count, lastAdded, bookTitle] }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [asc, desc] }
 *     responses:
 *       200:
 *         description: Paginated book list
 */
router.get("/books", authenticate, authorize("admin"), listBooks);

module.exports = router;
