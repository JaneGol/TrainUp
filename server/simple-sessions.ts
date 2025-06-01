import { db } from "./db";
import { trainingSessions, rpeSubmissions, users } from "@shared/schema";
import { gte, desc, eq } from "drizzle-orm";

export async function getSimpleTrainingSessions() {
  console.log("=== SIMPLE SESSIONS: Direct database access ===");
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  // Get sessions directly from database
  const sessions = await db
    .select()
    .from(trainingSessions)
    .where(gte(trainingSessions.sessionDate, thirtyDaysAgo))
    .orderBy(desc(trainingSessions.sessionDate));
  
  console.log(`SIMPLE: Found ${sessions.length} sessions in database`);
  
  // Get total number of athletes
  const athletes = await db.select({ id: users.id }).from(users).where(eq(users.role, 'athlete'));
  const athleteCount = athletes.length;
  
  const results = await Promise.all(sessions.map(async (session) => {
    // Get RPE submissions for this session
    const submissions = await db
      .select({ rpe: rpeSubmissions.rpe })
      .from(rpeSubmissions)
      .where(eq(rpeSubmissions.sessionId, session.id));
    
    // Calculate average RPE - return null when no submissions
    const avgRPE = submissions.length > 0 
      ? submissions.reduce((sum, sub) => sum + sub.rpe, 0) / submissions.length 
      : null;
    
    const dateStr = new Date(session.sessionDate).toISOString().split('T')[0];
    const sessionKey = `${dateStr}-${session.type} Training-${session.sessionNumber}`;
    
    const result = {
      id: sessionKey,
      date: dateStr,
      type: `${session.type} Training`,
      sessionNumber: session.sessionNumber,
      avgRPE: avgRPE !== null ? Number(avgRPE.toFixed(1)) : null,
      participants: submissions.length,
      totalAthletes: athleteCount,
      duration: session.durationMinutes,
      calculatedAU: Math.round(session.sessionLoad || 0)
    };
    
    console.log(`SIMPLE: ${result.id} = ${result.calculatedAU} AU`);
    return result;
  }));
  
  return results;
}