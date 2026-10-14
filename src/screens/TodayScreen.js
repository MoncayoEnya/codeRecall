import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SCENARIOS } from '../build';
import { DAYS, daysLeft, fmtDate, startTarget, todayIndex, useDone } from '../plan';
import { dueKeys, getReview, onReviewChange } from '../review';
import { load } from '../storage';
import { radius, space, useTheme } from '../theme';
import { Btn, Card, Checkbox, Icon, List, Page, Row, Section, T, s } from '../components/ui';

export default function TodayScreen({ nav }) {
  const c = useTheme();
  const [done, toggle] = useDone();
  const [due, setDue] = useState(0);
  const [builds, setBuilds] = useState([]);

  useEffect(() => {
    getReview().then((m) => setDue(dueKeys(m).length));
    load('builds', []).then(setBuilds);
    return onReviewChange((m) => setDue(dueKeys(m).length));
  }, []);

  const ti = todayIndex();
  const left = daysLeft();
  const before = ti < 0;
  const after = ti >= DAYS.length;
  const day = DAYS[Math.min(Math.max(ti, 0), DAYS.length - 1)];
  // The first unfinished day up to today is the one to do now.
  const catchUp = DAYS.slice(0, Math.max(0, Math.min(ti, DAYS.length))).find((d) => !done.has(d.idx));
  const week = DAYS.filter((d) => d.week === day.week);
  const start = (d) => {
    const t = startTarget(d);
    nav.go(t.tab, t.route);
  };
  const lastBuild = builds[0];
  const lastScenario = lastBuild && SCENARIOS.find((x) => x.id === lastBuild.sid);

  const headline = after
    ? left === 0
      ? 'Test day. You prepared for this.'
      : 'Your study plan is finished.'
    : left === 1
    ? '1 day until your skills test'
    : `${left} days until your skills test`;

  return (
    <Page gap={space.xl}>
      <View style={s.between}>
        <T v="caption" color={c.muted}>{fmtDate(new Date(), { weekday: 'long', month: 'long', day: 'numeric' })}</T>
        <Pressable onPress={() => nav.push({ name: 'settings' })} hitSlop={10} accessibilityRole="button" accessibilityLabel="Settings">
          <Icon name="settings" size={20} color={c.muted} />
        </Pressable>
      </View>

      <View style={{ gap: space.md, marginTop: -space.sm }}>
        <T v="display" accessibilityRole="header">{headline}</T>
        <DayTrack done={done} ti={ti} />
        <View style={s.between}>
          <T v="small" color={c.muted}>{done.size} of {DAYS.length} days done</T>
          <T v="small" color={c.muted}>Test on Tue, Nov 10</T>
        </View>
      </View>

      {!after && (
        <Section title={before ? 'Starts tomorrow' : `Today, day ${day.idx + 1}`}>
          <Card style={{ gap: space.md }}>
            <View style={{ gap: 4 }}>
              <T v="title">{cap(day.title)}</T>
              <T v="body">{day.task}</T>
            </View>
            <View style={s.row}>
              <Btn kind="primary" title="Start" icon="play" onPress={() => start(day)} />
              <Btn
                title={done.has(day.idx) ? 'Done' : 'Mark as done'}
                icon={done.has(day.idx) ? 'check' : undefined}
                onPress={() => toggle(day.idx)}
              />
            </View>
          </Card>
          {catchUp && catchUp.idx !== day.idx && (
            <Card onPress={() => start(catchUp)} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }} accessibilityLabel={`Catch up on ${catchUp.title}`}>
              <Icon name="corner-up-left" size={18} color={c.muted} />
              <View style={{ flex: 1 }}>
                <T v="smallStrong">Not finished: {catchUp.title}</T>
                <T v="small" color={c.muted}>{fmtDate(catchUp.date)}</T>
              </View>
              <Icon name="chevron-right" size={18} color={c.faint} />
            </Card>
          )}
        </Section>
      )}

      <List>
        <Row
          icon="rotate-ccw"
          iconTone={due ? 'due' : 'plain'}
          title={due ? `${due} mistake${due === 1 ? '' : 's'} to review` : 'No reviews due'}
          description={due ? 'Questions you got wrong before. A few minutes.' : 'Wrong answers come back here after 1, 3 and 7 days.'}
          onPress={() => nav.go('practice', { name: 'mode', mode: 'review' })}
        />
        <Row
          icon="tool"
          title={lastScenario ? `Last build: ${lastScenario.title}` : 'Do a timed build'}
          description={
            lastScenario
              ? `${lastBuild.passed} of ${lastBuild.total} checks passed. Try to beat it.`
              : 'Build a CRUD app in Visual Studio against the checker’s list.'
          }
          onPress={() => nav.go('build', lastScenario ? { name: 'scenario', id: lastScenario.id } : undefined)}
        />
        <Row icon="life-buoy" title="Setup sheet" description="Connection strings and fixes for common errors." onPress={() => nav.go('build', { name: 'setup' })} />
      </List>

      <Section
        title={day.weekTitle}
        action={<Btn small kind="ghost" title="Full plan" onPress={() => nav.push({ name: 'plan' })} />}
      >
        <Card style={{ gap: 2, paddingVertical: space.sm }}>
          {week.map((d) => (
            <Checkbox
              key={d.idx}
              on={done.has(d.idx)}
              onPress={() => toggle(d.idx)}
              label={cap(d.title)}
              sub={d.idx === ti ? `${fmtDate(d.date)}, today` : fmtDate(d.date)}
            />
          ))}
        </Card>
      </Section>
    </Page>
  );
}

// 27 cells, one per study day, plus a flag for the test. Filled = done, ringed = today.
function DayTrack({ done, ti }) {
  const c = useTheme();
  return (
    <View style={st.track} accessible accessibilityLabel={`${done.size} of ${DAYS.length} study days done`}>
      {DAYS.map((d) => {
        const isDone = done.has(d.idx);
        const isToday = d.idx === ti;
        const past = d.idx < ti;
        return (
          <View
            key={d.idx}
            style={[
              st.cell,
              { backgroundColor: isDone ? c.accent : past ? c.dueSoft : c.sunken },
              isToday && { borderWidth: 2, borderColor: c.ink },
              (d.idx + 1) % 7 === 0 && d.idx < DAYS.length - 1 && { marginRight: 4 },
            ]}
          />
        );
      })}
      <View style={[st.flag, { backgroundColor: c.ink }]}>
        <Icon name="flag" size={10} color={c.bg} />
      </View>
    </View>
  );
}

export const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);

const st = StyleSheet.create({
  track: { flexDirection: 'row', gap: 3, alignItems: 'center' },
  cell: { flex: 1, height: 22, borderRadius: 4 },
  flag: { width: 22, height: 22, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', marginLeft: 3 },
});
