import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BUGS, WRITE } from '../drills';
import { lineDiff, langName } from '../code';
import { record } from '../review';
import { mono, radius, space, type, useTheme } from '../theme';
import { Badge, Btn, Callout, Chip, ChipRow, Field, T, s } from '../components/ui';
import { genBugs, genWrites } from '../ai';
import { AiError, AiLoading, AiNote, NeedsKey, SourceSwitch, useAiBatch, useSource } from './AiSource';

/* ---------------- Write from scratch ---------------- */
export function WriteGame({ nav, lang }) {
  const { source, setSource, hasKey } = useSource('write');
  return (
    <View style={{ gap: space.lg }}>
      <SourceSwitch source={source} setSource={setSource} />
      {source === 'ai' ? (
        hasKey ? <AiWrite nav={nav} lang={lang} onBuiltIn={() => setSource('builtin')} /> : <NeedsKey nav={nav} onBuiltIn={() => setSource('builtin')} />
      ) : (
        <BuiltInWrite nav={nav} />
      )}
    </View>
  );
}

function BuiltInWrite({ nav }) {
  const [id, setId] = useState(WRITE[0].id);
  const i = WRITE.findIndex((w) => w.id === id);
  return (
    <View style={{ gap: space.lg }}>
      <ChipRow>
        {WRITE.map((w) => (
          <Chip key={w.id} label={w.title} on={w.id === id} onPress={() => setId(w.id)} />
        ))}
      </ChipRow>
      <WriteCard key={id} item={WRITE[i]} nav={nav} onNext={() => setId(WRITE[(i + 1) % WRITE.length].id)} />
    </View>
  );
}

function AiWrite({ nav, lang, onBuiltIn }) {
  const batch = useAiBatch(genWrites, lang, true);
  if (!batch.item) {
    if (batch.error) return <AiError message={batch.error} onRetry={batch.retry} onBuiltIn={onBuiltIn} />;
    return <AiLoading what="tasks" />;
  }
  return (
    <View style={{ gap: space.md }}>
      <WriteCard key={batch.item.id} item={batch.item} nav={nav} onNext={batch.next} />
      <AiNote />
    </View>
  );
}

export function WriteCard({ item, nav, onResult, onNext }) {
  const c = useTheme();
  const [code, setCode] = useState('');
  const [result, setResult] = useState(null);

  const check = (gaveUp) => {
    const d = lineDiff(item.answer, gaveUp ? '' : code);
    const ok = !gaveUp && d.score >= 0.8;
    setResult({ ...d, gaveUp, ok });
    record((item.kind ? 'gwrite:' : 'write:') + item.id, ok);
    onResult?.(ok);
  };

  return (
    <View style={{ gap: space.lg }}>
      <View style={{ gap: space.sm }}>
        <View style={s.row}>
          <Badge tone="plain">{langName(item.lang)}</Badge>
        </View>
        <T v="h3">{item.title}</T>
        <T v="body">{item.prompt}</T>
      </View>
      <Field
        multiline
        value={code}
        onChangeText={(t) => { setCode(t); if (result) setResult(null); }}
        placeholder="Write it here without looking anything up."
        accessibilityLabel="Your code"
        style={{ minHeight: 220, backgroundColor: c.codeBg }}
      />
      <View style={s.row}>
        <Btn kind="primary" title="Check my code" onPress={() => check(false)} disabled={!code.trim()} />
        <Btn title="Show the answer" onPress={() => check(true)} />
        {!!nav && !!code.trim() && (
          <Btn
            kind="ghost"
            icon="message-circle"
            title="Ask the tutor"
            onPress={() =>
              nav.ask(
                `Review my ${langName(item.lang)} code for this task. Point out mistakes and give hints, but don't rewrite the whole thing for me.\n\nTask: ${item.prompt}\n\nMy code:\n\`\`\`\n${code}\n\`\`\``
              )
            }
          />
        )}
      </View>

      {result && (
        <View style={{ gap: space.md }}>
          {!result.gaveUp && (
            <Callout tone={result.ok ? 'good' : 'bad'} icon={result.ok ? 'check-circle' : 'x-circle'} title={`${Math.round(result.score * 100)}% of the key lines match`}>
              {result.ok ? 'That counts as remembered.' : "It's been added to Review and comes back tomorrow."}
            </Callout>
          )}
          <T v="smallStrong">{result.gaveUp ? 'Answer' : 'Answer: green lines you had, red lines you missed'}</T>
          <ScrollView horizontal style={[st.box, { backgroundColor: c.codeBg, borderColor: c.line }]} contentContainerStyle={{ padding: space.lg }}>
            <View>
              {result.ref.map((r, k) => (
                <Text
                  key={k}
                  style={[
                    type.code,
                    { color: c.ink },
                    !result.gaveUp && r.key && (r.hit ? { color: c.good } : { color: c.bad, backgroundColor: c.badSoft }),
                  ]}
                >
                  {r.text || ' '}
                </Text>
              ))}
            </View>
          </ScrollView>
          {!result.gaveUp && result.extra.length > 0 && (
            <View style={{ gap: space.xs }}>
              <T v="smallStrong">Your lines that aren't in the answer</T>
              <Text style={[type.code, { color: c.muted }]}>{result.extra.join('\n')}</Text>
              <T v="small" color={c.muted}>A different solution that works is fine on the real test.</T>
            </View>
          )}
          {!!onNext && <Btn kind="ghost" title="Next task" onPress={onNext} />}
        </View>
      )}
    </View>
  );
}

/* ---------------- Bug hunt ---------------- */
export function BugGame({ nav, lang }) {
  const { source, setSource, hasKey } = useSource('bug');
  return (
    <View style={{ gap: space.lg }}>
      <SourceSwitch source={source} setSource={setSource} />
      {source === 'ai' ? (
        hasKey ? <AiBugs lang={lang} onBuiltIn={() => setSource('builtin')} /> : <NeedsKey nav={nav} onBuiltIn={() => setSource('builtin')} />
      ) : (
        <BuiltInBugs />
      )}
    </View>
  );
}

function BuiltInBugs() {
  const [i, setI] = useState(0);
  return <BugCard key={i} bug={BUGS[i]} onNext={() => setI((i + 1) % BUGS.length)} counter={`Bug ${i + 1} of ${BUGS.length}`} />;
}

function AiBugs({ lang, onBuiltIn }) {
  const batch = useAiBatch(genBugs, lang, true);
  if (!batch.item) {
    if (batch.error) return <AiError message={batch.error} onRetry={batch.retry} onBuiltIn={onBuiltIn} />;
    return <AiLoading what="bugs" />;
  }
  return (
    <View style={{ gap: space.md }}>
      <BugCard key={batch.item.id} bug={batch.item} onNext={batch.next} counter={`New bug ${batch.index + 1}`} />
      <AiNote />
    </View>
  );
}

export function BugCard({ bug, onResult, onNext, counter }) {
  const c = useTheme();
  const [pick, setPick] = useState(null);
  const lines = useMemo(() => bug.code.split('\n'), [bug]);
  const choose = (k) => {
    if (pick != null) return;
    setPick(k);
    const ok = k === bug.bad;
    record((bug.kind ? 'gbug:' : 'bug:') + bug.id, ok);
    onResult?.(ok);
  };
  return (
    <View style={{ gap: space.lg }}>
      <View style={s.between}>
        <Badge tone="plain">{langName(bug.lang)}</Badge>
        {!!counter && <T v="caption">{counter}</T>}
      </View>
      <View style={{ gap: 2 }}>
        <T v="h3">{bug.title}</T>
        <T v="body" color={c.muted}>Tap the line with the bug.</T>
      </View>
      <ScrollView horizontal style={[st.box, { backgroundColor: c.codeBg, borderColor: c.line }]} contentContainerStyle={{ paddingVertical: space.sm }}>
        <View>
          {lines.map((ln, k) => {
            const isBad = pick != null && k === bug.bad;
            const isWrongPick = pick === k && k !== bug.bad;
            return (
              <Pressable
                key={k}
                onPress={() => choose(k)}
                accessibilityRole="button"
                accessibilityLabel={`Line ${k + 1}: ${ln.trim()}`}
                style={({ pressed }) => [
                  st.line,
                  pressed && pick == null && { backgroundColor: c.accentSoft },
                  isBad && { backgroundColor: c.goodSoft },
                  isWrongPick && { backgroundColor: c.badSoft },
                ]}
              >
                <Text style={[type.code, { color: c.faint, width: 22, textAlign: 'right' }]}>{k + 1}</Text>
                <Text style={[type.code, { color: c.ink }]}>{ln || ' '}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
      {pick != null && (
        <Callout tone={pick === bug.bad ? 'good' : 'bad'} title={pick === bug.bad ? 'Found it' : `It's line ${bug.bad + 1}, not line ${pick + 1}`}>
          <View style={{ gap: space.sm }}>
            <T v="body" color={c.ink}>{bug.why}</T>
            <Text style={{ fontFamily: mono, fontSize: 13, lineHeight: 20, color: c.ink }}>Fix: {bug.fix}</Text>
          </View>
        </Callout>
      )}
      {!!onNext && pick != null && <Btn kind="primary" title="Next bug" onPress={onNext} />}
    </View>
  );
}

const st = StyleSheet.create({
  box: { borderWidth: 1, borderRadius: radius.md, flexGrow: 0 },
  line: { flexDirection: 'row', gap: space.md, paddingHorizontal: space.md, paddingVertical: 4 },
});
