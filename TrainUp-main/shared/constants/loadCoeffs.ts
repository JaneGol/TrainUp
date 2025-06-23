export const TYPE_COEFF = { 
  Field: 1.2, 
  Gym: 1.0, 
  Match: 1.5 
} as const;

export const EMO_STEP = 0.125; // emotional_load 1→1.0, 2→1.125, etc.

export type TrainingType = keyof typeof TYPE_COEFF;

// Convert emotional load (1-5) to coefficient (1.0-1.5)
export function emotionalLoadToCoeff(emotionalLoad: number): number {
  return 1.0 + (emotionalLoad - 1) * EMO_STEP;
}

// Calculate training load using centralized coefficients
export function calculateTrainingLoad(
  rpe: number,
  duration: number,
  emotionalLoad: number,
  trainingType: TrainingType
): number {
  const emotionalCoeff = emotionalLoadToCoeff(emotionalLoad);
  const typeCoeff = TYPE_COEFF[trainingType];
  return rpe * duration * emotionalCoeff * typeCoeff;
}