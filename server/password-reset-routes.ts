import { Express } from "express";
import { passwordResetManager } from "./password-reset";
import { storage } from "./storage";
import { 
  requestResetSchema, 
  resetPasswordSchema, 
  securityQuestionSchema, 
  securityAnswerSchema, 
  setupSecurityQuestionSchema
} from "@shared/schema";

export function setupPasswordResetRoutes(app: Express) {
  // Request password reset email
  app.post("/api/reset-password/request", async (req, res) => {
    try {
      const { email } = requestResetSchema.parse(req.body);
      
      // Find user by email
      const user = await storage.getUserByUsername(email);
      
      if (!user) {
        // Don't reveal if the email exists or not (security best practice)
        return res.status(200).json({ 
          message: "If your email is registered, you will receive reset instructions" 
        });
      }
      
      // Generate reset token
      const token = await passwordResetManager.createResetToken(user.id);
      
      // In a real app, we would send an email with a reset link
      // For demo purposes, return the token in the response
      // DO NOT DO THIS IN PRODUCTION
      return res.status(200).json({ 
        message: "If your email is registered, you will receive reset instructions",
        // The following would normally not be included in the response
        // It's only here for demo purposes
        debug: {
          token,
          resetLink: `/reset-password/${token}`
        }
      });
    } catch (error) {
      console.error("Error requesting password reset:", error);
      return res.status(400).json({ error: "Invalid request" });
    }
  });
  
  // Verify reset token
  app.get("/api/reset-password/verify/:token", async (req, res) => {
    try {
      const token = req.params.token;
      
      // Find user by token
      const user = await passwordResetManager.getUserByResetToken(token);
      
      if (!user) {
        return res.status(400).json({ error: "Invalid or expired reset token" });
      }
      
      return res.status(200).json({ valid: true });
    } catch (error) {
      console.error("Error verifying reset token:", error);
      return res.status(400).json({ error: "Invalid request" });
    }
  });
  
  // Reset password with token
  app.post("/api/reset-password/reset", async (req, res) => {
    try {
      const { token, newPassword } = resetPasswordSchema.parse(req.body);
      
      // Find user by token
      const user = await passwordResetManager.getUserByResetToken(token);
      
      if (!user) {
        return res.status(400).json({ error: "Invalid or expired reset token" });
      }
      
      // Update password
      const success = await passwordResetManager.resetPassword(user.id, newPassword);
      
      if (!success) {
        return res.status(500).json({ error: "Failed to update password" });
      }
      
      // Clear the token
      await passwordResetManager.clearResetToken(token);
      
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error resetting password:", error);
      return res.status(400).json({ error: "Invalid request" });
    }
  });
  
  // Get security question for a user
  app.post("/api/security-question", async (req, res) => {
    try {
      const { username } = securityQuestionSchema.parse(req.body);
      
      const question = await passwordResetManager.getSecurityQuestion(username);
      
      if (!question) {
        return res.status(404).json({ error: "Security question not found" });
      }
      
      return res.status(200).json({ question });
    } catch (error) {
      console.error("Error getting security question:", error);
      return res.status(400).json({ error: "Invalid request" });
    }
  });
  
  // Reset password with security question
  app.post("/api/reset-password/security-answer", async (req, res) => {
    try {
      const { username, answer, newPassword } = securityAnswerSchema.parse(req.body);
      
      // Verify the security answer
      const isValid = await passwordResetManager.verifySecurityAnswer(username, answer);
      
      if (!isValid) {
        return res.status(400).json({ error: "Incorrect answer" });
      }
      
      // Get the user
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Reset the password
      const success = await passwordResetManager.resetPassword(user.id, newPassword);
      
      if (!success) {
        return res.status(500).json({ error: "Failed to update password" });
      }
      
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error resetting password with security question:", error);
      return res.status(400).json({ error: "Invalid request" });
    }
  });
  
  // Set up security question (authenticated route)
  app.post("/api/security-question/setup", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const { question, answer } = setupSecurityQuestionSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const success = await passwordResetManager.setSecurityQuestion(
        req.user.id,
        question,
        answer
      );
      
      if (!success) {
        return res.status(500).json({ error: "Failed to set up security question" });
      }
      
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error setting up security question:", error);
      return res.status(400).json({ error: "Invalid request" });
    }
  });
}