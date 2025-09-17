const cron = require("node-cron");
const { DAILY_WINDOW_MODE, TZ } = require("../config");
const {
    ensureDailySet,
    getWindowInfo,
} = require("../services/selection.service");

async function runAndLog(tag) {
    const { doc, start, end } = await ensureDailySet();
    const when = new Date().toISOString();
    console.log(
        `[cron] ${tag} selection ensured @ ${when} (key=${doc.key}, tz=${TZ})`
    );
}

function initScheduler() {
    if (DAILY_WINDOW_MODE === "daily") {
        // 00:00 Dhaka
        cron.schedule("0 0 * * *", () => runAndLog("daily"), { timezone: TZ });
    } else {
        // 00:00 & 12:00 Dhaka
        cron.schedule("0 0,12 * * *", () => runAndLog("halfday"), {
            timezone: TZ,
        });
    }
    const { key } = getWindowInfo();
    console.log(
        `[cron] scheduler initialized (mode=${DAILY_WINDOW_MODE}, tz=${TZ}, currentKey=${key})`
    );
}

module.exports = { initScheduler };
