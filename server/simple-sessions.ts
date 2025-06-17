import { db } from "./db";
import { trainingSessions, rpeSubmissions, users } from "@shared/schema";
import { gte, desc, eq, and } from "drizzle-orm";

export async function getSimpleTrainingSessions(teamId?: number) {
  console.log("=== UNIFIED SESSIONS: Using authentic athlete training data ===");
  
  // Get athletes filtered by team
  const athletes = teamId !== undefined 
    ? await db.select({ id: users.id }).from(users).where(and(eq(users.role, 'athlete'), eq(users.teamId, teamId)))
    : await db.select({ id: users.id }).from(users).where(eq(users.role, 'athlete'));
  const athleteCount = athletes.length;
  
  // Query training entries and filter by team athletes
  const { pool } = await import("./db");
  
  let queryResult;
  if (teamId !== undefined) {
    // Get athlete IDs for this team only
    const athleteIds = athletes.map(a => a.id);
    if (athleteIds.length === 0) {
      // No athletes in this team
      queryResult = { rows: [] };
    } else {
      // Filter by team athletes
      const placeholders = athleteIds.map((_, index) => `$${index + 1}`).join(',');
      queryResult = await pool.query(`
        SELECT DATE(te.date) as session_date, te.training_type as type, te.session_number, 
               COUNT(*) as participants, AVG(te.effort_level) as avg_rpe, 
               SUM(te.training_load) as session_load
        FROM training_entries te
        WHERE te.user_id IN (${placeholders})
        GROUP BY DATE(te.date), te.training_type, te.session_number
        ORDER BY DATE(te.date) DESC, te.training_type, te.session_number
      `, athleteIds);
    }
  } else {
    // Get all data
    queryResult = await pool.query(`
      SELECT session_date, type, session_number, participants, avg_rpe, session_load
      FROM session_metrics_from_entries
      ORDER BY session_date DESC, type, session_number
    `);
  }
  const sessionsFromEntries = queryResult.rows as Array<{
    session_date: Date,
    type: string,
    session_number: number,
    participants: number,
    avg_rpe: number,
    session_load: number
  }>;
  
  console.log(`UNIFIED: Found ${sessionsFromEntries.length} sessions from authentic athlete data`);
  
  const results = sessionsFromEntries.map((session) => {
    const dateStr = new Date(session.session_date).toISOString().split('T')[0];
    const sessionKey = `${dateStr}-${session.type} Training-${session.session_number}`;
    
    const result = {
      id: sessionKey,
      date: dateStr,
      trainingType: session.type,
      sessionNumber: session.session_number,
      rpe: Number(Number(session.avg_rpe).toFixed(1)),
      participantCount: Number(session.participants),
      totalAthletes: athleteCount,
      duration: 60, // Default duration from view calculation
      load: Math.round(session.session_load / session.participants) // Average load per athlete
    };
    
    console.log(`UNIFIED: ${result.id} = ${result.load} AU (${result.participantCount} athletes)`);
    return result;
  });
  
  return results;
}