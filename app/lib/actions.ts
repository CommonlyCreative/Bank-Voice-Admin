'use server'

import { db, Report, ReportedNotation } from "@/lib/mongo";

/**
 * Persists a flagged notation to the 'reported-notations' collection so it shows up in the
 * admin panel. Upserts on `service` — if no document matches, one is created and the report
 * appended to its `reports` array; otherwise the report is pushed onto the existing document.
 * Runs as a Next.js Server Action (see 'use server' above), so it's safe to call directly from
 * client components (NotationForm's submitReport) without exposing the Mongo connection.
 */
export async function reportNote(service: string, report: Report) {
    const response = await db.collection<ReportedNotation>('reported-notations').findOneAndUpdate({ service }, { $push: { reports: report } }, { upsert: true, returnDocument: 'after' })
    // Round-trips through JSON to strip Mongo-specific types (e.g. ObjectId) so the result is a
    // plain, serializable object safe to return across the server/client boundary.
    return JSON.parse(JSON.stringify(response)) as ReportedNotation & { _id: string };
}