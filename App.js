import { useCallback, useEffect, useMemo, useState } from 'react';
import { BackHandler, Image, Pressable, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Figtree_400Regular, Figtree_500Medium, Figtree_600SemiBold, Figtree_700Bold, Figtree_800ExtraBold } from '@expo-google-fonts/figtree';
import { JetBrainsMono_400Regular, JetBrainsMono_600SemiBold } from '@expo-google-fonts/jetbrains-mono';
import { LANGS, TEST } from './src/data';
import { load, save } from './src/storage';
import { ThemeProvider, space, useTheme, useThemeMode } from './src/theme';
import { Icon, T, useWide } from './src/components/ui';
import { today0 } from './src/plan';
import TodayScreen from './src/screens/TodayScreen';
import PlanScreen from './src/screens/PlanScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import LearnScreen, { ConceptScreen } from './src/screens/LearnScreen';
import PracticeHub, { PracticeMode } from './src/screens/PracticeScreen';
import BuildHub, { ScenarioScreen, SetupScreen } from './src/screens/BuildScreen';
import TutorScreen from './src/screens/TutorScreen';

const TABS = [
  { id: 'today', label: 'Today', icon: 'sun' },
  { id: 'learn', label: 'Learn', icon: 'book-open' },
  { id: 'practice', label: 'Practice', icon: 'target' },
  { id: 'build', label: 'Build', icon: 'tool' },
  { id: 'tutor', label: 'Tutor', icon: 'message-circle' },
];

export default function App() {
  const [loaded] = useFonts({
    Figtree_400Regular, Figtree_500Medium, Figtree_600SemiBold, Figtree_700Bold, Figtree_800ExtraBold,
    JetBrainsMono_400Regular, JetBrainsMono_600SemiBold,
  });
  return (
    <SafeAreaProvider>
      <ThemeProvider>{loaded ? <Main /> : <Blank />}</ThemeProvider>
    </SafeAreaProvider>
  );
}

function Blank() {
  const c = useTheme();
  return <View style={{ flex: 1, backgroundColor: c.bg }} />;
}

function Main() {
  const c = useTheme();
  const { scheme } = useThemeMode();
  const insets = useSafeAreaInsets();
  const wide = useWide();
  const [tab, setTab] = useState('today');
  const [stacks, setStacks] = useState({ today: [], learn: [], practice: [], build: [], tutor: [] });
  const [lang, setLangState] = useState('cs');
  const [tutorPrompt, setTutorPrompt] = useState(null);

  useEffect(() => {
    load('lang', 'cs').then((l) => LANGS[l] && setLangState(l));
  }, []);
  const setLang = useCallback((l) => {
    setLangState(l);
    save('lang', l);
  }, []);

  // Navigation: each tab keeps its own stack of pushed screens.
  const nav = useMemo(() => {
    const push = (route, inTab) =>
      setStacks((s) => {
        const t = inTab || tabRef.current;
        return { ...s, [t]: [...s[t], route] };
      });
    return {
      push: (route) => push(route),
      pop: () => setStacks((s) => ({ ...s, [tabRef.current]: s[tabRef.current].slice(0, -1) })),
      // Switch tab; optionally open a screen there (replacing that tab's stack).
      go: (t, route) => {
        tabRef.current = t;
        setTab(t);
        setStacks((s) => ({ ...s, [t]: route ? [route] : [] }));
      },
      ask: (prompt) => {
        tabRef.current = 'tutor';
        setTab('tutor');
        setStacks((s) => ({ ...s, tutor: [] }));
        setTutorPrompt({ text: prompt, at: Date.now() });
      },
    };
  }, []);
  tabRef.current = tab;

  // Android back button: pop the stack, then return to Today.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (stacks[tab].length) { nav.pop(); return true; }
      if (tab !== 'today') { nav.go('today'); return true; }
      return false;
    });
    return () => sub.remove();
  }, [stacks, tab, nav]);

  const selectTab = (t) => {
    if (t === tab && stacks[t].length) setStacks((s) => ({ ...s, [t]: [] })); // tap again = back to top
    tabRef.current = t;
    setTab(t);
  };

  const shared = { nav, lang, setLang };
  const roots = {
    today: <TodayScreen {...shared} />,
    learn: <LearnScreen {...shared} />,
    practice: <PracticeHub {...shared} />,
    build: <BuildHub {...shared} />,
    tutor: <TutorScreen {...shared} prompt={tutorPrompt} active={tab === 'tutor'} />,
  };
  const renderRoute = (r) => {
    switch (r.name) {
      case 'plan': return <PlanScreen {...shared} />;
      case 'settings': return <SettingsScreen {...shared} />;
      case 'concept': return <ConceptScreen {...shared} id={r.id} />;
      case 'mode': return <PracticeMode {...shared} mode={r.mode} id={r.id} />;
      case 'scenario': return <ScenarioScreen {...shared} id={r.id} />;
      case 'setup': return <SetupScreen {...shared} />;
      default: return null;
    }
  };

  const left = Math.round((TEST - today0()) / 86400000);

  return (
    <View style={{ flex: 1, flexDirection: wide ? 'row' : 'column', backgroundColor: c.bg, paddingTop: wide ? 0 : insets.top, paddingLeft: insets.left, paddingRight: insets.right }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />

      {wide && (
        <View style={[st.side, { backgroundColor: c.surface, borderRightColor: c.line, paddingTop: insets.top + space.xl }]}>
          <View style={{ paddingHorizontal: space.md, flexDirection: 'row', alignItems: 'center', gap: space.md, marginBottom: space.xl }}>
            <Image source={require('./assets/logo-mark.png')} style={{ width: 36, height: 36, borderRadius: 9 }} accessibilityIgnoresInvertColors />
            <View>
              <T v="h3">Code Recall</T>
              <T v="small" color={c.muted}>{left > 0 ? `${left} days until Nov 10` : left === 0 ? 'Test day' : 'Test finished'}</T>
            </View>
          </View>
          {TABS.map((t) => {
            const on = t.id === tab;
            return (
              <Pressable key={t.id} onPress={() => selectTab(t.id)} accessibilityRole="tab" accessibilityState={{ selected: on }}
                style={({ pressed }) => [st.sideItem, on && { backgroundColor: c.accentSoft }, pressed && !on && { backgroundColor: c.sunken }]}>
                <Icon name={t.icon} size={18} color={on ? c.accent : c.muted} />
                <T v="bodyStrong" color={on ? c.accent : c.body}>{t.label}</T>
              </Pressable>
            );
          })}
        </View>
      )}

      <View style={{ flex: 1 }}>
        {TABS.map((t) => {
          const stack = stacks[t.id];
          return (
            <View key={t.id} style={[{ flex: 1 }, t.id !== tab && st.hidden]}>
              <View style={[{ flex: 1 }, stack.length > 0 && st.hidden]}>{roots[t.id]}</View>
              {stack.length > 0 && <View key={stack.length} style={{ flex: 1 }}>{renderRoute(stack[stack.length - 1])}</View>}
            </View>
          );
        })}
      </View>

      {!wide && (
        <View style={[st.tabbar, { backgroundColor: c.tabBar, borderTopColor: c.line, paddingBottom: Math.max(insets.bottom, 8) }]}>
          {TABS.map((t) => {
            const on = t.id === tab;
            return (
              <Pressable key={t.id} onPress={() => selectTab(t.id)} accessibilityRole="tab" accessibilityLabel={t.label} accessibilityState={{ selected: on }} style={st.tabBtn}>
                <Icon name={t.icon} size={22} color={on ? c.accent : c.faint} />
                <T v="caption" color={on ? c.accent : c.muted} style={{ fontSize: 11, lineHeight: 14 }}>{t.label}</T>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const tabRef = { current: 'today' };

const st = StyleSheet.create({
  hidden: { display: 'none' },
  tabbar: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 8 },
  tabBtn: { flex: 1, alignItems: 'center', gap: 3 },
  side: { width: 232, borderRightWidth: StyleSheet.hairlineWidth, paddingHorizontal: space.sm, gap: 2 },
  sideItem: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: 10, paddingHorizontal: space.md, borderRadius: 10 },
});
