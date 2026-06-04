import { useThemeContext } from '../ThemeContext';

export type MainTabTheme = {
  mode: 'light' | 'dark';
  isLight: boolean;
  background: [string, string, string];
  shell: string;
  card: [string, string];
  elevatedCard: [string, string];
  glass: [string, string];
  headerButton: string;
  segment: [string, string];
  border: string;
  softBorder: string;
  text: string;
  mutedText: string;
  icon: string;
  shadow: string;
};

export const mainTabThemes: Record<'light' | 'dark', MainTabTheme> = {
  dark: {
    mode: 'dark',
    isLight: false,
    background: ['#010713', '#041025', '#020713'],
    shell: '#010713',
    card: ['rgba(7,28,62,0.98)', 'rgba(4,13,32,0.98)'],
    elevatedCard: ['rgba(9,33,72,0.98)', 'rgba(4,13,32,0.98)'],
    glass: ['rgba(10,28,58,0.9)', 'rgba(4,12,28,0.95)'],
    headerButton: 'rgba(8,24,55,0.86)',
    segment: ['rgba(10,28,58,0.9)', 'rgba(4,12,28,0.95)'],
    border: '#24436e',
    softBorder: 'rgba(68,116,190,0.42)',
    text: '#ffffff',
    mutedText: '#b7bdd7',
    icon: '#ffffff',
    shadow: '#1679ff',
  },
  light: {
    mode: 'light',
    isLight: true,
    background: ['#f7fbff', '#eaf3ff', '#fafdff'],
    shell: '#f4f8ff',
    card: ['rgba(255,255,255,0.98)', 'rgba(232,243,255,0.98)'],
    elevatedCard: ['rgba(255,255,255,0.99)', 'rgba(220,236,255,0.98)'],
    glass: ['rgba(255,255,255,0.96)', 'rgba(227,239,255,0.94)'],
    headerButton: 'rgba(255,255,255,0.9)',
    segment: ['rgba(255,255,255,0.96)', 'rgba(226,238,255,0.96)'],
    border: '#bfd5f5',
    softBorder: 'rgba(94,142,210,0.32)',
    text: '#10213f',
    mutedText: '#5e6c86',
    icon: '#18335c',
    shadow: '#7bb8ff',
  },
};

export const useMainTabTheme = () => {
  const { theme } = useThemeContext();
  return mainTabThemes[theme];
};
