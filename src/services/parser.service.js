const { DateTime } = require("luxon");
const crypto = require("crypto");

/**
 * Detects Bengali vs English using Unicode ranges.
 */
function detectLang(str) {
    if (!str) return "en";
    // Bengali block: 0x0980–0x09FF
    return /[\u0980-\u09FF]/.test(str) ? "bn" : "en";
}

/**
 * Parse the title line:
 *  "Why We Sleep: Unlocking the Power of Sleep and Dreams (Matthew Walker)"
 * Returns { bookTitle, author }
 * If no "(Author)" trailing group, author=null.
 */
function parseTitleLine(lineRaw) {
    const line = (lineRaw || "").trim();
    if (!line) return { bookTitle: null, author: null };

    // Extract the last "(...)" as author; if title itself has parentheses earlier, this still works.
    const m = line.match(/^(.*)\s+\(([^()]+)\)\s*$/);
    if (m) {
        return { bookTitle: m[1].trim(), author: m[2].trim() };
    }
    return { bookTitle: line, author: null };
}

/**
 * Parse the metadata line, examples:
 * "- Your Highlight on Location 1091-1094 | Added on Sunday, July 9, 2023 1:42:46 AM"
 * "- Your Highlight on page 23 | Added on Sunday, July 9, 2023 1:42:46 AM"
 *
 * Returns { location, page, dateAdded }
 */
function parseMetaLine(metaRaw) {
    const meta = (metaRaw || "").trim();
    if (!meta) return { location: null, page: null, dateAdded: null };

    let location = null;
    let page = null;
    let dateAdded = null;

    // Split around '|'
    const parts = meta.split("|").map((s) => s.trim());

    // Left part: "... Location 1091-1094" OR "... page 23"
    const left = (parts[0] || "").toLowerCase();
    // Right part: "Added on Sunday, July 9, 2023 1:42:46 AM"
    const right = parts.slice(1).join(" | "); // in case of extra pipes

    // Extract location or page
    // Use case-insensitive checks; keep original numbers as string
    const locMatch = meta.match(/Location\s+([0-9\-–]+)/i);
    if (locMatch) location = String(locMatch[1]).replace("–", "-").trim();

    const pageMatch = meta.match(/page\s+([0-9\-–]+)/i);
    if (!location && pageMatch)
        page = String(pageMatch[1]).replace("–", "-").trim();

    // Extract "Added on <dateStr>"
    let dateStr = null;
    const addIdx = right.toLowerCase().indexOf("added on");
    if (addIdx >= 0) {
        dateStr = right.slice(addIdx + "added on".length).trim();
    } else {
        // Try whole meta if not found on right
        const idx2 = meta.toLowerCase().indexOf("added on");
        if (idx2 >= 0) dateStr = meta.slice(idx2 + "added on".length).trim();
    }

    if (dateStr) {
        // Common Kindle format: "Sunday, July 9, 2023 1:42:46 AM"
        let dt = DateTime.fromFormat(dateStr, "cccc, LLLL d, yyyy h:mm:ss a", {
            zone: "utc",
        });
        if (!dt.isValid) {
            // Some entries may omit seconds: "Sunday, July 9, 2023 1:42 AM"
            dt = DateTime.fromFormat(dateStr, "cccc, LLLL d, yyyy h:mm a", {
                zone: "utc",
            });
        }
        if (!dt.isValid) {
            // Fallback to Date parser
            const jsd = new Date(dateStr);
            if (!isNaN(jsd.getTime())) {
                dateAdded = jsd;
            }
        } else {
            dateAdded = dt.toJSDate();
        }
    }

    return { location, page, dateAdded };
}

/**
 * Split the clippings file into entries by "==========" boundaries
 * and parse each record to a structured object.
 */
function parseMyClippings(textRaw) {
    // Normalize line endings, remove BOM
    let text = textRaw || "";
    if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
    text = text.replace(/\r\n/g, "\n");

    // Kindle uses "==========" as separator line
    const chunks = text
        .split(/^\s*={10,}\s*$/m)
        .map((c) => c.trim())
        .filter(Boolean);

    const entries = [];
    const errors = [];

    for (let i = 0; i < chunks.length; i++) {
        const block = chunks[i];
        const lines = block.split("\n");

        // Expected:
        // 0: Title (Author)
        // 1: - Your Highlight on Location ... | Added on ...
        // 2: (blank)
        // 3..n: content
        const titleLine = lines[0] || "";
        const metaLine = lines[1] || "";
        const contentLines = lines.slice(2).filter((_, idx) => true); // keep blanks in content

        const { bookTitle, author } = parseTitleLine(titleLine);
        const { location, page, dateAdded } = parseMetaLine(metaLine);

        // Skip up to first blank line in content, then take the rest
        let firstContentIdx = 2;
        while (
            firstContentIdx < lines.length &&
            (lines[firstContentIdx] || "").trim() === ""
        ) {
            firstContentIdx++;
        }
        const content = lines.slice(firstContentIdx).join("\n").trim();

        if (!content) {
            errors.push({
                index: i,
                reason: "Empty content",
                titleLine,
                metaLine,
            });
            continue;
        }

        const lang = detectLang(content);

        // Build hashId for dedupe: content + bookTitle + location
        const hashSource = `${content}|${bookTitle || ""}|${location || ""}`;
        const hashId = crypto
            .createHash("sha256")
            .update(hashSource, "utf8")
            .digest("hex");

        entries.push({
            bookTitle,
            author,
            location,
            page,
            dateAdded,
            content,
            lang,
            source: "kindle",
            hashId,
        });
    }

    return { entries, errors };
}

module.exports = {
    parseMyClippings,
};
