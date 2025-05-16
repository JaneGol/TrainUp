import { Request, Response, Express } from 'express';
import { GoogleSheetsExporter } from './google-sheets';
import { storage } from './storage';

export function setupSheetExportRoutes(app: Express) {
  const sheetsExporter = new GoogleSheetsExporter(storage);
  
  // Route to export athlete wellness data to Google Sheets
  app.post('/api/export/wellness', async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated and is a coach
      if (!req.isAuthenticated() || req.user?.role !== 'coach') {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied. Only coaches can export data.' 
        });
      }
      
      // Get the spreadsheet ID from the request body
      const { spreadsheetId, sheetName } = req.body;
      
      if (!spreadsheetId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Spreadsheet ID is required' 
        });
      }
      
      // Export the data
      const result = await sheetsExporter.exportAthleteWellnessData(
        spreadsheetId,
        sheetName || 'Athlete Wellness Data'
      );
      
      return res.status(result.success ? 200 : 500).json(result);
      
    } catch (error) {
      console.error('Error exporting athlete wellness data:', error);
      return res.status(500).json({
        success: false,
        message: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  });
  
  // Route to export training data to Google Sheets
  app.post('/api/export/training', async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated and is a coach
      if (!req.isAuthenticated() || req.user?.role !== 'coach') {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied. Only coaches can export data.' 
        });
      }
      
      // Get the spreadsheet ID from the request body
      const { spreadsheetId, sheetName } = req.body;
      
      if (!spreadsheetId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Spreadsheet ID is required' 
        });
      }
      
      // Export the data
      const result = await sheetsExporter.exportTrainingData(
        spreadsheetId,
        sheetName || 'Training Data'
      );
      
      return res.status(result.success ? 200 : 500).json(result);
      
    } catch (error) {
      console.error('Error exporting training data:', error);
      return res.status(500).json({
        success: false,
        message: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  });
  
  // Route to export coach feedback data to Google Sheets
  app.post('/api/export/feedback', async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated and is a coach
      if (!req.isAuthenticated() || req.user?.role !== 'coach') {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied. Only coaches can export data.' 
        });
      }
      
      // Get the spreadsheet ID from the request body
      const { spreadsheetId, sheetName } = req.body;
      
      if (!spreadsheetId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Spreadsheet ID is required' 
        });
      }
      
      // Export the data
      const result = await sheetsExporter.exportCoachFeedbackData(
        spreadsheetId,
        sheetName || 'Coach Feedback'
      );
      
      return res.status(result.success ? 200 : 500).json(result);
      
    } catch (error) {
      console.error('Error exporting coach feedback data:', error);
      return res.status(500).json({
        success: false,
        message: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  });
  
  // Route to export all data to Google Sheets (combines all exports)
  app.post('/api/export/all', async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated and is a coach
      if (!req.isAuthenticated() || req.user?.role !== 'coach') {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied. Only coaches can export data.' 
        });
      }
      
      // Get the spreadsheet ID from the request body
      const { spreadsheetId } = req.body;
      
      if (!spreadsheetId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Spreadsheet ID is required' 
        });
      }
      
      // Export all datasets
      const wellnessResult = await sheetsExporter.exportAthleteWellnessData(
        spreadsheetId,
        'Athlete Wellness Data'
      );
      
      const trainingResult = await sheetsExporter.exportTrainingData(
        spreadsheetId,
        'Training Data'
      );
      
      const feedbackResult = await sheetsExporter.exportCoachFeedbackData(
        spreadsheetId,
        'Coach Feedback'
      );
      
      // Compile results
      const success = wellnessResult.success || trainingResult.success || feedbackResult.success;
      const results = {
        success,
        wellness: wellnessResult,
        training: trainingResult,
        feedback: feedbackResult,
        message: success 
          ? 'Data export completed with some results' 
          : 'Failed to export any data'
      };
      
      return res.status(success ? 200 : 500).json(results);
      
    } catch (error) {
      console.error('Error exporting all data:', error);
      return res.status(500).json({
        success: false,
        message: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  });
}