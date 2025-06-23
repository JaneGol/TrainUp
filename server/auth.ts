import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
  secret: process.env.SESSION_SECRET || "sportsync-secret-key",
  resave: false,
  saveUninitialized: false,
  store: storage.sessionStore,
  cookie: {
    sameSite: "none",
    secure: true,
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
  }
};

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // Check if the required fields are present
      if (!req.body.username || !req.body.password || !req.body.email || 
          !req.body.firstName || !req.body.lastName || !req.body.role ||
          !req.body.teamName || !req.body.teamPin) {
        return res.status(400).json({ error: "Missing required fields including team name and PIN" });
      }

      // Validate role is either "athlete" or "coach"
      if (req.body.role !== "athlete" && req.body.role !== "coach") {
        return res.status(400).json({ error: "Invalid role. Must be either 'athlete' or 'coach'" });
      }

      // Validate PIN format (4 digits)
      if (!/^\d{4}$/.test(req.body.teamPin)) {
        return res.status(400).json({ error: "PIN must be exactly 4 digits" });
      }

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      // Check for existing email - use Drizzle ORM style
      try {
        const emailExists = await db.select().from(users).where(eq(users.email, req.body.email));
        
        if (emailExists.length > 0) {
          return res.status(400).json({ error: "Email address already in use" });
        }
      } catch (e) {
        console.error("Error checking email uniqueness:", e);
      }

      console.log("Creating user with role:", req.body.role);
      
      if (req.body.role === "coach") {
        // For coaches: create new team or verify they can access existing team
        const existingTeam = await storage.getTeamByName(req.body.teamName);
        if (existingTeam) {
          // Verify PIN for existing team
          const validPin = await storage.validateTeamPin(req.body.teamName, req.body.teamPin);
          if (!validPin) {
            return res.status(400).json({ error: "Invalid PIN for existing team" });
          }
        } else {
          // Create new team
          await storage.createTeam({
            name: req.body.teamName,
            pinCode: req.body.teamPin
          });
        }
      } else {
        // For athletes: validate team exists and PIN is correct
        const validPin = await storage.validateTeamPin(req.body.teamName, req.body.teamPin);
        if (!validPin) {
          return res.status(400).json({ error: "Invalid team name or PIN" });
        }
        const existingTeam = await storage.getTeamByName(req.body.teamName);
        if (!existingTeam) {
          return res.status(400).json({ error: "Team not found" });
        }
      }
      
      // Create the user with team assignment
      const user = await storage.createUser({
        username: req.body.username,
        password: await hashPassword(req.body.password),
        email: req.body.email,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        role: req.body.role,
        teamPosition: req.body.teamPosition,
        teamName: req.body.teamName,
        teamPin: req.body.teamPin
      });

      // Log the user in
      req.login(user, (err) => {
        if (err) {
          console.error("Login error after registration:", err);
          return next(err);
        }
        console.log("User registered and logged in successfully:", user.id);
        res.status(201).json(user);
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      
      // Check for specific database errors
      if (error.code === '23505') {
        // Unique constraint violation
        if (error.constraint === 'users_email_unique') {
          return res.status(400).json({ error: "Email address already in use" });
        } else if (error.constraint === 'users_username_unique') {
          return res.status(400).json({ error: "Username already exists" });
        }
      }
      
      res.status(500).json({ error: "Failed to register user" });
    }
  });

  app.post("/api/login", (req, res, next) => {
    // Log what we're attempting to authenticate
    console.log("Login attempt for username:", req.body.username);
    
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        console.error("Login error:", err);
        return next(err);
      }
      
      if (!user) {
        console.log("Authentication failed for user:", req.body.username);
        return res.status(401).json({ error: "Invalid username or password" });
      }
      
      // Log the user in
      req.login(user, (err) => {
        if (err) {
          console.error("Session login error:", err);
          return next(err);
        }
        
        console.log("User logged in successfully:", user.id, user.role);
        res.status(200).json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}
