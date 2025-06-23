// server/types/express.d.ts

declare namespace Express {
  export interface Request {
    user?: {
      id: string;
      role: string; // можешь заменить на enum, если у тебя тип ролей описан
    };
    isAuthenticated?: boolean;
  }
}
