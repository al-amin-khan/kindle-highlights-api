const mongoose = require("mongoose");

/**
 * Example fields matched to your sample:
 * bookTitle: "Why We Sleep: Unlocking the Power of Sleep and Dreams"
 * author: "Matthew Walker"
 * location: "1091-1094" or "1186-1186"
 * dateAdded: Date
 * content: actual text
 * lang: "bn" | "en" (optional; we can guess later)
 * source: "kindle"
 * hashId: deterministic hash for dedupe (content+book+location)
 * lastServedAt: last time included in a daily set
 */
const HighlightSchema = new mongoose.Schema(
    {
        bookTitle: { type: String, index: true },
        author: { type: String, index: true },
        location: { type: String, index: true },
        page: { type: String },
        dateAdded: { type: Date, index: true },
        content: { type: String, required: true, text: true },
        source: { type: String, default: "kindle" },
        lang: { type: String },
        hashId: { type: String, unique: true, index: true },
        lastServedAt: { type: Date, index: true },
    },
    { timestamps: true }
);

HighlightSchema.index({ bookTitle: 1, author: 1 });


module.exports = mongoose.model("Highlight", HighlightSchema);
