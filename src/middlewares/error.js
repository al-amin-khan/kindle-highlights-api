module.exports = function errorHandler(err, req, res, next) {
    // eslint-disable-next-line no-console
    console.error("[error]", err);
    const status = err.status || 500;
    res.status(status).json({
        error: err.message || "Internal Server Error",
    });
};
