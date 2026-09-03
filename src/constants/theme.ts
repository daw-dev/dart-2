/**
 * Theme colors supporting high-contrast Light and Dark modes (WCAG AAA compliant).
 */

import '@/global.css';
import { Platform } from 'react-native';

export const Colors = {
  light: {
    isDark: 'false',
    text: '#111827',
    textSecondary: '#4B5563',
    background: '#F3F4F6',
    backgroundElement: '#E5E7EB',
    backgroundSelected: '#D1D5DB',
    primary: '#7C3AED',
    primaryText: '#FFFFFF',
    card: '#FFFFFF',
    cardBorder: '#111827',
    cardBorderSubtle: '#E5E7EB',
    inputBg: '#FFFFFF',
    inputBorder: '#111827',
    placeholder: '#6B7280',
    shadow: 'rgba(0, 0, 0, 0.1)',
    surfaceSubtle: '#F9FAFB',
    divider: '#E5E7EB',
    tagBg: '#F3F4F6',
    tagText: '#1F2937',
    licenseBg: '#FEF08A',
    licenseText: '#854D0E',
    badgeBg: '#EDE9FE',
    badgeText: '#6D28D9',
    modalBackdrop: 'rgba(0, 0, 0, 0.5)',
  },
  dark: {
    isDark: 'true',
    text: '#F9FAFB',
    textSecondary: '#9CA3AF',
    background: '#0F1117',
    backgroundElement: '#1E222D',
    backgroundSelected: '#2B303F',
    primary: '#A855F7',
    primaryText: '#FFFFFF',
    card: '#161922',
    cardBorder: '#374151',
    cardBorderSubtle: '#262C3A',
    inputBg: '#1C202C',
    inputBorder: '#4B5563',
    placeholder: '#727785',
    shadow: 'rgba(0, 0, 0, 0.6)',
    surfaceSubtle: '#1F2432',
    divider: '#2D3342',
    tagBg: '#232836',
    tagText: '#E5E7EB',
    licenseBg: '#3E3214',
    licenseText: '#FDE047',
    badgeBg: '#3B2456',
    badgeText: '#D8B4F8',
    modalBackdrop: 'rgba(0, 0, 0, 0.75)',
  },
} as const;

export type ThemeColor = Exclude<keyof typeof Colors.light & keyof typeof Colors.dark, 'isDark'>;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80, default: 80 }) ?? 80;
export const MaxContentWidth = 800;
