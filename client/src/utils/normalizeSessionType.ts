export const normalizeType = (type: string): string => {
  if (type.startsWith('Field')) return 'Field';
  if (type.startsWith('Gym')) return 'Gym';
  return 'Match';
};