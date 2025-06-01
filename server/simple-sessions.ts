import { db } from "./db";
import { trainingSessions, rpeSubmissions, users } from "@shared/schema";
import { gte, desc, eq } from "drizzle-orm";

export async function getSimpleTrainingSessions() {
  console.log("=== UNIFIED SESSIONS: Using authentic athlete training data ===");
  
  // Get total number of athletes
  const athletes = await db.select({ id: users.id }).from(users).where(eq(users.role, 'athlete'));
  const athleteCount = athletes.length;
  
  // Query the unified view using pool.query
  const { pool } = await import("./db");
  const queryResult = await pool.query(`
    SELECT session_date, type, participants, avg_rpe, session_load
    FROM session_metrics_from_entries
    ORDER BY session_date DESC
  `);
  const sessionsFromEntries = queryResult.rows as Array<{
    session_date: Date,
    type: string,
    participants: number,
    avg_rpe: number,
    session_load: number
  }>;
  
  console.log(`UNIFIED: Found ${sessionsFromEntries.length} sessions from authentic athlete data`);
  
  const results = sessionsFromEntries.map((session) => {
    const dateStr = new Date(session.session_date).toISOString().split('T')[0];
    const sessionKey = `${dateStr}-${session.type} Training-1`;
    
    const result = {
      id: sessionKey,
      date: dateStr,
      trainingType: session.type,
      sessionNumber: 1,
      rpe: Number(session.avg_rpe),
      participantCount: Number(session.participants),
      totalAthletes: athleteCount,
      duration: 60, // Default duration from view calculation
      load: Math.round(session.session_load)
    };
    
    console.log(`UNIFIED: ${result.id} = ${result.load} AU (${result.participantCount} athletes)`);
    return result;
  });
  
  return results;
}