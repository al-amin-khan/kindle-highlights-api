const {
    PUBLIC_DAILY_DEFAULT_LIMIT,
    PUBLIC_DAILY_MAX_LIMIT,
    TZ,
} = require("../config");
const {
    ensureDailySet,
    getWindowInfo,
} = require("../services/selection.service");
const Highlight = require("../models/Highlight");

const IS_TEST =
    process.env.NODE_ENV === "test" ||
    String(process.env.TEST_MODE).toLowerCase() === "true";

function secondsUntil(dt) {
    const ms = dt.toMillis() - Date.now();
    return Math.max(0, Math.floor(ms / 1000));
}

async function dailyHighlights(req, res, next) {
    try {
        if (IS_TEST) {
            const asked = parseInt(
                req.query.limit || `${PUBLIC_DAILY_DEFAULT_LIMIT}`,
                10
            );
            const limit = Math.min(
                isNaN(asked) ? PUBLIC_DAILY_DEFAULT_LIMIT : asked,
                PUBLIC_DAILY_MAX_LIMIT
            );
            const items = Array.from({ length: limit }, (_, i) => ({
                id: `test_${i + 1}`,
                bookTitle: "Test Book",
                author: "Test Author",
                content: `Sample highlight ${i + 1}`,
                location: null,
                page: null,
                dateAdded: null,
            }));

            return res.json({
                windowKey: "test",
                date: "1970-01-01",
                timezone: TZ,
                count: items.length,
                highlights: items,
            });
        }
        // Ensure the set exists for this window (generate if missing)
        const { doc, start, end } = await ensureDailySet();
        const asked = parseInt(
            req.query.limit || `${PUBLIC_DAILY_DEFAULT_LIMIT}`,
            10
        );
        const limit = Math.min(
            isNaN(asked) ? PUBLIC_DAILY_DEFAULT_LIMIT : asked,
            PUBLIC_DAILY_MAX_LIMIT
        );

        const ids = (doc.highlightIds || []).slice(0, limit);
        if (ids.length === 0) {
            // No highlights in DB yet
            const maxAge = secondsUntil(end);
            res.set("Cache-Control", `public, max-age=${maxAge}`);
            return res.json({
                windowKey: doc.key,
                date: doc.key.split("_")[0],
                timezone: TZ,
                count: 0,
                highlights: [],
            });
        }

        // Fetch & preserve selection order
        const mapIndex = new Map(ids.map((id, i) => [id.toString(), i]));
        const rows = await Highlight.find({ _id: { $in: ids } }).lean();
        rows.sort(
            (a, b) =>
                mapIndex.get(a._id.toString()) - mapIndex.get(b._id.toString())
        );

        const items = rows.map((r) => ({
            id: r._id.toString(),
            bookTitle: r.bookTitle || null,
            author: r.author || null,
            content: r.content,
            location: r.location || null,
            page: r.page || null,
            dateAdded: r.dateAdded ? new Date(r.dateAdded).toISOString() : null,
        }));

        // Cache until the window boundary (so clients/CDNs can cache confidently)
        const maxAge = secondsUntil(end);
        res.set("Cache-Control", `public, max-age=${maxAge}`);
        res.set("X-Window-Key", doc.key);

        return res.json({
            windowKey: doc.key, // e.g., 2025-09-17 or 2025-09-17_12
            date: doc.key.split("_")[0], // for convenience
            timezone: TZ,
            count: items.length,
            highlights: items,
        });
    } catch (err) {
        next(err);
    }
}

module.exports = { dailyHighlights };
