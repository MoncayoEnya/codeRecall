import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { CONCEPTS, LANGS } from '../data';
import { codeOf, langName, langOf } from '../code';
import { useTheme } from '../theme';
import { Btn, Card, Chip, CodeBlock, Eyebrow, s } from '../components/ui';

const GROUPS = ['All', ...new Set(CONCEPTS.map((c) => c.group))];

export default function ConceptsScreen({ lang, go, params }) {
  const c = useTheme();
  const [filter, setFilter] = useState('All');
  const scroller = useRef(null);
  const ys = useRef({});

  // Jump to a card when the Plan screen opens one.
  useEffect(() => {
    if (!params?.open) return;
    setFilter('All');
    const t = setTimeout(() => {
      const y = ys.current[params.open];
      if (y != null) scroller.current?.scrollTo({ y: y - 8, animated: true });
    }, 250);
    return () => clearTimeout(t);
  }, [params]);

  const shown = CONCEPTS.filter((x) => filter === 'All' || x.group === filter);

  return (
    <ScrollView ref={scroller} contentContainerStyle={st.pad}>
      <Text style={[st.lede, { color: c.muted }]}>
        Each card says <Text style={{ color: c.ink, fontWeight: '700' }}>when to use it</Text>, the mistake people make, and
        the code in {LANGS[lang]}. Switch language at the top to compare.
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
        {GROUPS.map((g) => (
          <Chip key={g} label={g} on={g === filter} onPress={() => setFilter(g)} />
        ))}
      </ScrollView>

      {shown.map((x) => {
        const l = langOf(x, lang);
        return (
          <View key={x.id} onLayout={(e) => (ys.current[x.id] = e.nativeEvent.layout.y)}>
            <Card>
              <View>
                <Eyebrow>{x.group}</Eyebrow>
                <Text style={[st.title, { color: c.ink }]}>{x.title}</Text>
              </View>
              <View style={[st.note, { borderLeftColor: c.good }]}>
                <Eyebrow>Use it when</Eyebrow>
                <Text style={{ color: c.ink, fontSize: 15, lineHeight: 21 }}>{x.use}</Text>
              </View>
              <View style={[st.note, { borderLeftColor: c.bad }]}>
                <Eyebrow>Watch out</Eyebrow>
                <Text style={{ color: c.ink, fontSize: 15, lineHeight: 21 }}>{x.warn}</Text>
              </View>
              <CodeBlock code={codeOf(x, lang)} lang={l} />
              {x.code.sql ? (
                <Text style={{ color: c.muted, fontSize: 13 }}>SQL is the same no matter which language you picked.</Text>
              ) : l !== lang ? (
                <Text style={{ color: c.muted, fontSize: 13 }}>No {LANGS[lang]} version for this one, so it's shown in C#.</Text>
              ) : null}
              <View style={s.row}>
                <Btn small kind="primary" title="Type it" onPress={() => go('practice', { mode: 'type', id: x.id })} />
                <Btn small title="Fill the blanks" onPress={() => go('practice', { mode: 'blank', id: x.id })} />
                <Btn
                  small
                  kind="ghost"
                  title="Ask tutor"
                  onPress={() =>
                    go('tutor', {
                      prompt: `Teach me "${x.title}" in ${langName(l)} like I'm reviewing for a skills test: when to use it, one tiny example, one common mistake. Then give me ONE small exercise and wait for my answer.`,
                    })
                  }
                />
              </View>
            </Card>
          </View>
        );
      })}
    </ScrollView>
  );
}

const st = StyleSheet.create({
  pad: { padding: 16, gap: 16, paddingBottom: 40 },
  lede: { fontSize: 15, lineHeight: 22 },
  title: { fontSize: 22, fontWeight: '800', marginTop: 2 },
  note: { borderLeftWidth: 4, paddingLeft: 10, gap: 2 },
});
