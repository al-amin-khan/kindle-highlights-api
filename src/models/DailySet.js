const mongoose = require("mongoose");

/**
 * key: e.g., "2025-09-16" (daily) or "2025-09-16_00"/"2025-09-16_12" (halfday)
 * tz: "Asia/Dhaka"
 * limit: number of items stored
 * highlightIds: [ObjectId]
 */
const DailySetSchema = new mongoose.Schema(
    {
        key: { type: String, unique: true, required: true, index: true },
        tz: { type: String, default: "Asia/Dhaka" },
        limit: { type: Number, default: 10 },
        highlightIds: [
            { type: mongoose.Schema.Types.ObjectId, ref: "Highlight" },
        ],
    },
    { timestamps: true }
);

module.exports = mongoose.model("DailySet", DailySetSchema);
