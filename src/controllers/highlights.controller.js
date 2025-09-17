const { DateTime } = require("luxon");
const mongoose = require("mongoose");
const Highlight = require("../models/Highlight");

/** helpers */
function parseBool(v, def = false) {
    if (v === undefined) return def;
    const s = String(v).toLowerCase();
    return s === "1" || s === "true" || s === "yes";
}
function parseIntBound(v, def, min, max) {
    const n = parseInt(v, 10);
    if (Number.isNaN(n)) return def;
    return Math.min(Math.max(n, min), max);
}
function parseDate(v) {
    if (!v) return null;
    // accepts ISO or yyyy-mm-dd
    const dt = DateTime.fromISO(v, { zone: "utc" });
    return dt.isValid ? dt.toJSDate() : null;
}

/**
 * GET /api/v1/highlights
 * Admin-only. Full-text & field filters + pagination + sorting.
 *
 * Query:
 *  - q: text search (uses $text on content)
 *  - bookTitle, author: string (case-insensitive contains)
 *  - lang: "en" | "bn" | "en,bn"
 *  - dateFrom, dateTo: ISO or yyyy-mm-dd (filters dateAdded)
 *  - servedFrom, servedTo: ISO or yyyy-mm-dd (filters lastServedAt)
 *  - hasLocation, hasPage: boolean
 *  - sortBy: "dateAdded"|"createdAt"|"lastServedAt"
 *  - sortOrder: "asc"|"desc"  (default desc)
 *  - page: number (1..1e6), limit: number (1..100)  (default 20)
 */
async function listHighlights(req, res, next) {
    try {
        const {
            q,
            bookTitle,
            author,
            lang,
            dateFrom,
            dateTo,
            servedFrom,
            servedTo,
            hasLocation,
            hasPage,
            sortBy = "dateAdded",
            sortOrder = "desc",
            page = "1",
            limit = "20",
            select,
            qMode, // optional: "regex" to force regex search
        } = req.query;

        // base filter (without q)
        const base = {};

        if (bookTitle)
            base.bookTitle = { $regex: String(bookTitle), $options: "i" };
        if (author) base.author = { $regex: String(author), $options: "i" };

        if (lang) {
            const langs = String(lang)
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
            if (langs.length) base.lang = { $in: langs };
        }

        const df = parseDate(dateFrom);
        const dt = parseDate(dateTo);
        if (df || dt) {
            base.dateAdded = {};
            if (df) base.dateAdded.$gte = df;
            if (dt) base.dateAdded.$lte = dt;
        }

        const sf = parseDate(servedFrom);
        const st = parseDate(servedTo);
        if (sf || st) {
            base.lastServedAt = {};
            if (sf) base.lastServedAt.$gte = sf;
            if (st) base.lastServedAt.$lte = st;
        }

        if (hasLocation !== undefined) {
            const b = parseBool(hasLocation);
            base.location = b
                ? { $exists: true, $ne: null }
                : { $in: [null, ""] };
        }
        if (hasPage !== undefined) {
            const b = parseBool(hasPage);
            base.page = b ? { $exists: true, $ne: null } : { $in: [null, ""] };
        }

        // projection
        let projection = {
            bookTitle: 1,
            author: 1,
            content: 1,
            location: 1,
            page: 1,
            dateAdded: 1,
            lang: 1,
            lastServedAt: 1,
            createdAt: 1,
        };
        if (select) {
            projection = {};
            String(select)
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
                .forEach((f) => (projection[f] = 1));
        }

        // sorting & pagination
        const allowedSort = new Set(["dateAdded", "createdAt", "lastServedAt"]);
        const by = allowedSort.has(sortBy) ? sortBy : "dateAdded";
        const order = String(sortOrder).toLowerCase() === "asc" ? 1 : -1;
        const sort = { [by]: order, _id: -1 };

        const pageNum = parseIntBound(page, 1, 1, 1_000_000);
        const limitNum = parseIntBound(limit, 20, 1, 100);
        const skip = (pageNum - 1) * limitNum;

        // Build text and regex filters for q
        const textFilter = q
            ? { ...base, $text: { $search: String(q) } }
            : base;
        const regexFilter = q
            ? {
                  ...base,
                  $or: [
                      { content: { $regex: String(q), $options: "i" } },
                      { bookTitle: { $regex: String(q), $options: "i" } },
                      { author: { $regex: String(q), $options: "i" } },
                  ],
              }
            : base;

        const runQuery = (filter) =>
            Promise.all([
                Highlight.find(filter, projection)
                    .sort(sort)
                    .skip(skip)
                    .limit(limitNum)
                    .lean(),
                Highlight.countDocuments(filter),
            ]);

        let items, total;

        try {
            // If user forces regex, skip $text
            if (String(qMode).toLowerCase() === "regex") {
                [items, total] = await runQuery(regexFilter);
            } else {
                [items, total] = await runQuery(textFilter);
            }
        } catch (err) {
            // Fallback if text index is missing/duplicated
            const msg = String(err?.message || "").toLowerCase();
            if (msg.includes("text index")) {
                [items, total] = await runQuery(regexFilter);
            } else {
                throw err;
            }
        }

        return res.json({
            page: pageNum,
            limit: limitNum,
            total,
            hasNext: skip + items.length < total,
            items: items.map((r) => ({
                id: r._id.toString(),
                ...r,
                dateAdded: r.dateAdded
                    ? new Date(r.dateAdded).toISOString()
                    : null,
                lastServedAt: r.lastServedAt
                    ? new Date(r.lastServedAt).toISOString()
                    : null,
                createdAt: r.createdAt
                    ? new Date(r.createdAt).toISOString()
                    : null,
            })),
        });
    } catch (err) {
        next(err);
    }
}

/**
 * GET /api/v1/highlights/:id
 */
async function getHighlightById(req, res, next) {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id))
            return res.status(400).json({ error: "Invalid id" });
        const r = await Highlight.findById(id).lean();
        if (!r) return res.status(404).json({ error: "Not found" });
        return res.json({
            id: r._id.toString(),
            ...r,
            dateAdded: r.dateAdded ? new Date(r.dateAdded).toISOString() : null,
            lastServedAt: r.lastServedAt
                ? new Date(r.lastServedAt).toISOString()
                : null,
            createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : null,
        });
    } catch (err) {
        next(err);
    }
}

/**
 * GET /api/v1/books
 * Admin-only. Distinct books with counts and latest dateAdded.
 *
 * Query:
 *  - q: search in bookTitle or author
 *  - lang: filter by language(s)
 *  - page, limit (max 100)
 *  - sortBy: "count"|"lastAdded"|"bookTitle" (default: count desc)
 */
async function listBooks(req, res, next) {
    try {
        const {
            q,
            lang,
            page = "1",
            limit = "20",
            sortBy = "count",
            sortOrder = "desc",
        } = req.query;

        const pageNum = parseIntBound(page, 1, 1, 1_000_000);
        const limitNum = parseIntBound(limit, 20, 1, 100);
        const skip = (pageNum - 1) * limitNum;

        const match = {};
        if (q) {
            match.$or = [
                { bookTitle: { $regex: String(q), $options: "i" } },
                { author: { $regex: String(q), $options: "i" } },
            ];
        }
        if (lang) {
            const langs = String(lang)
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
            if (langs.length) match.lang = { $in: langs };
        }

        const sortField = (() => {
            switch (sortBy) {
                case "bookTitle":
                    return { bookTitle: sortOrder === "asc" ? 1 : -1 };
                case "lastAdded":
                    return { lastAdded: sortOrder === "asc" ? 1 : -1 };
                default:
                    return { count: sortOrder === "asc" ? 1 : -1 };
            }
        })();

        const pipeline = [
            { $match: match },
            {
                $group: {
                    _id: { bookTitle: "$bookTitle", author: "$author" },
                    count: { $sum: 1 },
                    lastAdded: { $max: "$dateAdded" },
                    langs: { $addToSet: "$lang" },
                },
            },
            {
                $project: {
                    _id: 0,
                    bookTitle: "$_id.bookTitle",
                    author: "$_id.author",
                    count: 1,
                    lastAdded: 1,
                    langs: 1,
                },
            },
            { $sort: sortField },
            { $skip: skip },
            { $limit: limitNum },
        ];

        const [items, totalAgg] = await Promise.all([
            Highlight.aggregate(pipeline),
            Highlight.aggregate([
                { $match: match },
                { $group: { _id: { bt: "$bookTitle", a: "$author" } } },
                { $count: "total" },
            ]),
        ]);

        const total = totalAgg[0]?.total || 0;

        return res.json({
            page: pageNum,
            limit: limitNum,
            total,
            hasNext: skip + items.length < total,
            items: items.map((x) => ({
                ...x,
                lastAdded: x.lastAdded
                    ? new Date(x.lastAdded).toISOString()
                    : null,
            })),
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    listHighlights,
    getHighlightById,
    listBooks,
};
