import { MongoClient, ServerApiVersion } from "mongodb";

// Shared connection string for the MongoDB Atlas cluster; set via .env (MONGO_URI).
const uri = String(process.env.MONGO_URI);

// Single shared client/connection pool for the whole app — import `client`/`db` rather than
// constructing a new MongoClient elsewhere, so requests reuse the same pooled connections.
export const client = new MongoClient(uri, {
    maxIdleTimeMS: 30_000,
    socketTimeoutMS: 30_000,
    connectTimeoutMS: 150_000,
    maxConnecting: 400,
    maxPoolSize: 50,
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

// Default database from the connection string (bank-voice-admin).
export const db = client.db();

/**
 * Shape of a document in the 'reported-notations' collection, grouping every report submitted
 * for a given service type. NOTE: reportNote() in app/lib/actions.ts currently upserts by
 * matching on a `service` field, not `serviceType` — so in practice stored documents end up with
 * a `service` field and each report lands in its own document instead of grouping here.
 */
export type ReportedNotation = {
    serviceType: string,
    reports: Report[]
}

/** A single flagged/reported notation submitted by a rep via the "Report" button in NotationForm. */
export type Report = {
    /** Employee ID of the rep who submitted the report. */
    eid: string,
    reason: string,
    action: string
    /** The full generated notation text, exactly as it would be copied to the customer's account. */
    fullNote: string
}