const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            unique: true,
            required: true,
            lowercase: true,
            trim: true,
        },
        passwordHash: { type: String, required: true },
        roles: { type: [String], default: ["admin"] }, // scalable for future roles
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

UserSchema.methods.comparePassword = async function (plain) {
    return bcrypt.compare(plain, this.passwordHash);
};

UserSchema.statics.hashPassword = async function (plain) {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(plain, salt);
};

module.exports = mongoose.model("User", UserSchema);
