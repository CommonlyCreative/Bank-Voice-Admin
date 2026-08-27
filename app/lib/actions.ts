'use server'

import { db, Report, ReportedNotation } from "@/lib/mongo";

export async function reportNote(service: string, report: Report) {
    const response = await db.collection<ReportedNotation>('reported-notations').findOneAndUpdate({ service }, { $push: { reports: report } }, { upsert: true, returnDocument: 'after' })
    return JSON.parse(JSON.stringify(response)) as ReportedNotation & { _id: string };
}