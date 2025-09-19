export const generateWaterGoal = (user: {
  gender?: string;
  weight?: number;
  age?: number;
  activityLevel?: string;
  climate?: string;
}) => {
  let base = 1500;

  if (user.gender === 'Male') base += 500;
  if (user.weight) base += Math.min(1000, (user.weight - 50) * 10);
  if (user.activityLevel === 'High') base += 200;
  if (user.climate === 'Hot') base += 200;

  const min = Math.round(base * 0.9);  // 10% lower range
  const max = Math.round(base * 1.1);  // 10% higher range

  return { min, max };
};
