import AsyncStorage from '@react-native-async-storage/async-storage';

export const getHydrationGoalTypeLabel = async () => {
  const [choice, storedPlan] = await Promise.all([
    AsyncStorage.getItem('hydrationGoalChoice'),
    AsyncStorage.getItem('selectedHydrationPlan'),
  ]);

  if (storedPlan) {
    const parsed = JSON.parse(storedPlan);
    if (parsed?.planType === 'custom') return 'Custom Plan';
    if (parsed?.planType === 'performance') return 'Performance Plan';
    if (parsed?.planType === 'smart') return 'Smart Plan';
  }

  if (choice === 'custom') return 'Custom Plan';
  if (choice === 'performance' || choice === 'max') return 'Performance Plan';
  return 'Smart Plan';
};
