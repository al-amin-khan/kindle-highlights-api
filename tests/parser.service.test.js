const { parseMyClippings } = require("../src/services/parser.service");

const SAMPLE = `
==========
Why We Sleep: Unlocking the Power of Sleep and Dreams (Matthew Walker)
- Your Highlight on Location 1091-1094 | Added on Sunday, July 9, 2023 1:42:46 AM

the brain has found an ingenious way to obtain sleep.
==========
Atomic Habits (James Clear)
- Your Highlight on page 23 | Added on Sunday, July 9, 2023 1:42:46 AM

Tiny changes make remarkable results.
==========
অ্যাটমিক হ্যাবিটস (জেমস ক্লিয়ার)
- Your Highlight on Location 12-13 | Added on Sunday, July 9, 2023 1:42:46 AM

ছোট অভ্যাস বড় পরিবর্তন আনে।
`;

describe("parseMyClippings", () => {
    it("parses entries and detects language", () => {
        const { entries, errors } = parseMyClippings(SAMPLE);
        expect(errors.length).toBe(0);
        expect(entries.length).toBe(3);

        const e1 = entries[0];
        expect(e1.bookTitle).toMatch(/^Why We Sleep/);
        expect(e1.author).toBe("Matthew Walker");
        expect(e1.location).toBe("1091-1094");
        expect(e1.page).toBeNull || expect(e1.page).toBe(undefined);
        expect(e1.content).toMatch(/ingenious way/);
        expect(e1.lang).toBe("en");
        expect(e1.hashId).toHaveLength(64);

        const e3 = entries[2];
        expect(e3.lang).toBe("bn");
        expect(e3.content).toMatch(/ছোট অভ্যাস/);
    });
});
