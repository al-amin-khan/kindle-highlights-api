const mongoose = require("mongoose");

const RefreshTokenSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        token: { type: String, required: true, index: true },
        expiresAt: { type: Date, required: true },
        revokedAt: { type: Date, default: null },
        userAgent: { type: String },
        ip: { type: String },
    },
    { timestamps: true }
);

module.exports = mongoose.model("RefreshToken", RefreshTokenSchema);
