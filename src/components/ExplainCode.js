import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { explainLine } from '../explain';
import { askClaude } from '../ai';
import { tokenize } from '../code';
import { getApiKey, onKeyChange } from '../storage';
import { font, mono, radius, space, type, useTheme } from '../theme';
import { Btn, Icon, T, s } from './ui';

function useHasKey() {
  const [has, setHas] = useState(false);
  useEffect(() => {
    getApiKey().then((k) => setHas(!!k));
    return onKeyChange((k) => setHas(!!k));
  }, []);
  return has;
}

function Line({ text, lang }) {
  const c = useTheme();
  const toks = tokenize(text || ' ', lang);
  return (
    <Text style={[type.code, { color: c.ink }]}>
      {toks.map((t, i) => (t.k ? <Text key={i} style={{ color: c[t.k] }}>{t.t}</Text> : t.t))}
    </Text>
  );
}

/*
  Code you can tap. Tapping a line opens a plain-English explanation right under it,
  with Previous/Next to walk through the whole thing and an optional AI follow-up.
*/
export function ExplainCode({ code, lang }) {
  const c = useTheme();
  const { width } = useWindowDimensions();
  const hasKey = useHasKey();
  const lines = useMemo(() => code.split('\n'), [code]);
  const [sel, setSel] = useState(null);
  const [ai, setAi] = useState({});
  useEffect(() => { setSel(null); setAi({}); }, [code]);

  const step = (dir) => {
    let i = sel == null ? (dir > 0 ? -1 : lines.length) : sel;
    do { i += dir; } while (i >= 0 && i < lines.length && !lines[i].trim());
    if (i >= 0 && i < lines.length) setSel(i);
  };
  const askAi = async (i) => {
    setAi((a) => ({ ...a, [i]: { loading: true } }));
    try {
      const text = await askClaude({
        system: 'You explain code to a beginner programming student preparing for a C# CRUD skills test. Plain English, no jargon without explaining it, under 90 words. Say what the line does, why it is needed here, and one common mistake with it. No markdown headings.',
        messages: [{ role: 'user', content: `Here is the whole code:\n\n${code}\n\nExplain line ${i + 1}:\n${lines[i]}` }],
        maxTokens: 400,
      });
      setAi((a) => ({ ...a, [i]: { text } }));
    } catch (e) {
      setAi((a) => ({ ...a, [i]: { error: e.message } }));
    }
  };

  const panelWidth = Math.min(width - space.lg * 2 - 2, 726);

  return (
    <View style={{ gap: space.sm }}>
      <View style={s.between}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
          <Icon name="mouse-pointer" size={14} color={c.muted} />
          <T v="caption">Tap any line to see what it does.</T>
        </View>
        <Btn small kind="ghost" icon="play-circle" title={sel == null ? 'Walk me through it' : 'Start over'} onPress={() => setSel(lines.findIndex((l) => l.trim()))} />
      </View>
      <ScrollView horizontal style={[st.box, { backgroundColor: c.codeBg, borderColor: c.line }]} contentContainerStyle={{ paddingVertical: space.sm }}>
        <View>
          {lines.map((ln, i) => {
            const on = sel === i;
            const why = on ? explainLine(ln) : null;
            const a = ai[i];
            return (
              <View key={i}>
                <Pressable
                  onPress={() => (ln.trim() ? setSel(on ? null : i) : null)}
                  accessibilityRole="button"
                  accessibilityLabel={`Line ${i + 1}: ${ln.trim() || 'empty'}. Tap to explain.`}
                  style={({ pressed }) => [st.line, on && { backgroundColor: c.accentSoft }, pressed && !on && { backgroundColor: c.sunken }]}
                >
                  <View style={[st.bar, { backgroundColor: on ? c.accent : 'transparent' }]} />
                  <Text style={[type.code, { color: on ? c.accent : c.faint, width: 24, textAlign: 'right' }]}>{i + 1}</Text>
                  <Line text={ln} lang={lang} />
                </Pressable>
                {on && (
                  <View style={[st.panel, { width: panelWidth, backgroundColor: c.surface, borderColor: c.accent }]}>
                    <T v="body" color={c.ink}>{why || "There's no quick explanation for this line yet."}</T>
                    {a?.loading && (
                      <View style={[s.row, { gap: space.sm }]}>
                        <ActivityIndicator size="small" color={c.accent} />
                        <T v="small" color={c.muted}>Asking the AI…</T>
                      </View>
                    )}
                    {a?.text && (
                      <View style={[st.ai, { backgroundColor: c.accentSoft }]}>
                        <T v="smallStrong" color={c.accent}>More detail from AI</T>
                        <T v="small" color={c.ink}>{a.text}</T>
                      </View>
                    )}
                    {a?.error && <T v="small" color={c.bad}>{a.error}</T>}
                    <View style={[s.row, { justifyContent: 'space-between' }]}>
                      <View style={s.row}>
                        <Btn small icon="chevron-left" title="Previous" onPress={() => step(-1)} accessibilityLabel="Previous line" />
                        <Btn small icon="chevron-right" title="Next" onPress={() => step(1)} accessibilityLabel="Next line" />
                      </View>
                      {hasKey && !a?.text && !a?.loading && <Btn small kind="ghost" icon="zap" title="Ask AI" onPress={() => askAi(i)} />}
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

/*
  The live coach: explains the line you are on while you type.
*/
export function Coach({ line, lineNo, hideCode, empty = 'Start typing. I’ll explain each line as you go.', unknown = 'Keep going. This line isn’t complete yet, or it’s something I can’t explain offline.' }) {
  const c = useTheme();
  const text = line && line.trim() ? explainLine(line) : null;
  return (
    <View style={[st.coach, { backgroundColor: c.accentSoft }]} accessibilityLiveRegion="polite">
      <Icon name="cpu" size={18} color={c.accent} style={{ marginTop: 2 }} />
      <View style={{ flex: 1, gap: 2 }}>
        <T v="smallStrong" color={c.accent}>{line && line.trim() ? `Coach, line ${lineNo}` : 'Coach'}</T>
        {!!(line && line.trim()) && !hideCode && (
          <Text numberOfLines={1} style={{ fontFamily: mono, fontSize: 12.5, color: c.muted }}>{line.trim()}</Text>
        )}
        <T v="small" color={c.ink}>{line && line.trim() ? text || unknown : empty}</T>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  box: { borderWidth: 1, borderRadius: radius.md, flexGrow: 0 },
  line: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingRight: space.lg, minHeight: 26 },
  bar: { width: 3, alignSelf: 'stretch', marginRight: 2 },
  panel: { marginHorizontal: space.sm, marginVertical: space.sm, borderWidth: 1.5, borderRadius: radius.md, padding: space.md, gap: space.sm },
  ai: { borderRadius: 10, padding: space.sm, gap: 2 },
  coach: { flexDirection: 'row', gap: space.sm, borderRadius: radius.md, padding: space.md },
});
