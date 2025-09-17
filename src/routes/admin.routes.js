const router = require("express").Router();
const multer = require("multer");
const { authenticate, authorize } = require("../middlewares/auth");
const { importClippings } = require("../controllers/admin.controller");

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: (req, file, cb) => {
        // Accept text files only
        if (
            file.mimetype === "text/plain" ||
            file.originalname.toLowerCase().endsWith(".txt")
        ) {
            return cb(null, true);
        }
        cb(new Error("Only .txt files are allowed"));
    },
});

/**
 * @swagger
 * /admin/import:
 *   post:
 *     summary: Import Kindle "My Clippings.txt"
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               dryRun:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       200:
 *         description: Import result summary
 */
router.post(
    "/import",
    authenticate,
    authorize("admin"),
    upload.single("file"),
    importClippings
);

module.exports = router;
