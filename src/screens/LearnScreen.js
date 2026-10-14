import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { CONCEPTS, LANGS, LANG_SHORT, LEVELS, byId } from '../data';
import { codeOf, langName, langOf } from '../code';
import { fullProgram, howToRun } from '../program';
import { ExplainCode } from '../components/ExplainCode';
import { useLearned } from '../plan';
import { space, useTheme } from '../theme';
import { Badge, Btn, Callout, Card, Chip, ChipRow, CodeBlock, Field, Header, Icon, List, Page, Row, Section, Segmented, StepTile, T, s } from '../components/ui';
import { cap } from './TodayScreen';

const LEVEL_TITLE = Object.fromEntries(LEVELS.map((l) => [l.id, l.title]));
const TOTAL = CONCEPTS.length;

export function LangSwitch({ lang, setLang }) {
  return <Segmented value={lang} onChange={setLang} options={Object.keys(LANGS).map((k) => ({ value: k, label: LANG_SHORT[k] }))} />;
}

export default function LearnScreen({ nav }) {
  const c = useTheme();
  const [learned] = useLearned();
  const [q, setQ] = useState('');
  const [level, setLevel] = useState('all');

  const next = CONCEPTS.find((x) => !learned.has(x.id));
  const count = CONCEPTS.filter((x) => learned.has(x.id)).length;
  const needle = q.trim().toLowerCase();
  const results = useMemo(
    () => (needle ? CONCEPTS.filter((x) => (x.title + ' ' + x.use + ' ' + x.group).toLowerCase().includes(needle)) : []),
    [needle]
  );
  const open = (id) => nav.push({ name: 'concept', id });
  const row = (x) => (
    <Row
      key={x.id}
      lead={<StepTile n={x.step} done={learned.has(x.id)} next={next?.id === x.id} />}
      title={cap(x.title)}
      description={x.use}
      onPress={() => open(x.id)}
    />
  );

  return (
    <Page gap={space.xl}>
      <Header title="Learn" subtitle={`${TOTAL} topics in order, from beginner to test-ready. Mark a topic as learned when you can explain it without looking.`} />

      <View style={{ gap: space.sm }}>
        <View style={s.between}>
          <T v="smallStrong">{count} of {TOTAL} learned</T>
          {count > 0 && <T v="small" color={c.muted}>{Math.round((count / TOTAL) * 100)}%</T>}
        </View>
        <View style={{ height: 6, borderRadius: 99, backgroundColor: c.sunken, overflow: 'hidden' }}>
          <View style={{ width: `${(count / TOTAL) * 100}%`, height: '100%', backgroundColor: c.good }} />
        </View>
      </View>

      {next && !needle && (
        <Card tone="accent" onPress={() => open(next.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }} accessibilityLabel={`Up next: ${next.title}`}>
          <StepTile n={next.step} next />
          <View style={{ flex: 1, gap: 2 }}>
            <T v="small" color={c.accent}>{count ? 'Up next' : 'Start here'}</T>
            <T v="h3">{cap(next.title)}</T>
          </View>
          <Icon name="chevron-right" size={20} color={c.accent} />
        </Card>
      )}
      {!next && (
        <Callout tone="good" icon="award" title="Every topic learned">
          Keep them fresh with Practice and Review, and do a timed build in Build.
        </Callout>
      )}

      <View style={{ gap: space.md }}>
        <View style={{ justifyContent: 'center' }}>
          <Icon name="search" size={18} color={c.faint} style={{ position: 'absolute', left: 14, zIndex: 1 }} />
          <Field value={q} onChangeText={setQ} placeholder="Search topics" style={{ paddingLeft: 42 }} accessibilityLabel="Search topics" />
        </View>
        {!needle && (
          <ChipRow>
            {[{ id: 'all', title: 'All levels' }, ...LEVELS].map((l) => (
              <Chip key={l.id} label={l.title} on={l.id === level} onPress={() => setLevel(l.id)} />
            ))}
          </ChipRow>
        )}
      </View>

      {needle ? (
        results.length ? (
          <List>{results.map(row)}</List>
        ) : (
          <View style={{ alignItems: 'center', gap: space.sm, paddingVertical: space.xxl }}>
            <T v="bodyStrong">No topics match "{q}"</T>
            <Btn small kind="ghost" title="Clear search" onPress={() => setQ('')} />
          </View>
        )
      ) : (
        LEVELS.filter((l) => level === 'all' || l.id === level).map((l) => {
          const items = CONCEPTS.filter((x) => x.level === l.id);
          const done = items.filter((x) => learned.has(x.id)).length;
          return (
            <Section key={l.id} title={l.title} action={<Badge tone={done === items.length ? 'good' : 'plain'}>{done} of {items.length}</Badge>}>
              <T v="small" color={c.muted}>{l.desc}</T>
              <List>{items.map(row)}</List>
            </Section>
          );
        })
      )}
    </Page>
  );
}

export function ConceptScreen({ nav, id, lang, setLang }) {
  const c = useTheme();
  const [learned, toggle] = useLearned();
  const x = byId[id];
  if (!x) return null;
  const l = langOf(x, lang);
  const isLearned = learned.has(x.id);
  const nextTopic = CONCEPTS[x.step]; // step is 1-based, so this is the following topic
  return (
    <Page gap={space.lg}>
      <Header onBack={nav.pop} title={cap(x.title)} subtitle={`${LEVEL_TITLE[x.level]}, topic ${x.step} of ${TOTAL}`} large={false} />
      {!x.code.sql && <LangSwitch lang={lang} setLang={setLang} />}
      <Callout tone="good" icon="check-circle" title="Use it when">{x.use}</Callout>
      <Callout tone="bad" icon="alert-triangle" title="Watch out">{x.warn}</Callout>
      <CodeView x={x} lang={lang} l={l} />
      {x.code.sql ? (
        <T v="small" color={c.muted}>SQL is the same whichever language you picked.</T>
      ) : l !== lang ? (
        <T v="small" color={c.muted}>There's no {LANGS[lang]} version of this one, so it's shown in C#.</T>
      ) : null}

      <View style={s.row}>
        <Btn kind="primary" icon="type" title="Type it" onPress={() => nav.go('practice', { name: 'mode', mode: 'type', id: x.id })} />
        <Btn icon="edit-3" title="Fill the blanks" onPress={() => nav.go('practice', { name: 'mode', mode: 'blank', id: x.id })} />
        <Btn
          kind="ghost"
          icon="message-circle"
          title="Ask the tutor"
          onPress={() =>
            nav.ask(
              `Teach me "${x.title}" in ${langName(l)} like I'm reviewing for a skills test: when to use it, one tiny example, one common mistake. Then give me ONE small exercise and wait for my answer.`
            )
          }
        />
      </View>

      <Card style={{ gap: space.md, marginTop: space.md }}>
        <T v="body" color={c.ink}>
          {isLearned ? 'You marked this as learned.' : 'Can you write this without looking and explain when to use it?'}
        </T>
        <View style={s.row}>
          <Btn kind={isLearned ? 'secondary' : 'primary'} icon={isLearned ? 'check' : undefined} title={isLearned ? 'Learned' : 'Mark as learned'} onPress={() => toggle(x.id)} />
          {nextTopic && (
            <Btn kind="ghost" title={`Next: ${cap(nextTopic.title)}`} onPress={() => { nav.pop(); nav.push({ name: 'concept', id: nextTopic.id }); }} />
          )}
        </View>
      </Card>
    </Page>
  );
}

// The code with a Snippet / Full program switch, tap-to-explain lines, and how to run it.
function CodeView({ x, lang, l }) {
  const c = useTheme();
  const [view, setView] = useState('snippet');
  const snippet = codeOf(x, lang);
  const full = useMemo(() => fullProgram(snippet, l), [snippet, l]);
  const wraps = full.code !== snippet;
  useEffect(() => { setView('snippet'); }, [x.id]);
  const steps = howToRun(l, full.kind);
  return (
    <View style={{ gap: space.md }}>
      {wraps && (
        <Segmented
          full
          value={view}
          onChange={setView}
          options={[
            { value: 'snippet', label: 'Just the idea' },
            { value: 'full', label: 'Full program' },
          ]}
        />
      )}
      {view === 'full' && wraps && (
        <T v="small" color={c.muted}>
          {full.kind === 'forms'
            ? 'This is the whole Form1.cs file. The highlighted idea sits inside the form class.'
            : 'Everything a real file needs around the idea: the using lines, the class and the Main method where the program starts.'}
        </T>
      )}
      <ExplainCode code={view === 'full' && wraps ? full.code : snippet} lang={l} />
      {steps.length > 0 && (view === 'full' || !wraps) && (
        <Card style={{ gap: space.sm }}>
          <T v="h3">How to run it</T>
          {steps.map((t, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: space.md }}>
              <T v="bodyStrong" color={c.accent} style={{ width: 16 }}>{i + 1}</T>
              <T v="body" style={{ flex: 1 }}>{t}</T>
            </View>
          ))}
        </Card>
      )}
    </View>
  );
}
