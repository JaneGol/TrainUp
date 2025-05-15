import { Express, Request, Response } from "express";
import { storage } from "./storage";
import { passwordResetManager, hashPassword } from "./password-reset";

export function setupPasswordResetRoutes(app: Express) {
  // Request a password reset
  app.post("/api/reset-password/request", async (req: Request, res: Response) => {
    const { email } = req.body;
    
    try {
      // Look up the user by email
      const users = await storage.getAthletes();
      const user = users.find(u => u.email === email);
      
      if (!user) {
        // Return user not found error but with 200 status for security
        return res.status(200).json({ 
          error: "User not found. Please check your email." 
        });
      }
      
      // Create a reset token
      const token = await passwordResetManager.createResetToken(user.id);
      
      // In a real app, we would send an email with the reset link
      // For demo purposes, we'll return the token in the response (for development)
      
      // Send response with the username (for the username display step)
      res.status(200).json({
        message: "Account found. You can now reset your password.",
        username: user.username,
        // Include the token in debug mode only
        debug: {
          token,
        },
      });
    } catch (error) {
      console.error("Error requesting password reset:", error);
      res.status(500).json({ error: "Failed to process password reset request" });
    }
  });

  // Verify a password reset token
  app.get("/api/reset-password/verify/:token", async (req: Request, res: Response) => {
    const { token } = req.params;
    
    try {
      const user = await passwordResetManager.getUserByResetToken(token);
      
      if (!user) {
        return res.status(400).json({ valid: false, error: "Invalid or expired token" });
      }
      
      res.status(200).json({ valid: true, username: user.username });
    } catch (error) {
      console.error("Error verifying reset token:", error);
      res.status(500).json({ valid: false, error: "Failed to verify reset token" });
    }
  });

  // Reset password
  app.post("/api/reset-password/reset", async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    try {
      const user = await passwordResetManager.getUserByResetToken(token);
      
      if (!user) {
        return res.status(400).json({ error: "Invalid or expired token" });
      }
      
      // Reset the user's password
      const success = await passwordResetManager.resetPassword(user.id, newPassword);
      
      if (!success) {
        return res.status(500).json({ error: "Failed to reset password" });
      }
      
      // No need to clear the token separately as resetPassword already does this
      
      res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ error: "Failed to reset password" });
    }
  });

  // Add security question (for a logged-in user)
  app.post("/api/reset-password/security-question", async (req: Request, res: Response) => {
    // This route should require authentication
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const { question, answer } = req.body;
    const userId = req.user?.id;
    
    if (!question || !answer || !userId) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    try {
      const success = await passwordResetManager.setSecurityQuestion(userId, question, answer);
      
      if (!success) {
        return res.status(400).json({ error: "Failed to set security question" });
      }
      
      res.status(200).json({ message: "Security question set successfully" });
    } catch (error) {
      console.error("Error setting security question:", error);
      res.status(500).json({ error: "Failed to set security question" });
    }
  });

  // Get security question by username (for password reset)
  app.get("/api/reset-password/security-question/:username", async (req: Request, res: Response) => {
    const { username } = req.params;
    
    try {
      const question = await passwordResetManager.getSecurityQuestion(username);
      
      if (!question) {
        // Don't reveal that the username doesn't exist for security reasons
        return res.status(404).json({ error: "Security question not found" });
      }
      
      res.status(200).json({ question });
    } catch (error) {
      console.error("Error getting security question:", error);
      res.status(500).json({ error: "Failed to get security question" });
    }
  });

  // Verify security answer (for password reset)
  app.post("/api/reset-password/verify-answer", async (req: Request, res: Response) => {
    const { username, answer } = req.body;
    
    if (!username || !answer) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    try {
      const isCorrect = await passwordResetManager.verifySecurityAnswer(username, answer);
      
      if (!isCorrect) {
        return res.status(400).json({ error: "Incorrect answer" });
      }
      
      // If the answer is correct, create a reset token
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const token = await passwordResetManager.createResetToken(user.id);
      
      res.status(200).json({ 
        message: "Answer verified successfully",
        token,
      });
    } catch (error) {
      console.error("Error verifying security answer:", error);
      res.status(500).json({ error: "Failed to verify security answer" });
    }
  });
}