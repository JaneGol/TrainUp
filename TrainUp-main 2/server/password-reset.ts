import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User } from "@shared/schema";

export async function hashPassword(password: string) {
  const scryptAsync = promisify(scrypt);
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

type ResetTokenData = {
  userId: number;
  token: string;
  expires: Date;
};

type SecurityQuestionData = {
  userId: number;
  username: string; 
  question: string;
  answer: string;
};

class PasswordResetManager {
  private resetTokens: Map<string, ResetTokenData> = new Map();
  private securityQuestions: Map<number, SecurityQuestionData> = new Map();

  /**
   * Create a password reset token for a user
   */
  async createResetToken(userId: number): Promise<string> {
    const token = randomBytes(32).toString("hex");
    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // Token expires in 1 hour
    
    this.resetTokens.set(token, {
      userId,
      token,
      expires,
    });
    
    return token;
  }

  /**
   * Get user by reset token
   */
  async getUserByResetToken(token: string): Promise<User | undefined> {
    const tokenData = this.resetTokens.get(token);
    
    if (!tokenData) {
      return undefined;
    }
    
    // Check if token is expired
    if (new Date() > tokenData.expires) {
      this.resetTokens.delete(token);
      return undefined;
    }
    
    return storage.getUser(tokenData.userId);
  }

  /**
   * Reset a user's password
   */
  async resetPassword(userId: number, newPassword: string): Promise<boolean> {
    try {
      const user = await storage.getUser(userId);
      
      if (!user) {
        return false;
      }
      
      // Hash the new password
      const hashedPassword = await hashPassword(newPassword);
      
      // Update the user's password in the storage using the storage interface method
      const updated = await storage.updateUserPassword(userId, hashedPassword);
      
      if (!updated) {
        console.error(`Failed to update password for user ${userId} (${user.username})`);
        return false;
      }
      
      console.log(`Password reset for user ${userId} (${user.username}) - successfully updated`);
      
      // Clear any tokens for this user
      const tokensToDelete: string[] = [];
      this.resetTokens.forEach((data, token) => {
        if (data.userId === userId) {
          tokensToDelete.push(token);
        }
      });
      
      tokensToDelete.forEach(token => {
        this.resetTokens.delete(token);
      });
      
      return true;
    } catch (error) {
      console.error("Error resetting password:", error);
      return false;
    }
  }

  /**
   * Clear a reset token
   */
  async clearResetToken(token: string): Promise<void> {
    this.resetTokens.delete(token);
  }

  /**
   * Set a security question for a user
   */
  async setSecurityQuestion(userId: number, question: string, answer: string): Promise<boolean> {
    try {
      const user = await storage.getUser(userId);
      
      if (!user) {
        return false;
      }
      
      this.securityQuestions.set(userId, {
        userId,
        username: user.username,
        question,
        answer: answer.toLowerCase().trim(), // Store answer in lowercase for case-insensitive comparison
      });
      
      return true;
    } catch (error) {
      console.error("Error setting security question:", error);
      return false;
    }
  }

  /**
   * Get a user's security question by username
   */
  async getSecurityQuestion(username: string): Promise<string | undefined> {
    try {
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return undefined;
      }
      
      const securityQuestion = this.securityQuestions.get(user.id);
      
      if (!securityQuestion) {
        return undefined;
      }
      
      return securityQuestion.question;
    } catch (error) {
      console.error("Error getting security question:", error);
      return undefined;
    }
  }

  /**
   * Verify a user's security answer
   */
  async verifySecurityAnswer(username: string, answer: string): Promise<boolean> {
    try {
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return false;
      }
      
      const securityQuestion = this.securityQuestions.get(user.id);
      
      if (!securityQuestion) {
        return false;
      }
      
      // Case-insensitive comparison
      return securityQuestion.answer === answer.toLowerCase().trim();
    } catch (error) {
      console.error("Error verifying security answer:", error);
      return false;
    }
  }
}

export const passwordResetManager = new PasswordResetManager();