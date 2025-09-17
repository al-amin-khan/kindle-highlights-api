const router = require("express").Router();
const { authenticate } = require("../middlewares/auth");
const ctrl = require("../controllers/auth.controller");

/**
 * @swagger
 * /auth/bootstrap:
 *   post:
 *     summary: Create first admin (one-time) using ADMIN_BOOTSTRAP_TOKEN
 *     tags: [Auth]
 */
router.post("/bootstrap", ctrl.bootstrap);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login (get access + refresh tokens)
 *     tags: [Auth]
 */
router.post("/login", ctrl.login);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 */
router.post("/refresh", ctrl.refresh);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout (revoke refresh token)
 *     tags: [Auth]
 */
router.post("/logout", ctrl.logout);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Current user
 *     security: [{ bearerAuth: [] }]
 *     tags: [Auth]
 */
router.get("/me", authenticate, ctrl.me);

module.exports = router;
