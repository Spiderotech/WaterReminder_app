import AsyncStorage from '@react-native-async-storage/async-storage';

export type DigitalMeMessageKey = 'energy' | 'focus' | 'body' | 'progress';

export type DigitalMeDailyMessages = Record<DigitalMeMessageKey, string>;

const messageCatalog: Record<DigitalMeMessageKey, string[]> = {
  energy: [
    "Your body is gaining energy from today's hydration.",
    'Staying hydrated supports steady daily energy.',
    'Water helps your body stay active and refreshed.',
    'Your hydration habit is supporting your daily performance.',
    'Your body feels better when properly hydrated.',
    'Consistent hydration helps support physical energy.',
    'Water supports your body through busy days.',
    'Your energy grows through healthy daily habits.',
    "Hydration supports your body's natural balance and strength.",
    'Your consistency is helping your body stay energized.',
  ],
  focus: [
    'Hydration supports focus and mental clarity.',
    'Your brain works better when hydrated.',
    'Water supports concentration throughout the day.',
    'Staying hydrated helps support clearer thinking.',
    'Hydration supports daily mental performance.',
    'Your focus benefits from healthy hydration habits.',
    'Water supports your mind during daily activities.',
    'Proper hydration helps support attention and alertness.',
    'Your hydration routine supports better concentration.',
    'Staying hydrated helps your body and mind work together better.',
  ],
  body: [
    'Your body depends on water every single day.',
    'Hydration supports important body functions.',
    'Your body works best with proper hydration.',
    'Water helps your body maintain balance.',
    'Staying hydrated supports overall wellbeing.',
    'Your body appreciates consistent hydration.',
    'Water supports healthy daily body function.',
    'Hydration helps your body perform more efficiently.',
    'Your daily hydration supports long-term wellness.',
    'Healthy hydration habits support your body over time.',
  ],
  progress: [
    'Every tap is helping build a stronger habit.',
    'Your consistency is becoming part of your lifestyle.',
    'Small daily actions create powerful long-term change.',
    'Your progress grows every time you stay consistent.',
    'Healthy routines are built one day at a time.',
    "You're proving to yourself that consistency is possible.",
    "Your future self will benefit from today's effort.",
    "You're building momentum through daily hydration.",
    "Don't lose the progress you've already built.",
    'Every completed day moves you closer to a healthier routine.',
  ],
};

const dateSeed = (date: string, key: DigitalMeMessageKey) => (
  [...`${date}:${key}`].reduce((sum, char) => sum + char.charCodeAt(0), 0)
);

export const getDigitalMeDailyMessages = async (date: string): Promise<DigitalMeDailyMessages> => {
  const storageKey = `v2:digitalMeDailyMessages:${date}`;
  const stored = await AsyncStorage.getItem(storageKey);

  if (stored) {
    return JSON.parse(stored);
  }

  const selected = (Object.keys(messageCatalog) as DigitalMeMessageKey[]).reduce((messages, key) => {
    const list = messageCatalog[key];
    messages[key] = list[dateSeed(date, key) % list.length];
    return messages;
  }, {} as DigitalMeDailyMessages);

  await AsyncStorage.setItem(storageKey, JSON.stringify(selected));
  return selected;
};

export const getDigitalMeMessageCatalog = () => messageCatalog;
