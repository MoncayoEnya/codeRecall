import { View } from 'react-native';
import { PLAN } from '../data';
import { DAYS, fmtDate, startTarget, todayIndex, useDone } from '../plan';
import { space, useTheme } from '../theme';
import { Badge, Btn, Checkbox, Header, Page, Section, T, Card } from '../components/ui';
import { cap } from './TodayScreen';

export default function PlanScreen({ nav }) {
  const c = useTheme();
  const [done, toggle] = useDone();
  const ti = todayIndex();
  return (
    <Page gap={space.xl}>
      <Header
        onBack={nav.pop}
        title="Study plan"
        subtitle="27 days, one task a day, building up to a full CRUD app. Tick a day when you finish it."
      />
      {PLAN.map((w, wi) => {
        const days = DAYS.filter((d) => d.week === wi);
        const n = days.filter((d) => done.has(d.idx)).length;
        return (
          <Section key={w.w} title={w.w} action={<T v="small" color={c.muted}>{n} of {days.length}</T>}>
            <Card style={{ gap: space.md }}>
              {days.map((d) => (
                <View key={d.idx} style={{ gap: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space.sm }}>
                    <View style={{ flex: 1 }}>
                      <Checkbox on={done.has(d.idx)} onPress={() => toggle(d.idx)} label={cap(d.title)} sub={d.task} />
                    </View>
                    {d.idx === ti && <Badge>Today</Badge>}
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginLeft: 34 }}>
                    <T v="caption" color={c.faint}>{fmtDate(d.date)}</T>
                    <Btn small kind="ghost" title="Start" onPress={() => { const t = startTarget(d); nav.go(t.tab, t.route); }} />
                  </View>
                </View>
              ))}
            </Card>
          </Section>
        );
      })}
      <Card tone="accent">
        <T v="h3">Tuesday, November 10: skills test</T>
        <T v="body" color={c.ink}>Eat breakfast. Start the database before anything else. Read each problem twice. Get the simple version working first, then improve it.</T>
      </Card>
    </Page>
  );
}
