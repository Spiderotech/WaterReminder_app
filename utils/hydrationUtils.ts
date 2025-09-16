export const generateWaterGoal = (user: {
  gender?: string;
  weight?: number;
  age?: number;
  activityLevel?: string;
  climate?: string;
}) => {
  let base = 2000;

  if (user.gender === 'Male') base += 500;
  if (user.weight) base += Math.min(1000, (user.weight - 50) * 10);
  if (user.activityLevel === 'High') base += 300;
  if (user.climate === 'Hot') base += 300;

  return Math.round(base);
};
