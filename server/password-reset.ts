import crypto from 'crypto';
import { User } from '@shared/schema';
import { storage } from './storage';
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

// Use the same hashing function as in auth.ts
const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// In-memory storage for reset tokens and security questions
// Note: This is not persistent and will be cleared on server restart
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
  
  // Reset token methods
  async createResetToken(userId: number): Promise<string> {
    // Generate a random token
    const token = crypto.randomBytes(20).toString('hex');
    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // Token expires in 1 hour
    
    this.resetTokens.set(token, {
      userId,
      token,
      expires
    });
    
    return token;
  }
  
  async getUserByResetToken(token: string): Promise<User | undefined> {
    const tokenData = this.resetTokens.get(token);
    
    if (!tokenData) return undefined;
    
    // Check if token is expired
    if (tokenData.expires < new Date()) {
      this.resetTokens.delete(token);
      return undefined;
    }
    
    return await storage.getUser(tokenData.userId);
  }
  
  async resetPassword(userId: number, newPassword: string): Promise<boolean> {
    try {
      const user = await storage.getUser(userId);
      if (!user) return false;
      
      // Hash the new password
      const hashedPassword = await hashPassword(newPassword);
      
      // Use raw SQL to update only the password
      const pool = (storage as any).pool;
      if (pool) {
        await pool.query(
          "UPDATE users SET password = $1 WHERE id = $2",
          [hashedPassword, userId]
        );
      } else {
        // If we can't access the pool, update in memory
        user.password = hashedPassword;
      }
      
      // Clear any reset tokens for this user
      Array.from(this.resetTokens.entries()).forEach(([key, data]) => {
        if (data.userId === userId) {
          this.resetTokens.delete(key);
        }
      });
      
      return true;
    } catch (error) {
      console.error("Error in resetPassword:", error);
      return false;
    }
  }
  
  async clearResetToken(token: string): Promise<void> {
    this.resetTokens.delete(token);
  }
  
  // Security question methods
  async setSecurityQuestion(userId: number, question: string, answer: string): Promise<boolean> {
    const user = await storage.getUser(userId);
    if (!user) return false;
    
    this.securityQuestions.set(userId, {
      userId,
      username: user.username,
      question,
      answer
    });
    
    return true;
  }
  
  async getSecurityQuestion(username: string): Promise<string | undefined> {
    const user = await storage.getUserByUsername(username);
    if (!user) return undefined;
    
    const securityData = this.securityQuestions.get(user.id);
    return securityData?.question;
  }
  
  async verifySecurityAnswer(username: string, answer: string): Promise<boolean> {
    const user = await storage.getUserByUsername(username);
    if (!user) return false;
    
    const securityData = this.securityQuestions.get(user.id);
    if (!securityData) return false;
    
    // In a real app, we would hash security answers
    return securityData.answer.toLowerCase() === answer.toLowerCase();
  }
}

export const passwordResetManager = new PasswordResetManager();