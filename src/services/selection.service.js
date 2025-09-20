const { DateTime } = require("luxon");
const mongoose = require("mongoose");
const Highlight = require("../models/Highlight");
const DailySet = require("../models/DailySet");
const {
    TZ,
    DAILY_WINDOW_MODE,
    PUBLIC_DAILY_MAX_LIMIT,
    NO_REPEAT_DAYS,
} = require("../config");

/** Seeded RNG helpers: xmur3 (hash) + mulberry32 (RNG) */
function xmur3(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
        h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
        h = (h << 13) | (h >>> 19);
    }
    return function () {
        h = Math.imul(h ^ (h >>> 16), 2246822507);
        h = Math.imul(h ^ (h >>> 13), 3266489909);
        h ^= h >>> 16;
        return h >>> 0;
    };
}
function mulberry32(a) {
    return function () {
        let t = (a += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

let warnedInvalidZone = false;

function getZonedNow() {
    const zoned = DateTime.now().setZone(TZ);
    if (zoned.isValid) {
        return zoned;
    }

    if (!warnedInvalidZone) {
        console.warn(
            `[time] invalid timezone ${TZ} detected; falling back to system zone`
        );
        warnedInvalidZone = true;
    }

    return DateTime.now();
}

function ensureZoned(dateTimeLike) {
    if (dateTimeLike && typeof dateTimeLike.setZone === "function") {
        const zoned = dateTimeLike.setZone(TZ);
        if (zoned.isValid) {
            return zoned;
        }
    }

    return getZonedNow();
}

/** Compute current window (daily or halfday) in configured TZ */
function getWindowInfo(now) {
    const current = ensureZoned(now);
    const dayStart = current.startOf("day");

    if (DAILY_WINDOW_MODE === "halfday") {
        const isFirstHalf = current.hour < 12;
        const start = isFirstHalf ? dayStart : dayStart.plus({ hours: 12 });
        const end = isFirstHalf
            ? dayStart.plus({ hours: 12 })
            : dayStart.plus({ days: 1 });
        const key = `${dayStart.toISODate()}_${isFirstHalf ? "00" : "12"}`;
        return { key, start, end };
    }

    const start = dayStart;
    const end = dayStart.plus({ days: 1 });
    const key = dayStart.toISODate();
    return { key, start, end };
}

/** Deterministic shuffle using seed derived from key */
function deterministicShuffle(array, key) {
    const seed = xmur3(key)();
    const rand = mulberry32(seed);
    const a = array.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

/**
 * Ensure a DailySet exists for the current window.
 * - Pick up to PUBLIC_DAILY_MAX_LIMIT highlights
 * - Exclude lastServedAt within NO_REPEAT_DAYS if possible
 * - Deterministic order per window key
 * - Update lastServedAt for selected
 */
async function ensureDailySet() {
    const { key, start, end } = getWindowInfo();

    // Already computed?
    let doc = await DailySet.findOne({ key }).lean();
    if (doc) return { doc, start, end };

    const repeatWindowDays = Number.isFinite(NO_REPEAT_DAYS)
        ? NO_REPEAT_DAYS
        : 0;
    const now = getZonedNow();
    const cutoff = now.minus({ days: repeatWindowDays }).toJSDate();

    // Prefer highlights not seen in the last NO_REPEAT_DAYS (or never seen)
    const preferred = await Highlight.find({
        $or: [
            { lastServedAt: { $exists: false } },
            { lastServedAt: { $lt: cutoff } },
        ],
    })
        .select("_id")
        .lean();

    let candidateIds = preferred.map((x) => x._id.toString());

    // If not enough, include the rest as fallback
    if (candidateIds.length < PUBLIC_DAILY_MAX_LIMIT) {
        const fallback = await Highlight.find({
            _id: {
                $nin: candidateIds.map((id) => new mongoose.Types.ObjectId(id)),
            },
        })
            .select("_id")
            .lean();
        candidateIds = candidateIds.concat(
            fallback.map((x) => x._id.toString())
        );
    }

    // Deterministic shuffle by window key
    const shuffled = deterministicShuffle(candidateIds, key);

    // Final pick (up to max)
    const pickIds = shuffled
        .slice(0, PUBLIC_DAILY_MAX_LIMIT)
        .map((id) => new mongoose.Types.ObjectId(id));

    // Save DailySet
    doc = await DailySet.create({
        key,
        tz: TZ,
        limit: PUBLIC_DAILY_MAX_LIMIT,
        highlightIds: pickIds,
    });

    // Update lastServedAt for picked highlights
    if (pickIds.length > 0) {
        await Highlight.updateMany(
            { _id: { $in: pickIds } },
            { $set: { lastServedAt: new Date() } }
        );
    }

    // Return lean version
    const leanDoc = {
        _id: doc._id,
        key: doc.key,
        tz: doc.tz,
        limit: doc.limit,
        highlightIds: doc.highlightIds.map((id) => id.toString()),
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
    };

    return { doc: leanDoc, start, end };
}

module.exports = {
    getWindowInfo,
    ensureDailySet,
    // test-only helpers (pure, no DB)
    __test__: { deterministicShuffle },
};
