import { createContext, createElement, useContext, useEffect, useMemo, useState } from 'react';
import { Platform, useColorScheme } from 'react-native';
import { load, save } from './storage';

/*
  Design tokens. A calm "study desk": cool paper neutrals, one ink-blue accent,
  semantic colors only for meaning (done, wrong, due). Code gets its own quiet surface.
*/
const light = {
  bg: '#F5F6F8',        // page
  surface: '#FFFFFF',   // cards, sheets
  sunken: '#EEF0F3',    // inputs, code, segmented track
  ink: '#16191F',       // primary text
  body: '#3A404B',      // long text
  muted: '#6B7280',     // secondary text
  faint: '#9AA1AC',     // placeholders, disabled
  line: '#E2E5EA',      // hairlines
  accent: '#2E4FD8',    // primary actions, selection
  accentSoft: '#E8ECFC',
  onAccent: '#FFFFFF',
  good: '#1E8A5A', goodSoft: '#E3F4EB',
  bad: '#C8382C', badSoft: '#FBE7E4',
  due: '#B7791F', dueSoft: '#FBF1DF',
  codeBg: '#F2F4F7',
  kw: '#7B35C9', str: '#A35A12', num: '#0F7C77', com: '#8A92A0',
  shadow: 'rgba(22,25,31,0.06)',
  tabBar: '#FFFFFF',
};
const dark = {
  bg: '#0F1115',
  surface: '#171A20',
  sunken: '#1F232B',
  ink: '#EDEFF3',
  body: '#C9CED6',
  muted: '#9AA1AD',
  faint: '#6A717D',
  line: '#272C35',
  accent: '#8099FF',
  accentSoft: '#1E2747',
  onAccent: '#0F1115',
  good: '#4CC38A', goodSoft: '#16291F',
  bad: '#FF7B6E', badSoft: '#3A1E1B',
  due: '#E2B04A', dueSoft: '#33281A',
  codeBg: '#13161B',
  kw: '#C8A2FF', str: '#EDB675', num: '#62D2CB', com: '#6E7685',
  shadow: 'rgba(0,0,0,0)',
  tabBar: '#14171C',
};

// Figtree for the interface, JetBrains Mono only for code.
export const font = {
  regular: 'Figtree_400Regular',
  medium: 'Figtree_500Medium',
  semibold: 'Figtree_600SemiBold',
  bold: 'Figtree_700Bold',
  heavy: 'Figtree_800ExtraBold',
};
export const mono = 'JetBrainsMono_400Regular';
export const monoBold = 'JetBrainsMono_600SemiBold';

// 4-pt spacing, two radii (controls vs. containers), one type scale.
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 };
export const type = {
  display: { fontFamily: font.heavy, fontSize: 30, lineHeight: 36, letterSpacing: -0.6 },
  title: { fontFamily: font.bold, fontSize: 24, lineHeight: 30, letterSpacing: -0.4 },
  h3: { fontFamily: font.bold, fontSize: 18, lineHeight: 24, letterSpacing: -0.2 },
  body: { fontFamily: font.regular, fontSize: 16, lineHeight: 24 },
  bodyStrong: { fontFamily: font.semibold, fontSize: 16, lineHeight: 24 },
  small: { fontFamily: font.regular, fontSize: 14, lineHeight: 20 },
  smallStrong: { fontFamily: font.semibold, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: font.medium, fontSize: 13, lineHeight: 18 },
  code: { fontFamily: mono, fontSize: 13.5, lineHeight: 21 },
};

const ThemeCtx = createContext({ c: light, scheme: 'light', mode: 'system', setMode: () => {} });

export function ThemeProvider({ children }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState('system');
  useEffect(() => {
    load('themeMode', 'system').then((m) => ['system', 'light', 'dark'].includes(m) && setModeState(m));
  }, []);
  const setMode = (m) => {
    setModeState(m);
    save('themeMode', m);
  };
  const scheme = mode === 'system' ? (system === 'dark' ? 'dark' : 'light') : mode;
  const value = useMemo(() => ({ c: scheme === 'dark' ? dark : light, scheme, mode, setMode }), [scheme, mode]);
  return createElement(ThemeCtx.Provider, { value }, children);
}

// Colors for the current theme.
export function useTheme() {
  return useContext(ThemeCtx).c;
}
export function useThemeMode() {
  return useContext(ThemeCtx);
}

export const isWeb = Platform.OS === 'web';
