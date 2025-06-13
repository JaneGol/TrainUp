
import { CronJob } from 'cron';
import { db } from './db';
import { trainingSessions, morningDiary, healthReports, fitnessMetrics } from '@shared/schema';
import { gte, and, desc } from 'drizzle-orm';
import { GoogleSheetsService } from './google-sheets';

interface ExportData {
  trainingSessions: any[];
  morningDiaries: any[];
  healthReports: any[];
  fitnessMetrics: any[];
}

class ScheduledExportService {
  private googleSheets: GoogleSheetsService;
  private exportJob: CronJob | null = null;

  constructor() {
    this.googleSheets = new GoogleSheetsService();
  }

  async getDailyData(): Promise<ExportData> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      const [sessions, diaries, reports, metrics] = await Promise.all([
        db.select()
          .from(trainingSessions)
          .where(and(
            gte(trainingSessions.date, yesterday),
            gte(trainingSessions.date, today)
          ))
          .orderBy(desc(trainingSessions.date)),

        db.select()
          .from(morningDiary)
          .where(and(
            gte(morningDiary.date, yesterday),
            gte(morningDiary.date, today)
          ))
          .orderBy(desc(morningDiary.date)),

        db.select()
          .from(healthReports)
          .where(and(
            gte(healthReports.date, yesterday),
            gte(healthReports.date, today)
          ))
          .orderBy(desc(healthReports.date)),

        db.select()
          .from(fitnessMetrics)
          .where(and(
            gte(fitnessMetrics.date, yesterday),
            gte(fitnessMetrics.date, today)
          ))
          .orderBy(desc(fitnessMetrics.date))
      ]);

      return {
        trainingSessions: sessions,
        morningDiaries: diaries,
        healthReports: reports,
        fitnessMetrics: metrics
      };
    } catch (error) {
      console.error('Error fetching daily data:', error);
      return {
        trainingSessions: [],
        morningDiaries: [],
        healthReports: [],
        fitnessMetrics: []
      };
    }
  }

  async exportToGoogleSheets(data: ExportData): Promise<boolean> {
    try {
      const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
      if (!spreadsheetId) {
        console.error('GOOGLE_SHEETS_ID not found in environment variables');
        return false;
      }

      // Export training sessions
      if (data.trainingSessions.length > 0) {
        const sessionData = data.trainingSessions.map(session => [
          session.date?.toISOString() || '',
          session.userId || '',
          session.trainingType || '',
          session.effortLevel || '',
          session.duration || '',
          session.sessionLoad || '',
          session.notes || ''
        ]);

        await this.googleSheets.appendToSheet(
          spreadsheetId,
          'Training Sessions',
          [['Date', 'User ID', 'Type', 'RPE', 'Duration', 'Load', 'Notes'], ...sessionData]
        );
      }

      // Export morning diaries
      if (data.morningDiaries.length > 0) {
        const diaryData = data.morningDiaries.map(diary => [
          diary.date?.toISOString() || '',
          diary.userId || '',
          diary.sleepQuality || '',
          diary.sleepHours || '',
          diary.energyLevel || '',
          diary.stressLevel || '',
          diary.motivation || '',
          diary.notes || ''
        ]);

        await this.googleSheets.appendToSheet(
          spreadsheetId,
          'Morning Diaries',
          [['Date', 'User ID', 'Sleep Quality', 'Sleep Hours', 'Energy', 'Stress', 'Motivation', 'Notes'], ...diaryData]
        );
      }

      // Export health reports
      if (data.healthReports.length > 0) {
        const healthData = data.healthReports.map(report => [
          report.date?.toISOString() || '',
          report.userId || '',
          report.symptoms?.join(', ') || '',
          report.painLevel || '',
          report.notes || ''
        ]);

        await this.googleSheets.appendToSheet(
          spreadsheetId,
          'Health Reports',
          [['Date', 'User ID', 'Symptoms', 'Pain Level', 'Notes'], ...healthData]
        );
      }

      // Export fitness metrics
      if (data.fitnessMetrics.length > 0) {
        const metricsData = data.fitnessMetrics.map(metric => [
          metric.date?.toISOString() || '',
          metric.userId || '',
          metric.weight || '',
          metric.bodyFat || '',
          metric.muscleMass || '',
          metric.vo2Max || ''
        ]);

        await this.googleSheets.appendToSheet(
          spreadsheetId,
          'Fitness Metrics',
          [['Date', 'User ID', 'Weight', 'Body Fat %', 'Muscle Mass', 'VO2 Max'], ...metricsData]
        );
      }

      console.log(`Daily export completed: ${new Date().toISOString()}`);
      return true;
    } catch (error) {
      console.error('Error exporting to Google Sheets:', error);
      return false;
    }
  }

  async performDailyExport(): Promise<void> {
    console.log('Starting daily export...');
    const data = await this.getDailyData();
    const success = await this.exportToGoogleSheets(data);
    
    if (success) {
      console.log('Daily export completed successfully');
    } else {
      console.error('Daily export failed');
    }
  }

  startScheduledExports(): void {
    // Run daily at midnight UTC
    this.exportJob = new CronJob('0 0 * * *', async () => {
      await this.performDailyExport();
    }, null, true, 'UTC');

    console.log('Scheduled exports started - will run daily at midnight UTC');
  }

  stopScheduledExports(): void {
    if (this.exportJob) {
      this.exportJob.stop();
      this.exportJob = null;
      console.log('Scheduled exports stopped');
    }
  }

  // Manual export trigger for testing
  async triggerManualExport(): Promise<boolean> {
    return await this.performDailyExport().then(() => true).catch(() => false);
  }
}

export const scheduledExportService = new ScheduledExportService();
