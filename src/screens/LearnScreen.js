import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { CONCEPTS, LANGS, LANG_SHORT, byId } from '../data';
import { codeOf, langName, langOf } from '../code';
import { space, useTheme } from '../theme';
import { Btn, Callout, ChipRow, Chip, CodeBlock, Field, Header, Icon, List, Page, Row, Section, Segmented, T, s } from '../components/ui';
import { cap } from './TodayScreen';

export const GROUP_ICON = { CRUD: 'database', Basics: 'repeat', Data: 'layers', Algorithms: 'bar-chart-2', 'OOP & errors': 'box', SQL: 'server' };
const GROUPS = [...new Set(CONCEPTS.map((x) => x.group))];

export function LangSwitch({ lang, setLang }) {
  return <Segmented value={lang} onChange={setLang} options={Object.keys(LANGS).map((k) => ({ value: k, label: LANG_SHORT[k] }))} />;
}

export default function LearnScreen({ nav }) {
  const c = useTheme();
  const [q, setQ] = useState('');
  const [group, setGroup] = useState('All');

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return CONCEPTS.filter(
      (x) => (group === 'All' || x.group === group) && (!needle || (x.title + ' ' + x.use).toLowerCase().includes(needle))
    );
  }, [q, group]);

  return (
    <Page gap={space.xl}>
      <Header title="Learn" subtitle="Each topic shows when to use it, the mistake people make, and the code." />
      <View style={{ gap: space.md }}>
        <View style={{ justifyContent: 'center' }}>
          <Icon name="search" size={18} color={c.faint} style={{ position: 'absolute', left: 14, zIndex: 1 }} />
          <Field value={q} onChangeText={setQ} placeholder="Search topics" style={{ paddingLeft: 42 }} accessibilityLabel="Search topics" />
        </View>
        <ChipRow>
          {['All', ...GROUPS].map((g) => (
            <Chip key={g} label={g} on={g === group} onPress={() => setGroup(g)} />
          ))}
        </ChipRow>
      </View>

      {GROUPS.filter((g) => shown.some((x) => x.group === g)).map((g) => (
        <Section key={g} title={g === 'CRUD' ? 'CRUD (your test topic)' : g}>
          <List>
            {shown
              .filter((x) => x.group === g)
              .map((x) => (
                <Row
                  key={x.id}
                  icon={GROUP_ICON[g] || 'file'}
                  iconTone={g === 'CRUD' ? 'accent' : 'plain'}
                  title={cap(x.title)}
                  description={x.use}
                  onPress={() => nav.push({ name: 'concept', id: x.id })}
                />
              ))}
          </List>
        </Section>
      ))}

      {shown.length === 0 && (
        <View style={{ alignItems: 'center', gap: space.sm, paddingVertical: space.xxl }}>
          <T v="bodyStrong">No topics match "{q}"</T>
          <Btn small kind="ghost" title="Clear search" onPress={() => { setQ(''); setGroup('All'); }} />
        </View>
      )}
    </Page>
  );
}

export function ConceptScreen({ nav, id, lang, setLang }) {
  const c = useTheme();
  const x = byId[id];
  if (!x) return null;
  const l = langOf(x, lang);
  return (
    <Page gap={space.lg}>
      <Header onBack={nav.pop} title={cap(x.title)} subtitle={x.group} large={false} />
      {!x.code.sql && <LangSwitch lang={lang} setLang={setLang} />}
      <Callout tone="good" icon="check-circle" title="Use it when">{x.use}</Callout>
      <Callout tone="bad" icon="alert-triangle" title="Watch out">{x.warn}</Callout>
      <CodeBlock code={codeOf(x, lang)} lang={l} />
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
    </Page>
  );
}
