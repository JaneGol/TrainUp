import type { Express, Request, Response } from "express";
import { storage } from "./storage";

export function setupCsvExportRoutes(app: Express) {
  
  // Helper function to convert array of objects to CSV
  const arrayToCSV = (data: any[], headers: string[]): string => {
    const csvRows = [];
    
    // Add headers
    csvRows.push(headers.join(','));
    
    // Add data rows
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        // Handle nested objects, arrays, and escape commas/quotes
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  };

  // Export athlete wellness data as CSV
  app.get('/api/export/wellness-csv', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== 'coach') {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied. Only coaches can export data.' 
        });
      }

      // Get all athletes and their wellness data
      const athletes = await storage.getAthletes();
      const wellnessData: any[] = [];

      for (const athlete of athletes) {
        const diaries = await storage.getMorningDiariesByUserId(athlete.id);
        
        for (const diary of diaries) {
          wellnessData.push({
            athlete_id: athlete.id,
            athlete_name: athlete.username,
            date: new Date(diary.createdAt).toISOString().split('T')[0],
            sleep_quality: diary.sleepQuality,
            sleep_hours: diary.sleepHours,
            stress_level: diary.stressLevel,
            mood: diary.mood,
            recovery_level: diary.recoveryLevel,
            readiness_score: diary.readinessScore,
            has_injury: diary.hasInjury,
            pain_level: diary.painLevel || 0,
            injury_improving: diary.injuryImproving || '',
            symptoms: Array.isArray(diary.symptoms) ? diary.symptoms.join(';') : diary.symptoms,
            soreness_notes: diary.sorenessNotes || ''
          });
        }
      }

      const headers = [
        'athlete_id', 'athlete_name', 'date', 'sleep_quality', 'sleep_hours', 
        'stress_level', 'mood', 'recovery_level', 'readiness_score', 
        'has_injury', 'pain_level', 'injury_improving', 'symptoms', 'soreness_notes'
      ];

      const csv = arrayToCSV(wellnessData, headers);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="wellness_data_${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csv);

    } catch (error) {
      console.error('Error exporting wellness data:', error);
      res.status(500).json({
        success: false,
        message: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  });

  // Export training data as CSV
  app.get('/api/export/training-csv', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== 'coach') {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied. Only coaches can export data.' 
        });
      }

      // Get all athletes and their training data
      const athletes = await storage.getAllAthletes();
      const trainingData: any[] = [];

      for (const athlete of athletes) {
        const entries = await storage.getTrainingEntriesByUserId(athlete.id);
        
        for (const entry of entries) {
          trainingData.push({
            athlete_id: athlete.id,
            athlete_name: athlete.username,
            date: new Date(entry.createdAt).toISOString().split('T')[0],
            training_type: entry.trainingType,
            duration: entry.duration,
            effort_level: entry.effortLevel,
            emotional_load: entry.emotionalLoad,
            calculated_load: (entry.effortLevel + entry.emotionalLoad) / 2,
            notes: entry.notes || ''
          });
        }
      }

      const headers = [
        'athlete_id', 'athlete_name', 'date', 'training_type', 'duration', 
        'effort_level', 'emotional_load', 'calculated_load', 'notes'
      ];

      const csv = arrayToCSV(trainingData, headers);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="training_data_${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csv);

    } catch (error) {
      console.error('Error exporting training data:', error);
      res.status(500).json({
        success: false,
        message: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  });

  // Export analytics summary as CSV
  app.get('/api/export/analytics-csv', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== 'coach') {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied. Only coaches can export data.' 
        });
      }

      // Get all athletes and calculate their analytics
      const athletes = await storage.getAllAthletes();
      const analyticsData: any[] = [];

      for (const athlete of athletes) {
        const trainingEntries = await storage.getTrainingEntriesByUserId(athlete.id);
        const diaries = await storage.getMorningDiariesByUserId(athlete.id);
        
        // Calculate basic metrics
        const totalSessions = trainingEntries.length;
        const avgEffortLevel = totalSessions > 0 
          ? trainingEntries.reduce((sum, entry) => sum + entry.effortLevel, 0) / totalSessions 
          : 0;
        
        const latestDiary = diaries[0]; // Assuming sorted by date desc
        const avgReadiness = diaries.length > 0 
          ? diaries.reduce((sum, diary) => sum + (diary.readinessScore || 0), 0) / diaries.length 
          : 0;

        analyticsData.push({
          athlete_id: athlete.id,
          athlete_name: athlete.username,
          total_training_sessions: totalSessions,
          avg_effort_level: Math.round(avgEffortLevel * 100) / 100,
          avg_readiness_score: Math.round(avgReadiness * 100) / 100,
          latest_readiness: latestDiary?.readinessScore || 0,
          latest_mood: latestDiary?.mood || 'neutral',
          latest_recovery: latestDiary?.recoveryLevel || 'moderate',
          last_training_date: trainingEntries[0]?.createdAt ? new Date(trainingEntries[0].createdAt).toISOString().split('T')[0] : '',
          last_diary_date: latestDiary?.createdAt ? new Date(latestDiary.createdAt).toISOString().split('T')[0] : ''
        });
      }

      const headers = [
        'athlete_id', 'athlete_name', 'total_training_sessions', 'avg_effort_level', 
        'avg_readiness_score', 'latest_readiness', 'latest_mood', 'latest_recovery',
        'last_training_date', 'last_diary_date'
      ];

      const csv = arrayToCSV(analyticsData, headers);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="analytics_summary_${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csv);

    } catch (error) {
      console.error('Error exporting analytics data:', error);
      res.status(500).json({
        success: false,
        message: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  });
}