import { google, sheets_v4 } from 'googleapis';
import { IStorage } from './storage';

// Load the service account key from environment variable
const GOOGLE_SERVICE_ACCOUNT_KEY = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

export class GoogleSheetsService {
  private auth: any;

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}');
      this.auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });
    } catch (error) {
      console.error('Failed to initialize Google Sheets auth:', error);
    }
  }

  async appendToSheet(spreadsheetId: string, sheetName: string, values: any[][]): Promise<void> {
    try {
      const sheets = google.sheets({ version: 'v4', auth: this.auth });

      // First, try to clear existing data and add headers
      await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: `${sheetName}!A:Z`
      });

      // Then append the new data
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${sheetName}!A1`,
        valueInputOption: 'RAW',
        requestBody: {
          values
        }
      });
    } catch (error) {
      console.error(`Error writing to sheet ${sheetName}:`, error);
      throw error;
    }
  }
}

/**
 * DataExporter class handles exporting application data to Google Sheets
 */
export class GoogleSheetsExporter {
  private sheets!: sheets_v4.Sheets;
  private storage: IStorage;

  /**
   * Initialize the Google Sheets API client
   */
  constructor(storage: IStorage) {
    this.storage = storage;

    try {
      // Check if service account key is available
      if (!GOOGLE_SERVICE_ACCOUNT_KEY) {
        console.warn('Google service account key not available. Sheets export will not work.');
        return;
      }

      // Create a JWT auth client using the service account credentials
      // The key should already be a JSON object from Google Cloud, just use it directly
      const auth = new google.auth.JWT({
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: GOOGLE_SERVICE_ACCOUNT_KEY,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });

      // Initialize the Sheets API client
      this.sheets = google.sheets({ version: 'v4', auth });

    } catch (error) {
      console.error('Failed to initialize Google Sheets API client:', error);
      throw new Error('Failed to initialize Google Sheets API client');
    }
  }

  /**
   * Export athlete wellness data to Google Sheets
   * @param spreadsheetId The ID of the Google Spreadsheet
   * @param sheetName Name of the sheet tab (will be created if it doesn't exist)
   * @returns Object containing success status and message
   */
  async exportAthleteWellnessData(spreadsheetId: string, sheetName: string = 'Athlete Wellness Data'): Promise<{success: boolean, message: string}> {
    try {
      // Get athlete wellness data
      const athletes = await this.storage.getAthletes();

      if (!athletes.length) {
        return { success: false, message: 'No athlete data found to export' };
      }

      // Create headers for the spreadsheet
      const headers = [
        'Athlete ID', 'Name', 'Email', 'Readiness Score', 
        'Recovery Level', 'Sleep Quality', 'Sleep Hours', 
        'Mood', 'Stress Level', 'Last Updated'
      ];

      // Prepare data rows
      const rows: any[][] = [headers];

      // Process each athlete
      for (const athlete of athletes) {
        if (athlete.role !== 'athlete') continue;

        // Get latest wellness data for the athlete
        const latestMorningDiary = await this.storage.getLatestMorningDiary(athlete.id);

        if (!latestMorningDiary) continue;

        // Format athlete data for export
        const athleteName = `${athlete.firstName} ${athlete.lastName}`;
        const updatedDate = new Date(latestMorningDiary.date).toISOString().split('T')[0];

        rows.push([
          athlete.id,
          athleteName,
          athlete.email,
          latestMorningDiary.readinessScore,
          latestMorningDiary.recoveryLevel,
          latestMorningDiary.sleepQuality,
          latestMorningDiary.sleepHours,
          latestMorningDiary.mood,
          latestMorningDiary.stressLevel,
          updatedDate
        ]);
      }

      // Check if the sheet exists, create it if it doesn't
      const sheetsResponse = await this.sheets.spreadsheets.get({
        spreadsheetId,
        includeGridData: false,
      });

      let sheetExists = false;
      let sheetId: number | null = null;

      if (sheetsResponse.data.sheets) {
        for (const sheet of sheetsResponse.data.sheets) {
          if (sheet.properties?.title === sheetName) {
            sheetExists = true;
            sheetId = sheet.properties.sheetId || null;
            break;
          }
        }
      }

      // Create the sheet if it doesn't exist
      if (!sheetExists) {
        const addSheetResponse = await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [
              {
                addSheet: {
                  properties: {
                    title: sheetName,
                  },
                },
              },
            ],
          },
        });

        // Get the ID of the newly created sheet
        sheetId = addSheetResponse.data.replies?.[0]?.addSheet?.properties?.sheetId || null;
      }

      // Clear existing content in the sheet
      await this.sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: sheetName,
      });

      // Update the sheet with new data
      await this.sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: rows,
        },
      });

      // Format the header row (make it bold, add background)
      if (sheetId !== null) {
        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [
              {
                repeatCell: {
                  range: {
                    sheetId,
                    startRowIndex: 0,
                    endRowIndex: 1,
                  },
                  cell: {
                    userEnteredFormat: {
                      backgroundColor: {
                        red: 0.2,
                        green: 0.2,
                        blue: 0.2,
                      },
                      textFormat: {
                        bold: true,
                        foregroundColor: {
                          red: 1.0,
                          green: 1.0,
                          blue: 1.0,
                        },
                      },
                    },
                  },
                  fields: 'userEnteredFormat(backgroundColor,textFormat)',
                },
              },
              {
                autoResizeDimensions: {
                  dimensions: {
                    sheetId,
                    dimension: 'COLUMNS',
                    startIndex: 0,
                    endIndex: headers.length,
                  },
                },
              },
            ],
          },
        });
      }

      return { 
        success: true, 
        message: `Successfully exported ${rows.length - 1} athlete records to Google Sheets` 
      };

    } catch (error) {
      console.error('Error exporting athlete wellness data to Google Sheets:', error);
      return { 
        success: false, 
        message: `Failed to export data: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Export training data to Google Sheets
   * @param spreadsheetId The ID of the Google Spreadsheet
   * @param sheetName Name of the sheet tab (will be created if it doesn't exist)
   * @returns Object containing success status and message
   */
  async exportTrainingData(spreadsheetId: string, sheetName: string = 'Training Data'): Promise<{success: boolean, message: string}> {
    try {
      // Get all athletes
      const athletes = await this.storage.getAthletes();

      if (!athletes.length) {
        return { success: false, message: 'No athlete data found to export' };
      }

      // Create headers for the spreadsheet
      const headers = [
        'Athlete ID', 'Athlete Name', 'Training Date', 'Training Type', 
        'Effort Level', 'Emotional Load', 'Mood', 'Notes', 
        'Coach Reviewed', 'Created At'
      ];

      // Prepare data rows
      const rows: any[][] = [headers];

      // Process each athlete
      for (const athlete of athletes) {
        if (athlete.role !== 'athlete') continue;

        // Get training entries for the athlete
        const trainingEntries = await this.storage.getTrainingEntriesByUserId(athlete.id);

        if (!trainingEntries.length) continue;

        // Format athlete name
        const athleteName = `${athlete.firstName} ${athlete.lastName}`;

        // Add each training entry as a row
        for (const entry of trainingEntries) {
          const trainingDate = new Date(entry.date).toISOString().split('T')[0];
          const createdAt = new Date(entry.createdAt).toISOString().split('T')[0];

          rows.push([
            athlete.id,
            athleteName,
            trainingDate,
            entry.trainingType,
            entry.effortLevel,
            entry.emotionalLoad,
            entry.mood,
            entry.notes || '',
            entry.coachReviewed ? 'Yes' : 'No',
            createdAt
          ]);
        }
      }

      // Check if the sheet exists, create it if it doesn't
      const sheetsResponse = await this.sheets.spreadsheets.get({
        spreadsheetId,
        includeGridData: false,
      });

      let sheetExists = false;
      let sheetId: number | null = null;

      if (sheetsResponse.data.sheets) {
        for (const sheet of sheetsResponse.data.sheets) {
          if (sheet.properties?.title === sheetName) {
            sheetExists = true;
            sheetId = sheet.properties.sheetId || null;
            break;
          }
        }
      }

      // Create the sheet if it doesn't exist
      if (!sheetExists) {
        const addSheetResponse = await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [
              {
                addSheet: {
                  properties: {
                    title: sheetName,
                  },
                },
              },
            ],
          },
        });

        // Get the ID of the newly created sheet
        sheetId = addSheetResponse.data.replies?.[0]?.addSheet?.properties?.sheetId || null;
      }

      // Clear existing content in the sheet
      await this.sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: sheetName,
      });

      // Update the sheet with new data
      await this.sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: rows,
        },
      });

      // Format the header row (make it bold, add background)
      if (sheetId !== null) {
        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [
              {
                repeatCell: {
                  range: {
                    sheetId,
                    startRowIndex: 0,
                    endRowIndex: 1,
                  },
                  cell: {
                    userEnteredFormat: {
                      backgroundColor: {
                        red: 0.2,
                        green: 0.2,
                        blue: 0.2,
                      },
                      textFormat: {
                        bold: true,
                        foregroundColor: {
                          red: 1.0,
                          green: 1.0,
                          blue: 1.0,
                        },
                      },
                    },
                  },
                  fields: 'userEnteredFormat(backgroundColor,textFormat)',
                },
              },
              {
                autoResizeDimensions: {
                  dimensions: {
                    sheetId,
                    dimension: 'COLUMNS',
                    startIndex: 0,
                    endIndex: headers.length,
                  },
                },
              },
            ],
          },
        });
      }

      return { 
        success: true, 
        message: `Successfully exported ${rows.length - 1} training records to Google Sheets` 
      };

    } catch (error) {
      console.error('Error exporting training data to Google Sheets:', error);
      return { 
        success: false, 
        message: `Failed to export data: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Export coach feedback data to Google Sheets
   * @param spreadsheetId The ID of the Google Spreadsheet
   * @param sheetName Name of the sheet tab (will be created if it doesn't exist)
   * @returns Object containing success status and message
   */
  async exportCoachFeedbackData(spreadsheetId: string, sheetName: string = 'Coach Feedback'): Promise<{success: boolean, message: string}> {
    try {
      // Get all coaches (users with role 'coach')
      const athletes = await this.storage.getAthletes();
      const coaches = athletes.filter(user => user.role === 'coach');

      if (!coaches.length) {
        return { success: false, message: 'No coach data found to export' };
      }

      // Create headers for the spreadsheet
      const headers = [
        'Feedback ID', 'Coach ID', 'Coach Name', 'Athlete ID', 'Athlete Name',
        'Feedback Type', 'Message', 'Rating', 'Created At'
      ];

      // Prepare data rows
      const rows: any[][] = [headers];

      // Create a map of athlete IDs to names for quick lookup
      const athleteMap = new Map();
      athletes.forEach(athlete => {
        athleteMap.set(athlete.id, `${athlete.firstName} ${athlete.lastName}`);
      });

      // Process each coach
      for (const coach of coaches) {
        // Get feedback provided by this coach
        const feedback = await this.storage.getCoachFeedbackByCoachId(coach.id);

        if (!feedback.length) continue;

        // Format coach name
        const coachName = `${coach.firstName} ${coach.lastName}`;

        // Add each feedback entry as a row
        for (const entry of feedback) {
          const athleteName = athleteMap.get(entry.athleteId) || 'Unknown Athlete';
          const createdAt = new Date(entry.createdAt).toISOString().split('T')[0];

          rows.push([
            entry.id,
            coach.id,
            coachName,
            entry.athleteId,
            athleteName,
            'Performance Feedback', // Fixed feedback type
            entry.feedback, // Using 'feedback' instead of 'message'
            '-', // No rating field available
            createdAt
          ]);
        }
      }

      if (rows.length === 1) { // Only headers, no data
        return { success: false, message: 'No coach feedback data found to export' };
      }

      // Check if the sheet exists, create it if it doesn't
      const sheetsResponse = await this.sheets.spreadsheets.get({
        spreadsheetId,
        includeGridData: false,
      });

      let sheetExists = false;
      let sheetId: number | null = null;

      if (sheetsResponse.data.sheets) {
        for (const sheet of sheetsResponse.data.sheets) {
          if (sheet.properties?.title === sheetName) {
            sheetExists = true;
            sheetId = sheet.properties.sheetId || null;
            break;
          }
        }
      }

      // Create the sheet if it doesn't exist
      if (!sheetExists) {
        const addSheetResponse = await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [
              {
                addSheet: {
                  properties: {
                    title: sheetName,
                  },
                },
              },
            ],
          },
        });

        // Get the ID of the newly created sheet
        sheetId = addSheetResponse.data.replies?.[0]?.addSheet?.properties?.sheetId || null;
      }

      // Clear existing content in the sheet
      await this.sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: sheetName,
      });

      // Update the sheet with new data
      await this.sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: rows,
        },
      });

      // Format the header row (make it bold, add background)
      if (sheetId !== null) {
        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [
              {
                repeatCell: {
                  range: {
                    sheetId,
                    startRowIndex: 0,
                    endRowIndex: 1,
                  },
                  cell: {
                    userEnteredFormat: {
                      backgroundColor: {
                        red: 0.2,
                        green: 0.2,
                        blue: 0.2,
                      },
                      textFormat: {
                        bold: true,
                        foregroundColor: {
                          red: 1.0,
                          green: 1.0,
                          blue: 1.0,
                        },
                      },
                    },
                  },
                  fields: 'userEnteredFormat(backgroundColor,textFormat)',
                },
              },
              {
                autoResizeDimensions: {
                  dimensions: {
                    sheetId,
                    dimension: 'COLUMNS',
                    startIndex: 0,
                    endIndex: headers.length,
                  },
                },
              },
            ],
          },
        });
      }

      return { 
        success: true, 
        message: `Successfully exported ${rows.length - 1} coach feedback records to Google Sheets` 
      };

    } catch (error) {
      console.error('Error exporting coach feedback data to Google Sheets:', error);
      return { 
        success: false, 
        message: `Failed to export data: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }
}