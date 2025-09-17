const Highlight = require("../models/Highlight");
const DailySet = require("../models/DailySet");
const { parseMyClippings } = require("../services/parser.service");
const {
    ensureDailySet,
    getWindowInfo,
} = require("../services/selection.service");

// existing importClippings unchanged
async function importClippings(req, res, next) {
    try {
        const dryRun =
            String(req.query.dryRun || "false").toLowerCase() === "true";
        if (!req.file || !req.file.buffer) {
            return res
                .status(400)
                .json({
                    error: 'No file uploaded. Use form-data with key "file".',
                });
        }
        const raw = req.file.buffer.toString("utf8");
        const { entries, errors } = parseMyClippings(raw);
        if (entries.length === 0 && errors.length > 0) {
            return res
                .status(422)
                .json({ error: "Parse failed for all entries", errors });
        }
        if (dryRun) {
            return res.json({
                dryRun: true,
                parsedCount: entries.length,
                sample: entries.slice(0, 3),
                errors,
            });
        }
        const ops = entries.map((e) => ({
            updateOne: {
                filter: { hashId: e.hashId },
                update: { $setOnInsert: { ...e } },
                upsert: true,
            },
        }));
        const result = await Highlight.bulkWrite(ops, { ordered: false });
        const upserted = result.upsertedCount || 0;
        const duplicates = result.matchedCount || 0;
        return res.json({
            parsedCount: entries.length,
            insertedCount: upserted,
            duplicateCount: duplicates,
            errorCount: errors.length,
            errors,
        });
    } catch (err) {
        return next(err);
    }
}

// NEW: show current window status
async function dailyStatus(req, res, next) {
    try {
        const { key, start, end } = getWindowInfo();
        const doc = await DailySet.findOne({ key }).lean();
        const totalHighlights = await Highlight.estimatedDocumentCount();
        res.json({
            key,
            timezone: require("../config").TZ,
            window: { start: start.toISO(), end: end.toISO() },
            hasDailySet: !!doc,
            dailySetSize: doc ? doc.highlightIds?.length || 0 : 0,
            totalHighlights,
        });
    } catch (err) {
        next(err);
    }
}

// NEW: force rebuild the current window's set
async function dailyReset(req, res, next) {
    try {
        const { key } = getWindowInfo();
        await DailySet.deleteOne({ key });
        const { doc } = await ensureDailySet();
        res.json({
            message: "Daily set regenerated",
            key: doc.key,
            size: doc.highlightIds.length,
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    importClippings,
    dailyStatus,
    dailyReset,
};
