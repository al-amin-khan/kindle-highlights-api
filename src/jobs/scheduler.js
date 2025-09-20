const cron = require("node-cron");
const {
    DAILY_WINDOW_MODE,
    TZ,
    ENABLE_LOCAL_SCHEDULER,
} = require("../config");
const {
    ensureDailySet,
    getWindowInfo,
} = require("../services/selection.service");

let scheduled = false;

async function runSelection(tag = "manual") {
    const { doc, start, end } = await ensureDailySet();
    const when = new Date().toISOString();
    console.log(
        `[cron] ${tag} selection ensured @ ${when} (key=${doc.key}, tz=${TZ}, window=${start}->${end})`
    );
    return { doc, start, end };
}

function initScheduler() {
    if (!ENABLE_LOCAL_SCHEDULER) {
        console.log(
            "[cron] local scheduler disabled (ENABLE_LOCAL_SCHEDULER=false)"
        );
        return;
    }

    if (scheduled) {
        return;
    }

    const expression =
        DAILY_WINDOW_MODE === "daily" ? "0 0 * * *" : "0 0,12 * * *";
    const tag = DAILY_WINDOW_MODE === "daily" ? "daily" : "halfday";

    cron.schedule(expression, () => runSelection(tag), {
        timezone: TZ,
    });

    scheduled = true;
    const { key } = getWindowInfo();
    console.log(
        `[cron] scheduler initialized (mode=${DAILY_WINDOW_MODE}, tz=${TZ}, currentKey=${key})`
    );
}

module.exports = { initScheduler, runSelection };
