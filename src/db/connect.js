const mongoose = require("mongoose");
const { MongoClient, ServerApiVersion } = require("mongodb");
const { MONGO_URI, MONGO_DB_NAME } = require("../config");

async function connectDB() {
    if (!MONGO_URI) throw new Error("MONGO_URI missing in env");

    // 1) Native driver connection + ping (as per official doc)
    const client = new MongoClient(MONGO_URI, {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        },
    });

    console.log("[db] (native) connecting & pinging ...");
    try {
        await client.connect();
        await client.db("admin").command({ ping: 1 });
        console.log("[db] (native) Pinged your deployment. Connection OK!");
    } catch (err) {
        console.error(
            "[db] (native) connection/ping failed:",
            err?.message || err
        );
        throw err; // stop here if ping fails
    } finally {
        await client.close().catch(() => {});
    }

    // 2) Mongoose connection using the same Stable API options
    //    If your SRV URI lacks a default db, we pass dbName.
    console.log("[db] (mongoose) connecting ...");
    await mongoose.connect(MONGO_URI, {
        dbName: MONGO_DB_NAME || undefined,
        serverApi: { version: "1", strict: true, deprecationErrors: true },
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 30000,
    });

    console.log("[db] (mongoose) connected");
    console.log('[db] (mongoose) connected to DB:', mongoose.connection?.db?.databaseName);

}

module.exports = { connectDB };
