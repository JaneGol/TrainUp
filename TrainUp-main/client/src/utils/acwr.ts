export const calcAcwr = (acute: number, chronic: number): number => {
  return +(acute / (chronic || 1)).toFixed(2);
};