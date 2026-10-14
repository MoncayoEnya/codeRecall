import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { genScenario, getAllGenerated } from '../ai';
import { getApiKey } from '../storage';
import { AiNote } from './AiSource';
import { CHECKS, ERRORS, MINUTE_ZERO, SCENARIOS, SETUP } from '../build';
import { load, save } from '../storage';
import { mono, radius, space, type, useTheme } from '../theme';
import { Badge, Btn, Callout, Card, Checkbox, CodeBlock, Header, List, Page, Row, Section, T, s } from '../components/ui';

const fmt = (secs) => {
  const a = Math.abs(Math.round(secs));
  const h = Math.floor(a / 3600), m = Math.floor((a % 3600) / 60), x = a % 60;
  return (h ? h + ':' + String(m).padStart(2, '0') : String(m)) + ':' + String(x).padStart(2, '0');
};
const bestOf = (list) =>
  list.reduce((b, h) => (!b || h.passed > b.passed || (h.passed === b.passed && h.secs < b.secs) ? h : b), null);

/* ---------------- Hub ---------------- */
export default function BuildHub({ nav }) {
  const c = useTheme();
  const [history, setHistory] = useState([]);
  const [mine, setMine] = useState([]);
  const [making, setMaking] = useState(false);
  const [err, setErr] = useState('');
  const refresh = async () => {
    const [h, ids, gen] = await Promise.all([load('builds', []), load('genScenarios', []), getAllGenerated()]);
    setHistory(h);
    setMine(ids.map((id) => gen[id]).filter(Boolean));
  };
  useEffect(() => { refresh(); }, []);
  const make = async () => {
    setErr('');
    if (!(await getApiKey())) return nav.go('today', { name: 'settings' });
    setMaking(true);
    try {
      const sc = await genScenario();
      await refresh();
      nav.push({ name: 'scenario', id: sc.id });
    } catch (e) {
      setErr(e.message);
    } finally {
      setMaking(false);
    }
  };
  return (
    <Page gap={space.xl}>
      <Header title="Build" subtitle="Practice the real test: build a CRUD app in Visual Studio against a timer, then check it like a grader would." />

      <Card tone="accent" style={{ gap: space.md }}>
        <T v="h3">Get a scenario you haven't seen</T>
        <T v="body" color={c.ink}>The AI writes a new test task: a table, validation rules, an extra feature and the grader's checks.</T>
        {making ? (
          <View style={[s.row, { gap: space.md }]}>
            <ActivityIndicator color={c.accent} />
            <T v="small" color={c.muted}>Writing your scenario…</T>
          </View>
        ) : (
          <Btn kind="primary" icon="zap" title="Make a new scenario" onPress={make} />
        )}
        {!!err && <T v="small" color={c.bad}>{err}</T>}
      </Card>

      {mine.length > 0 && (
        <Section title="Made for you">
          <List>
            {mine.map((sc) => {
              const b = bestOf(history.filter((h) => h.sid === sc.id));
              return (
                <Row key={sc.id} icon="zap" iconTone={b && b.passed === b.total ? 'good' : 'accent'} title={sc.title}
                  description={b ? `Best: ${b.passed} of ${b.total} checks in ${fmt(b.secs)}` : `${sc.minutes} minutes. Not tried yet.`}
                  onPress={() => nav.push({ name: 'scenario', id: sc.id })} />
              );
            })}
          </List>
        </Section>
      )}

      <Section title="Built-in scenarios">
        <List>
          {SCENARIOS.map((sc) => {
            const b = bestOf(history.filter((h) => h.sid === sc.id));
            return (
              <Row
                key={sc.id}
                icon="clipboard"
                iconTone={b && b.passed === b.total ? 'good' : 'accent'}
                title={sc.title}
                description={b ? `Best: ${b.passed} of ${b.total} checks in ${fmt(b.secs)}` : `${sc.minutes} minutes. Not tried yet.`}
                onPress={() => nav.push({ name: 'scenario', id: sc.id })}
              />
            );
          })}
        </List>
      </Section>

      <Section title="Before test day">
        <List>
          <Row icon="life-buoy" iconTone="plain" title="Setup sheet" description="First 15 minutes, connection strings, and fixes for common errors." onPress={() => nav.push({ name: 'setup' })} />
          <Row icon="layout" iconTone="plain" title="The full CRUD form" description="One complete form to memorize. Open it in Learn." onPress={() => nav.go('learn', { name: 'concept', id: 'template' })} />
        </List>
      </Section>
    </Page>
  );
}

/* ---------------- One scenario ---------------- */
export function ScenarioScreen({ nav, id }) {
  const builtIn = SCENARIOS.find((x) => x.id === id);
  const [sc, setSc] = useState(builtIn || null);
  useEffect(() => {
    if (!builtIn) getAllGenerated().then((g) => setSc(g[id] || null));
  }, [id]);
  if (!sc) return null;
  return <Scenario nav={nav} sc={sc} />;
}

function Scenario({ nav, sc }) {
  const c = useTheme();
  const groups = [...CHECKS, { group: 'For this scenario', items: sc.checks }];
  const total = groups.reduce((n, g) => n + g.items.length, 0);

  const [ticked, setTicked] = useState({});
  const [acc, setAcc] = useState(0);
  const [startedAt, setStartedAt] = useState(null);
  const [, tick] = useState(0);
  const [history, setHistory] = useState([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    load('builds', []).then(setHistory);
  }, []);
  useEffect(() => {
    if (!startedAt) return;
    const t = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [startedAt]);

  const elapsed = acc + (startedAt ? (Date.now() - startedAt) / 1000 : 0);
  const left = sc.minutes * 60 - elapsed;
  const passed = Object.values(ticked).filter(Boolean).length;
  const mine = history.filter((h) => h.sid === sc.id);

  const toggleTimer = () => {
    if (startedAt) {
      setAcc(elapsed);
      setStartedAt(null);
    } else setStartedAt(Date.now());
  };
  const finish = async () => {
    const entry = { sid: sc.id, date: new Date().toISOString(), secs: Math.round(elapsed), passed, total };
    const next = [entry, ...history].slice(0, 50);
    setHistory(next);
    await save('builds', next);
    setAcc(elapsed);
    setStartedAt(null);
    setSaved(true);
  };

  return (
    <View style={{ flex: 1 }}>
      <Page gap={space.xl}>
        <Header onBack={nav.pop} title={sc.title} subtitle={`A Windows Forms app with a database. Time limit: ${sc.minutes} minutes.`} large={false} />

        <Section title="The table">
          <ScrollView horizontal style={[st.box, { backgroundColor: c.codeBg, borderColor: c.line }]} contentContainerStyle={{ padding: space.lg }}>
            <Text style={[type.code, { color: c.ink }]}>{sc.table}</Text>
          </ScrollView>
          <Callout icon="plus-circle" title="Extra feature">{sc.extra}</Callout>
          {sc.ai && <AiNote />}
        </Section>

        <Section title="Grader's checklist" action={<Badge tone={passed === total ? 'good' : 'plain'}>{passed} of {total}</Badge>}>
          <T v="small" color={c.muted}>Test your app the way a grader would. Tick only what really works.</T>
          {groups.map((g) => (
            <Card key={g.group} style={{ gap: 0, paddingVertical: space.md }}>
              <T v="smallStrong" color={c.muted} style={{ marginBottom: space.xs }}>{g.group}</T>
              {g.items.map((it) => {
                const k = g.group + '|' + it;
                return <Checkbox key={k} on={!!ticked[k]} onPress={() => setTicked((t) => ({ ...t, [k]: !t[k] }))} label={it} />;
              })}
            </Card>
          ))}
          {saved ? (
            <Callout tone={passed === total ? 'good' : 'due'} icon={passed === total ? 'award' : 'flag'} title="Result saved">
              {passed === total
                ? 'Every check passed. Try another scenario, or this one faster.'
                : `${total - passed} check${total - passed === 1 ? '' : 's'} not passing. Those are exactly what a grader tries first, so fix them next time.`}
            </Callout>
          ) : (
            <Btn kind="primary" full title="Finish and save result" onPress={finish} disabled={!elapsed && !passed} />
          )}
        </Section>

        {mine.length > 0 && (
          <Section title="Your attempts">
            <Card style={{ gap: space.sm }}>
              {mine.slice(0, 5).map((h, i) => (
                <View key={i} style={s.between}>
                  <T v="small" color={c.muted}>{new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</T>
                  <T v="small" color={c.ink} style={{ fontVariant: ['tabular-nums'] }}>
                    {h.passed} of {h.total} checks in {fmt(h.secs)}
                  </T>
                </View>
              ))}
            </Card>
          </Section>
        )}
        <View style={{ height: 72 }} />
      </Page>

      {/* Timer stays visible while scrolling the checklist. */}
      <View style={[st.timer, { backgroundColor: c.surface, borderTopColor: c.line }]}>
        <View style={{ flex: 1 }}>
          <Text style={[st.clock, { color: left < 0 ? c.bad : c.ink }]}>
            {left < 0 ? '+' : ''}
            {fmt(left)}
          </Text>
          <T v="caption">{left < 0 ? 'Over time. Keep going and note it.' : startedAt ? 'Time left' : elapsed ? 'Paused' : 'Start when you open Visual Studio'}</T>
        </View>
        {elapsed > 0 && !startedAt && <Btn small kind="ghost" title="Reset" onPress={() => { setAcc(0); setSaved(false); }} />}
        <Btn kind={startedAt ? 'secondary' : 'primary'} icon={startedAt ? 'pause' : 'play'} title={startedAt ? 'Pause' : elapsed ? 'Resume' : 'Start'} onPress={toggleTimer} />
      </View>
    </View>
  );
}

/* ---------------- Setup sheet ---------------- */
export function SetupScreen({ nav }) {
  const c = useTheme();
  return (
    <Page gap={space.xl}>
      <Header onBack={nav.pop} title="Setup sheet" subtitle="Setup problems are the easiest way to lose 20 minutes on test day. Read this the night before." large={false} />

      <Section title="The first 15 minutes">
        <Card style={{ gap: space.md }}>
          {MINUTE_ZERO.map((step, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: space.md }}>
              <View style={[st.step, { backgroundColor: c.accentSoft }]}>
                <T v="smallStrong" color={c.accent}>{i + 1}</T>
              </View>
              <T v="body" color={c.ink} style={{ flex: 1 }}>{step}</T>
            </View>
          ))}
        </Card>
      </Section>

      {SETUP.map((x) => (
        <Section key={x.title} title={x.title}>
          <T v="body">{x.note}</T>
          <CodeBlock code={x.code} lang={x.lang} />
        </Section>
      ))}

      <Section title="When you see an error">
        <List>
          {ERRORS.map(([err, why, fix]) => (
            <View key={err} style={{ padding: space.lg, gap: space.xs }}>
              <Text selectable style={{ fontFamily: mono, fontSize: 13, lineHeight: 19, color: c.bad }}>{err}</Text>
              <T v="small" color={c.muted}>{why}</T>
              <T v="body" color={c.ink}>{fix}</T>
            </View>
          ))}
        </List>
      </Section>
    </Page>
  );
}

const st = StyleSheet.create({
  box: { borderWidth: 1, borderRadius: radius.md, flexGrow: 0 },
  timer: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.md, borderTopWidth: StyleSheet.hairlineWidth },
  clock: { fontFamily: mono, fontSize: 28, lineHeight: 34, fontVariant: ['tabular-nums'] },
  step: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
});
