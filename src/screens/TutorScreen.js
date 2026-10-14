import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { LANGS, TEST } from '../data';
import { todayTopic } from '../plan';
import { getApiKey, onKeyChange, setApiKey } from '../storage';
import { askClaude } from '../ai';
import { font, mono, radius, space, type, useTheme } from '../theme';
import { Btn, Callout, Card, Field, Header, Icon, List, Page, Row, T, s } from '../components/ui';

const STARTERS = [
  { icon: 'clipboard', title: 'Give me a CRUD scenario', make: () => 'Give me a realistic CRUD skills-test scenario (one table, 4-5 fields, validation rules, and what the grader will test). Do NOT show code. I will build it and paste parts for review.' },
  { icon: 'help-circle', title: "Quiz me on today's topic", make: () => `Give me 3 short quiz questions on today's topic from my study plan (${todayTopic()}). One at a time. Wait for my answer each time.` },
  { icon: 'check-square', title: 'Give me a mock test', make: () => "Give me a 6-item mock skills test focused on CRUD: 1 output-tracing, 2 SQL CRUD statements, 2 C# CRUD methods to write, 1 find-the-bug in a SqlCommand. No answers yet; I'll answer all, then grade me." },
  { icon: 'code', title: 'Give me a coding problem', make: () => 'Give me one skills-test style coding problem at medium difficulty. Do NOT show the solution. Wait for my attempt.' },
];

const rules = (lang) => `You are a patient coding tutor for a 4th-year BSCS student in the Philippines who has a programming skills test on November 10, 2026. Today is ${new Date().toDateString()}. They admit they rely on AI too much and forgot a lot of syntax, so your job is to make them THINK and REMEMBER, not to do the work for them.
Rules:
- The skills test is about CRUD (Create, Read, Update, Delete), most likely in C# with a SQL database (SQL Server or MySQL), possibly a WinForms app with a DataGridView. Steer practice toward CRUD: classes, List<T>, input validation, parameterized SqlCommand, ExecuteNonQuery/ExecuteReader, refreshing the grid, confirm-before-delete.
- Their preferred language is ${LANGS[lang]} unless they say otherwise.
- When they ask for a solution, give a hint or the first step first and ask them to try. Give the full solution only if they ask again or after they attempt it.
- When they paste code, point to the line with the bug and explain why, then let them fix it.
- When asked for problems or quizzes, give typical skills-test items and wait for their answers. Grade honestly.
- Keep replies short and clear (under 200 words unless writing a mock test). Plain English; simple Taglish is fine if they use it. Put code in fenced code blocks.`;

export default function TutorScreen({ nav, lang, prompt, active }) {
  const c = useTheme();
  const [apiKey, setKey] = useState(null);
  const [ready, setReady] = useState(false);
  const [turns, setTurns] = useState([]);
  const [box, setBox] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const scroller = useRef(null);
  const pending = useRef(null);

  useEffect(() => {
    getApiKey().then((k) => { setKey(k); setReady(true); });
    return onKeyChange(setKey);
  }, []);

  useEffect(() => {
    if (!prompt?.text) return;
    if (apiKey) send(prompt.text);
    else pending.current = prompt.text;
  }, [prompt]);
  useEffect(() => {
    if (apiKey && pending.current) {
      const p = pending.current;
      pending.current = null;
      send(p);
    }
  }, [apiKey]);

  const send = async (text) => {
    text = (text || '').trim();
    if (!text || busy || !apiKey) return;
    setNote('');
    setBox('');
    const next = [...turns, { role: 'user', content: text }];
    setTurns(next);
    setBusy(true);
    try {
      let history = next.slice(-16);
      while (history.length && history[0].role !== 'user') history = history.slice(1);
      const answer = await askClaude({ system: rules(lang), messages: history });
      setTurns([...next, { role: 'assistant', content: answer || 'No answer came back. Try asking in a different way.' }]);
    } catch (e) {
      setNote(e.message || 'No connection. Check your internet and send again.');
      setTurns(next.slice(0, -1));
      setBox(text);
    } finally {
      setBusy(false);
    }
  };

  if (!ready) return null;
  if (!apiKey) return <KeySetup pendingPrompt={!!pending.current} />;

  const days = Math.max(0, Math.round((TEST - new Date().setHours(0, 0, 0, 0)) / 86400000));

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        ref={scroller}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => turns.length && scroller.current?.scrollToEnd({ animated: true })}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View style={st.col}>
          <Header
            title="Tutor"
            subtitle={turns.length ? undefined : `${days} days to go. Ask anything, or paste code you're stuck on. The tutor gives hints before answers.`}
            right={turns.length ? <Btn small kind="ghost" icon="plus" title="New chat" onPress={() => { setTurns([]); setNote(''); }} disabled={busy} /> : null}
          />
          {turns.length === 0 ? (
            <List>
              {STARTERS.map((x) => (
                <Row key={x.title} icon={x.icon} title={x.title} onPress={() => send(x.make())} />
              ))}
            </List>
          ) : (
            turns.map((t, i) => <Message key={i} who={t.role}>{t.content}</Message>)
          )}
          {busy && (
            <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={c.accent} />
              <T v="small" color={c.muted}>Thinking</T>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[st.composer, { borderTopColor: c.line, backgroundColor: c.bg }]}>
        <View style={st.composerInner}>
          {!!note && <Callout tone="bad" icon="alert-circle">{note}</Callout>}
          <View style={[st.inputWrap, { backgroundColor: c.surface, borderColor: c.line }]}>
            <TextInput
              value={box}
              onChangeText={setBox}
              placeholder="Ask a question or paste your code"
              placeholderTextColor={c.faint}
              multiline
              autoCapitalize="sentences"
              autoCorrect={false}
              accessibilityLabel="Message to the tutor"
              style={[st.input, { color: c.ink }]}
              onKeyPress={(e) => {
                if (Platform.OS === 'web' && e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
                  e.preventDefault?.();
                  send(box);
                }
              }}
            />
            <Pressable
              onPress={() => send(box)}
              disabled={busy || !box.trim()}
              accessibilityRole="button"
              accessibilityLabel="Send"
              style={[st.send, { backgroundColor: busy || !box.trim() ? c.sunken : c.accent }]}
            >
              <Icon name="arrow-up" size={18} color={busy || !box.trim() ? c.faint : c.onAccent} />
            </Pressable>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function KeySetup({ pendingPrompt }) {
  const c = useTheme();
  const [draft, setDraft] = useState('');
  const [err, setErr] = useState('');
  const save = async () => {
    const k = draft.trim();
    if (!k.startsWith('sk-ant-')) return setErr('Anthropic keys start with "sk-ant-". Check that you copied the whole key.');
    await setApiKey(k);
  };
  return (
    <Page gap={space.xl}>
      <Header title="Tutor" subtitle="A Claude tutor that knows your test is CRUD in C#. It gives hints first, so you still do the thinking." />
      {pendingPrompt && <Callout tone="due" icon="clock">Your question is waiting. It sends as soon as you add a key.</Callout>}
      <Card style={{ gap: space.md }}>
        <T v="h3">Connect your API key</T>
        <View style={{ gap: space.sm }}>
          {['Sign in at console.anthropic.com.', 'Add a little credit under Billing. Haiku costs very little.', 'Create a key under API Keys and paste it below.'].map((t, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: space.md }}>
              <T v="bodyStrong" color={c.accent} style={{ width: 16 }}>{i + 1}</T>
              <T v="body" style={{ flex: 1 }}>{t}</T>
            </View>
          ))}
        </View>
        <Field value={draft} onChangeText={(t) => { setDraft(t); setErr(''); }} placeholder="sk-ant-…" secureTextEntry accessibilityLabel="API key" />
        {!!err && <T v="small" color={c.bad}>{err}</T>}
        <View style={s.row}>
          <Btn kind="primary" title="Save key" onPress={save} disabled={!draft.trim()} />
          <Btn kind="ghost" title="Open Anthropic Console" onPress={() => Linking.openURL('https://console.anthropic.com/settings/keys')} />
        </View>
        <T v="small" color={c.muted}>The key is billed separately from a Claude subscription and is stored only on this device.</T>
      </Card>
    </Page>
  );
}

/* Message with light markdown: ```code```, `inline`, **bold**, # headings. */
function Message({ who, children }) {
  const c = useTheme();
  const text = String(children);
  if (who === 'user') {
    return (
      <View style={[st.user, { backgroundColor: c.accentSoft }]}>
        <Text selectable style={[type.body, { color: c.ink }]}>{text}</Text>
      </View>
    );
  }
  const parts = text.split('```');
  return (
    <View style={{ gap: space.sm }}>
      {parts.map((p, i) => {
        if (i % 2) {
          const nl = p.indexOf('\n');
          const body = nl >= 0 && /^[\w+#-]*$/.test(p.slice(0, nl).trim()) ? p.slice(nl + 1) : p;
          return (
            <ScrollView key={i} horizontal style={[st.pre, { backgroundColor: c.codeBg, borderColor: c.line }]} contentContainerStyle={{ padding: space.md }}>
              <Text selectable style={[type.code, { color: c.ink }]}>{body.replace(/\n$/, '')}</Text>
            </ScrollView>
          );
        }
        if (!p.trim()) return null;
        const cleaned = p.replace(/^\n+|\n+$/g, '').replace(/^#{1,4} (.*)$/gm, '**$1**');
        const bits = cleaned.split(/(\*\*[^*\n]+\*\*|`[^`\n]+`)/);
        return (
          <Text key={i} selectable style={[type.body, { color: c.ink }]}>
            {bits.map((b, j) =>
              b.startsWith('**') && b.endsWith('**') && b.length > 4 ? (
                <Text key={j} style={{ fontFamily: font.bold }}>{b.slice(2, -2)}</Text>
              ) : b.startsWith('`') && b.endsWith('`') && b.length > 2 ? (
                <Text key={j} style={{ fontFamily: mono, fontSize: 14, color: c.kw }}>{b.slice(1, -1)}</Text>
              ) : (
                b
              )
            )}
          </Text>
        );
      })}
    </View>
  );
}

const st = StyleSheet.create({
  col: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: space.lg, gap: space.xl },
  user: { alignSelf: 'flex-end', maxWidth: '85%', borderRadius: 18, borderBottomRightRadius: 6, paddingHorizontal: space.lg, paddingVertical: space.md },
  pre: { borderWidth: 1, borderRadius: radius.md, flexGrow: 0 },
  composer: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: space.lg, paddingVertical: space.md },
  composerInner: { width: '100%', maxWidth: 760, alignSelf: 'center', gap: space.sm },
  inputWrap: { flexDirection: 'row', alignItems: 'flex-end', borderWidth: 1, borderRadius: 22, paddingLeft: space.lg, paddingRight: 6, paddingVertical: 6 },
  input: { flex: 1, fontFamily: font.regular, fontSize: 16, lineHeight: 22, maxHeight: 140, paddingVertical: 6 },
  send: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
});
