const { DateTime } = require("luxon");
const {
    __test__,
    getWindowInfo,
} = require("../src/services/selection.service");

describe("deterministicShuffle", () => {
    it("is stable for same key and different for different keys", () => {
        const a = Array.from({ length: 10 }, (_, i) => i + 1);
        const s1 = __test__.deterministicShuffle(a, "2025-09-17").join(",");
        const s2 = __test__.deterministicShuffle(a, "2025-09-17").join(",");
        const s3 = __test__.deterministicShuffle(a, "2025-09-18").join(",");
        expect(s1).toBe(s2);
        expect(s1).not.toBe(s3);
    });
});

describe("getWindowInfo", () => {
    it("daily returns full-day boundaries at midnight Asia/Dhaka", () => {
        const now = DateTime.fromISO("2025-09-17T10:15:00", {
            zone: "Asia/Dhaka",
        });
        const { key, start, end } = getWindowInfo(now);
        // key is the Dhaka calendar date
        expect(key).toBe("2025-09-17");
        // Start should be midnight in Dhaka (00:00 at +06:00)
        const startDhaka = start.setZone("Asia/Dhaka");
        expect(startDhaka.toISO()).toMatch(/^2025-09-17T00:00:00/);
        expect(end.diff(start, "hours").hours).toBe(24);
    });
});
