const mongoose = require("mongoose");
const { MONGO_URI, MONGO_DB_NAME } = require("../config");

const globalKey = "__kh_mongoose_connection";
let cached = globalThis[globalKey];

if (!cached) {
    cached = { promise: null, connection: null };
    globalThis[globalKey] = cached;
}

async function connectDB() {
    if (!MONGO_URI) throw new Error("MONGO_URI missing in env");

    if (cached.connection && mongoose.connection.readyState === 1) {
        return cached.connection;
    }

    if (!cached.promise) {
        cached.promise = mongoose
            .connect(MONGO_URI, {
                dbName: MONGO_DB_NAME || undefined,
                serverApi: { version: "1", strict: true, deprecationErrors: true },
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 30000,
            })
            .then((mongooseInstance) => {
                cached.connection = mongooseInstance.connection;
                const dbName = cached.connection?.db?.databaseName;
                console.log(
                    dbName
                        ? `[db] (mongoose) connected to DB: ${dbName}`
                        : "[db] (mongoose) connected"
                );
                return cached.connection;
            })
            .catch((err) => {
                cached.promise = null;
                throw err;
            });
    }

    return cached.promise;
}

module.exports = { connectDB };
