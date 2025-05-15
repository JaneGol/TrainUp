import { Express, Request, Response } from "express";
import { storage } from "./storage";
import { hashPassword } from "./password-reset";

export function setupProfileRoutes(app: Express) {
  // Change password for authenticated user
  app.post("/api/profile/change-password", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.id;

    if (!currentPassword || !newPassword || !userId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      // Get the current user
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Verify the current password
      const isValidPassword = await comparePasswords(currentPassword, user.password);
      
      if (!isValidPassword) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }
      
      // Hash the new password
      const hashedPassword = await hashPassword(newPassword);
      
      // Update the user's password in the database
      // Note: We need to add this method to the DatabaseStorage class
      const success = await storage.updateUserPassword(userId, hashedPassword);
      
      if (!success) {
        return res.status(500).json({ error: "Failed to update password" });
      }
      
      res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ error: "Failed to change password" });
    }
  });
  
  // Get user profile (based on user role)
  app.get("/api/profile/:userId", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const requestedUserId = parseInt(req.params.userId);
    const currentUserId = req.user?.id;
    const currentUserRole = req.user?.role;
    
    try {
      // Get the requested user
      const requestedUser = await storage.getUser(requestedUserId);
      
      if (!requestedUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Role-based access control
      // 1. Users can always access their own profiles
      // 2. Coaches can access athlete profiles
      // 3. Athletes can only access their own profiles
      const isOwnProfile = requestedUserId === currentUserId;
      const isCoachViewingAthlete = currentUserRole === 'coach' && requestedUser.role === 'athlete';
      
      if (!isOwnProfile && !isCoachViewingAthlete) {
        return res.status(403).json({ 
          error: "Access denied: You don't have permission to view this profile",
          details: "Athletes can only view their own profiles, while coaches can view athlete profiles."
        });
      }
      
      // Don't send the password hash
      const { password, ...userWithoutPassword } = requestedUser;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Error getting user profile:", error);
      res.status(500).json({ error: "Failed to get user profile" });
    }
  });
}

// Helper function to compare passwords
async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  try {
    // Split the stored hash to get the hash and salt
    const [hashed, salt] = stored.split(".");
    
    // Hash the supplied password with the same salt
    const hashedBuffer = Buffer.from(hashed, "hex");
    
    // Use the scrypt function from crypto
    const crypto = require("crypto");
    const suppliedBuffer = await new Promise<Buffer>((resolve, reject) => {
      crypto.scrypt(supplied, salt, 64, (err: Error | null, derivedKey: Buffer) => {
        if (err) reject(err);
        else resolve(derivedKey);
      });
    });
    
    // Compare the hashed buffers
    return crypto.timingSafeEqual(hashedBuffer, suppliedBuffer);
  } catch (error) {
    console.error("Error comparing passwords:", error);
    return false;
  }
}