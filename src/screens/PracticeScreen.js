import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { CONCEPTS, QUIZ, byId } from '../data';
import { BUGS, WRITE } from '../drills';
import { cleanCode, codeOf, langOf, pickBlanks, shuffle } from '../code';
import { dueKeys, getReview, onReviewChange, record } from '../review';
import { load, save } from '../storage';
import { mono, radius, space, type, useTheme } from '../theme';
import { Badge, Btn, Callout, Card, Chip, ChipRow, CodeBlock, Header, List, Page, Row, Segmented, T, s } from '../components/ui';
import { BugCard, BugGame, WriteCard, WriteGame } from './DrillGames';
import { Coach } from '../components/ExplainCode';
import { AiError, AiLoading, AiNote, NeedsKey, SourceSwitch, useAiBatch, useSource } from './AiSource';
import { genQuestions, getAllGenerated } from '../ai';
import { LangSwitch } from './LearnScreen';
import { cap } from './TodayScreen';

export const MODES = {
  type: { title: 'Type it', icon: 'type', desc: 'Copy real code by typing it, then try it from memory.' },
  blank: { title: 'Fill the blanks', icon: 'edit-3', desc: 'Keywords are missing from working code. Put them back.' },
  predict: { title: 'Predict the output', icon: 'help-circle', desc: 'Read a snippet and choose what it prints.' },
  write: { title: 'Write from scratch', icon: 'file-text', desc: 'A blank page and a task. Then see which lines you missed.' },
  bug: { title: 'Bug hunt', icon: 'crosshair', desc: 'One line is broken. Find it before the checker does.' },
  review: { title: 'Review mistakes', icon: 'rotate-ccw', desc: 'Things you got wrong come back after 1, 3 and 7 days.' },
};

function useDue() {
  const [due, setDue] = useState(0);
  useEffect(() => {
    getReview().then((m) => setDue(dueKeys(m).length));
    return onReviewChange((m) => setDue(dueKeys(m).length));
  }, []);
  return due;
}

/* ---------------- Hub ---------------- */
export default function PracticeHub({ nav }) {
  const c = useTheme();
  const due = useDue();
  const open = (mode) => nav.push({ name: 'mode', mode });
  return (
    <Page gap={space.xl}>
      <Header title="Practice" subtitle="Short drills that make you produce code, not just read it. Drills marked AI can make new questions every time." />

      {due > 0 && (
        <Card tone="due" onPress={() => open('review')} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }} accessibilityLabel={`Review ${due} mistakes`}>
          <View style={{ flex: 1, gap: 2 }}>
            <T v="h3">{due} mistake{due === 1 ? '' : 's'} to review today</T>
            <T v="small" color={c.body}>Do these first. They're the things you're most likely to forget.</T>
          </View>
          <Btn kind="primary" small title="Review" onPress={() => open('review')} />
        </Card>
      )}

      <List>
        {['type', 'blank', 'predict'].map((m) => (
          <Row key={m} icon={MODES[m].icon} title={MODES[m].title} description={MODES[m].desc} onPress={() => open(m)}
            trailing={m === 'predict' ? <Badge>AI</Badge> : null} />
        ))}
      </List>
      <List>
        {['write', 'bug'].map((m) => (
          <Row key={m} icon={MODES[m].icon} title={MODES[m].title} description={MODES[m].desc} onPress={() => open(m)}
            trailing={<Badge>AI</Badge>} />
        ))}
        <Row icon="rotate-ccw" iconTone={due ? 'due' : 'plain'} title={MODES.review.title} description={MODES.review.desc} onPress={() => open('review')}
          trailing={due ? <Badge tone="due">{due} due</Badge> : null} />
      </List>
    </Page>
  );
}

/* ---------------- A single mode ---------------- */
export function PracticeMode({ nav, mode, id, lang, setLang }) {
  const [cid, setCid] = useState(id || 'crudlist');
  const m = MODES[mode];
  const next = () => {
    const i = CONCEPTS.findIndex((x) => x.id === cid);
    setCid(CONCEPTS[(i + 1) % CONCEPTS.length].id);
  };
  const needsTopic = mode === 'type' || mode === 'blank';
  return (
    <Page gap={space.lg}>
      <Header onBack={nav.pop} title={m.title} subtitle={m.desc} large={false} />
      {needsTopic && (
        <View style={{ gap: space.md }}>
          <ChipRow>
            {CONCEPTS.map((x) => (
              <Chip key={x.id} label={cap(x.title)} on={x.id === cid} onPress={() => setCid(x.id)} />
            ))}
          </ChipRow>
          {!byId[cid].code.sql && <LangSwitch lang={lang} setLang={setLang} />}
        </View>
      )}
      {mode === 'type' && <TypeGame concept={byId[cid]} lang={lang} onNext={next} />}
      {mode === 'blank' && <BlankGame key={cid + lang} concept={byId[cid]} lang={lang} />}
      {mode === 'predict' && <PredictGame nav={nav} lang={lang} />}
      {mode === 'write' && <WriteGame nav={nav} lang={lang} />}
      {mode === 'bug' && <BugGame nav={nav} lang={lang} />}
      {mode === 'review' && <ReviewQueue lang={lang} nav={nav} />}
    </Page>
  );
}

/* ---------------- Type it / from memory ---------------- */
function TypeGame({ concept, lang, onNext }) {
  const c = useTheme();
  const l = langOf(concept, lang);
  const target = useMemo(() => cleanCode(codeOf(concept, lang), l), [concept, lang, l]);
  const key = concept.id + ':' + l;
  const input = useRef(null);
  const stats = useRef({ errors: 0, keys: 0, t0: 0 });
  const [typed, setTyped] = useState('');
  const [tmode, setTmode] = useState('copy');
  const [peeking, setPeeking] = useState(false);
  const [peeks, setPeeks] = useState(0);
  const [best, setBest] = useState(null);
  const [result, setResult] = useState(null);
  const [focused, setFocused] = useState(false);
  const [coach, setCoach] = useState(true);
  const [, tick] = useState(0);

  const reset = () => {
    stats.current = { errors: 0, keys: 0, t0: 0 };
    setTyped('');
    setPeeks(0);
    setResult(null);
  };
  useEffect(() => {
    reset();
    load('best', {}).then((b) => setBest(b[key] ?? null));
  }, [key, tmode]);
  useEffect(() => {
    if (!typed || result) return;
    const t = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [typed, result]);

  let correct = 0;
  for (let i = 0; i < typed.length; i++) if (typed[i] === target[i]) correct++;
  const mins = stats.current.t0 ? (Date.now() - stats.current.t0) / 60000 : 0;
  const wpm = mins > 0.02 ? Math.round(correct / 5 / mins) : 0;
  const acc = stats.current.keys ? Math.max(0, Math.round((1 - stats.current.errors / stats.current.keys) * 100)) : 100;
  const pct = Math.round((correct / target.length) * 100);

  const onChange = (raw) => {
    if (result) return;
    let v = raw.replace(/\r/g, '').replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/—/g, '--');
    if (v.length > target.length) v = v.slice(0, target.length);
    if (!stats.current.t0 && v.length) stats.current.t0 = Date.now();
    if (v.length > typed.length) {
      for (let i = typed.length; i < v.length; i++) {
        stats.current.keys++;
        if (v[i] !== target[i]) stats.current.errors++;
      }
      if (v[v.length - 1] === '\n' && target[v.length - 1] === '\n') {
        while (v.length < target.length && target[v.length] === ' ') v += ' ';
      }
    }
    setTyped(v);
    if (v === target) finish(v);
  };
  const onKey = (e) => {
    if (e.nativeEvent.key === 'Tab') {
      e.preventDefault?.();
      let v = typed;
      while (v.length < target.length && target[v.length] === ' ') v += ' ';
      onChange(v);
    }
  };

  const finish = async (v) => {
    let ok = 0;
    for (let i = 0; i < v.length; i++) if (v[i] === target[i]) ok++;
    const w = Math.round(ok / 5 / Math.max((Date.now() - stats.current.t0) / 60000, 0.01));
    const all = await load('best', {});
    const isBest = !all[key] || w > all[key];
    if (isBest) {
      all[key] = w;
      save('best', all);
      setBest(w);
    }
    setResult({ wpm: w, isBest });
  };

  const peek = () => {
    if (peeking) return;
    setPeeking(true);
    setPeeks((p) => p + 1);
    setTimeout(() => {
      setPeeking(false);
      input.current?.focus();
    }, 3000);
  };

  const runs = [];
  for (let i = 0; i <= target.length; i++) {
    const ch = i < target.length ? target[i] : ' ';
    let state = 'pending';
    if (i < typed.length) state = typed[i] === ch ? 'ok' : 'no';
    else if (tmode === 'memory' && !peeking) state = 'hide';
    const cur = i === typed.length;
    if (i === target.length && !cur) break;
    let text = ch;
    if (state === 'no' && ch === '\n') text = '↵\n';
    else if (state === 'no' && ch === ' ') text = '·';
    else if (cur && ch === '\n') text = ' \n';
    const look = state + (cur ? '_cur' : '');
    const prev = runs[runs.length - 1];
    if (prev && prev.look === look) prev.text += text;
    else runs.push({ look, text });
  }
  const styleFor = (look) => {
    const [state, cur] = look.split('_');
    const base = { ok: { color: c.ink }, no: { color: c.bad, backgroundColor: c.badSoft }, pending: { color: c.faint }, hide: { color: 'transparent' } }[state];
    return cur ? [base, { backgroundColor: c.accentSoft, color: state === 'hide' ? 'transparent' : c.accent }] : base;
  };

  return (
    <View style={{ gap: space.lg }}>
      <Segmented
        full
        value={tmode}
        onChange={setTmode}
        options={[
          { value: 'copy', label: 'Copy' },
          { value: 'memory', label: 'From memory' },
        ]}
      />
      <View style={st.stats}>
        <Stat n={wpm} label="WPM" />
        <Stat n={acc + '%'} label="Accuracy" />
        <Stat n={best ?? '–'} label="Best WPM" />
        {tmode === 'memory' && <Stat n={peeks} label="Peeks" />}
      </View>
      <View style={[st.progress, { backgroundColor: c.sunken }]}>
        <View style={{ width: `${pct}%`, height: '100%', backgroundColor: c.accent, borderRadius: 99 }} />
      </View>

      <Pressable onPress={() => input.current?.focus()} accessibilityLabel="Code to type. Tap to start typing.">
        <ScrollView horizontal style={[st.codeBox, { backgroundColor: c.codeBg, borderColor: focused ? c.accent : c.line }]} contentContainerStyle={{ padding: space.lg }}>
          <Text style={{ fontFamily: mono, fontSize: 14, lineHeight: 23 }}>
            {runs.map((r, i) => (
              <Text key={i} style={styleFor(r.look)}>{r.text}</Text>
            ))}
          </Text>
        </ScrollView>
      </Pressable>
      <TextInput
        ref={input}
        value={typed}
        onChangeText={onChange}
        onKeyPress={onKey}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        multiline
        autoCorrect={false}
        autoCapitalize="none"
        autoComplete="off"
        spellCheck={false}
        caretHidden
        style={st.hiddenInput}
        accessibilityLabel="Type the code here"
      />

      {coach && !result && (
        <Coach
          line={target.split('\n')[typed.split('\n').length - 1]}
          lineNo={typed.split('\n').length}
          hideCode={tmode === 'memory' && !peeking}
        />
      )}

      {result ? (
        <Callout tone="good" icon="award" title={result.isBest ? 'New best' : 'Finished'}>
          {`${result.wpm} WPM with ${acc}% accuracy${tmode === 'memory' ? ` and ${peeks} peek${peeks === 1 ? '' : 's'}` : ''}. ${tmode === 'copy' ? 'Now try it from memory.' : ''}`}
        </Callout>
      ) : (
        <T v="small" color={c.muted}>
          {focused
            ? tmode === 'memory'
              ? 'Type it from memory. Stuck? Peek for 3 seconds.'
              : 'Indentation fills in after Enter. Red means wrong: backspace and fix it.'
            : 'Tap the code to start typing.'}
        </T>
      )}

      <View style={s.row}>
        {tmode === 'memory' && <Btn icon="eye" title="Peek" onPress={peek} disabled={peeking || !!result} />}
        <Btn icon="refresh-cw" title="Restart" onPress={() => { reset(); input.current?.focus(); }} />
        <Btn kind="ghost" title="Next topic" onPress={onNext} />
        <Btn kind="ghost" icon="cpu" title={coach ? 'Hide coach' : 'Show coach'} onPress={() => setCoach((v) => !v)} />
      </View>
    </View>
  );
}

function Stat({ n, label }) {
  const c = useTheme();
  return (
    <View style={{ minWidth: 64 }}>
      <Text style={[type.title, { color: c.ink, fontVariant: ['tabular-nums'] }]}>{n}</Text>
      <T v="caption">{label}</T>
    </View>
  );
}

/* ---------------- Fill the blanks ---------------- */
export function BlankGame({ concept, lang, onResult }) {
  const c = useTheme();
  const l = langOf(concept, lang);
  const code = useMemo(() => cleanCode(codeOf(concept, lang), l), [concept, lang, l]);
  const [seed, setSeed] = useState(0);
  const blanks = useMemo(() => pickBlanks(code), [code, seed]);
  const [answers, setAnswers] = useState([]);
  const [checked, setChecked] = useState(false);
  useEffect(() => {
    setAnswers(blanks.map(() => ''));
    setChecked(false);
  }, [blanks]);

  const lines = useMemo(() => {
    const out = [[]];
    let pos = 0;
    const pushText = (t) =>
      t.split('\n').forEach((piece, j) => {
        if (j > 0) out.push([]);
        if (piece) out[out.length - 1].push({ text: piece });
      });
    blanks.forEach((b, k) => {
      pushText(code.slice(pos, b.i));
      out[out.length - 1].push({ blank: k, w: b.w });
      pos = b.i + b.w.length;
    });
    pushText(code.slice(pos));
    return out;
  }, [code, blanks]);

  const score = blanks.filter((b, k) => (answers[k] || '').trim() === b.w).length;
  const check = () => {
    setChecked(true);
    const ok = score === blanks.length;
    record(`blank:${concept.id}:${l}`, ok);
    onResult?.(ok);
  };

  return (
    <View style={{ gap: space.lg }}>
      <ScrollView horizontal style={[st.codeBox, { backgroundColor: c.codeBg, borderColor: c.line }]} contentContainerStyle={{ padding: space.lg }}>
        <View>
          {lines.map((parts, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', minHeight: 26 }}>
              {parts.map((p, j) =>
                p.blank != null ? (
                  <TextInput
                    key={j}
                    value={answers[p.blank] || ''}
                    onChangeText={(t) => {
                      const a = answers.slice();
                      a[p.blank] = t;
                      setAnswers(a);
                      setChecked(false);
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="off"
                    spellCheck={false}
                    accessibilityLabel={`Blank ${p.blank + 1}`}
                    style={[
                      st.blank,
                      { width: (Math.max(p.w.length, 3) + 2) * 8.6, color: c.ink, borderColor: c.accent, backgroundColor: c.surface },
                      checked && (answers[p.blank] || '').trim() === p.w && { borderColor: c.good, backgroundColor: c.goodSoft },
                      checked && (answers[p.blank] || '').trim() !== p.w && { borderColor: c.bad, backgroundColor: c.badSoft },
                    ]}
                  />
                ) : (
                  <Text key={j} style={[type.code, { color: c.ink }]}>{p.text}</Text>
                )
              )}
            </View>
          ))}
        </View>
      </ScrollView>
      {checked && (
        <Callout tone={score === blanks.length ? 'good' : 'bad'} icon={score === blanks.length ? 'check-circle' : 'x-circle'}>
          {score === blanks.length ? `All ${blanks.length} correct. Try new blanks.` : `${score} of ${blanks.length} correct. Red ones are wrong; case matters.`}
        </Callout>
      )}
      <View style={s.row}>
        <Btn kind="primary" title="Check answers" onPress={check} />
        <Btn title="Show answers" onPress={() => { setAnswers(blanks.map((b) => b.w)); setChecked(false); }} />
        <Btn kind="ghost" icon="shuffle" title="New blanks" onPress={() => setSeed((n) => n + 1)} />
      </View>
    </View>
  );
}

/* ---------------- Predict the output ---------------- */
const LK = { 'C#': 'cs', Python: 'py', Java: 'java', 'C++': 'cpp', JavaScript: 'js', SQL: 'sql' };
function PredictGame({ nav, lang }) {
  const { source, setSource, hasKey } = useSource('predict');
  return (
    <View style={{ gap: space.lg }}>
      <SourceSwitch source={source} setSource={setSource} />
      {source === 'ai' ? (
        hasKey ? <AiPredict nav={nav} lang={lang} onBuiltIn={() => setSource('builtin')} /> : <NeedsKey nav={nav} onBuiltIn={() => setSource('builtin')} />
      ) : (
        <BuiltInPredict />
      )}
    </View>
  );
}

function BuiltInPredict() {
  const [order, setOrder] = useState(() => shuffle(QUIZ.map((_, i) => i)));
  const [qi, setQi] = useState(0);
  const [right, setRight] = useState(0);
  const [seen, setSeen] = useState(0);
  const next = () => {
    if (qi + 1 >= order.length) {
      setOrder(shuffle(QUIZ.map((_, i) => i)));
      setQi(0);
    } else setQi(qi + 1);
  };
  return (
    <QuestionCard
      key={`${order[qi]}-${qi}`}
      q={QUIZ[order[qi]]}
      rkey={'quiz:' + order[qi]}
      progress={`Question ${qi + 1} of ${order.length}${seen ? `, ${right} right so far` : ''}`}
      onResult={(ok) => { setSeen((n) => n + 1); if (ok) setRight((n) => n + 1); }}
      onNext={next}
    />
  );
}

function AiPredict({ lang, onBuiltIn }) {
  const batch = useAiBatch(genQuestions, lang, true);
  const [right, setRight] = useState(0);
  const [seen, setSeen] = useState(0);
  if (!batch.item) {
    if (batch.error) return <AiError message={batch.error} onRetry={batch.retry} onBuiltIn={onBuiltIn} />;
    return <AiLoading what="questions" />;
  }
  return (
    <View style={{ gap: space.md }}>
      <QuestionCard
        key={batch.item.id}
        q={batch.item}
        rkey={'gquiz:' + batch.item.id}
        progress={`New question ${batch.index + 1}${seen ? `, ${right} of ${seen} right` : ''}`}
        onResult={(ok) => { setSeen((n) => n + 1); if (ok) setRight((n) => n + 1); }}
        onNext={batch.next}
      />
      <AiNote />
    </View>
  );
}

function QuestionCard({ q, rkey, progress, onResult, onNext }) {
  const c = useTheme();
  const [pick, setPick] = useState(null);
  const opts = useMemo(() => shuffle(q.opts.map((_, i) => i)), [q]);
  const choose = (i) => {
    if (pick != null) return;
    setPick(i);
    record(rkey, i === q.a);
    onResult?.(i === q.a);
  };
  return (
    <View style={{ gap: space.lg }}>
      <View style={s.between}>
        <Badge tone="plain">{q.l}</Badge>
        {!!progress && <T v="caption">{progress}</T>}
      </View>
      <T v="h3">{q.q}</T>
      <CodeBlock code={q.code} lang={LK[q.l] || 'cs'} />
      <View style={{ gap: space.sm }}>
        {opts.map((i) => {
          const isRight = pick != null && i === q.a;
          const isWrong = pick === i && i !== q.a;
          return (
            <Pressable
              key={i}
              onPress={() => choose(i)}
              accessibilityRole="button"
              style={({ pressed }) => [
                st.opt,
                { borderColor: c.line, backgroundColor: pressed && pick == null ? c.sunken : c.surface },
                isRight && { borderColor: c.good, backgroundColor: c.goodSoft },
                isWrong && { borderColor: c.bad, backgroundColor: c.badSoft },
              ]}
            >
              <Text style={[type.code, { color: c.ink, flex: 1 }]}>{q.opts[i]}</Text>
              {isRight && <T v="smallStrong" color={c.good}>Correct</T>}
              {isWrong && <T v="smallStrong" color={c.bad}>Your answer</T>}
            </Pressable>
          );
        })}
      </View>
      {pick != null && <Callout tone={pick === q.a ? 'good' : 'bad'} title={pick === q.a ? 'Right' : 'Not quite'}>{q.why}</Callout>}
      {!!onNext && pick != null && <Btn kind="primary" title="Next question" onPress={onNext} />}
    </View>
  );
}

/* ---------------- Review ---------------- */
// Built-in items are looked up by id; AI-made ones ("g" keys) come from what was saved on the device.
function resolve(key, gen) {
  const [t, a, b] = key.split(':');
  if (t === 'quiz') return QUIZ[+a] ? { type: 'quiz', item: QUIZ[+a] } : null;
  if (t === 'bug') { const x = BUGS.find((y) => y.id === a); return x ? { type: 'bug', item: x } : null; }
  if (t === 'write') { const x = WRITE.find((y) => y.id === a); return x ? { type: 'write', item: x } : null; }
  if (t === 'blank') return byId[a] ? { type: 'blank', item: byId[a], lang: b } : null;
  if (t === 'gquiz' && gen[a]) return { type: 'quiz', item: gen[a] };
  if (t === 'gbug' && gen[a]) return { type: 'bug', item: gen[a] };
  if (t === 'gwrite' && gen[a]) return { type: 'write', item: gen[a] };
  return null;
}

function ReviewQueue({ lang, nav }) {
  const c = useTheme();
  const [keys, setKeys] = useState(null);
  const [gen, setGen] = useState({});
  const [answered, setAnswered] = useState(false);
  const [doneCount, setDoneCount] = useState(0);
  const [tracked, setTracked] = useState(0);
  const refresh = async () => {
    const [m, g] = await Promise.all([getReview(), getAllGenerated()]);
    setGen(g);
    setKeys(dueKeys(m).filter((k) => resolve(k, g)));
    setTracked(Object.keys(m).length);
    setAnswered(false);
  };
  useEffect(() => { refresh(); }, []);
  if (!keys) return null;

  const key = keys[0];
  if (!key) {
    return (
      <Card style={{ alignItems: 'flex-start', gap: space.sm }}>
        <T v="h3">{doneCount ? `All caught up. You reviewed ${doneCount} today.` : 'Nothing to review today'}</T>
        <T v="body">
          When you get something wrong in any drill, built-in or AI-made, it lands here and comes back after 1 day, then 3, then 7. Get it
          right all three times and it's retired.{tracked ? ` ${tracked} item${tracked === 1 ? ' is' : 's are'} waiting for a later day.` : ''}
        </T>
        <Btn kind="ghost" title="Back to Practice" onPress={nav.pop} />
      </Card>
    );
  }

  const r = resolve(key, gen);
  const onResult = () => setAnswered(true);
  let card = null;
  if (r.type === 'quiz') card = <QuestionCard key={key} q={r.item} rkey={key} onResult={onResult} />;
  else if (r.type === 'bug') card = <BugCard key={key} bug={r.item} onResult={onResult} />;
  else if (r.type === 'write') card = <WriteCard key={key} item={r.item} nav={nav} onResult={onResult} />;
  else if (r.type === 'blank') card = (
    <View key={key} style={{ gap: space.sm }}>
      <T v="h3">Fill the blanks: {cap(r.item.title)}</T>
      <BlankGame concept={r.item} lang={r.lang || lang} onResult={onResult} />
    </View>
  );

  return (
    <View style={{ gap: space.lg }}>
      <View style={[st.progress, { backgroundColor: c.sunken }]}>
        <View style={{ width: `${(doneCount / (doneCount + keys.length)) * 100}%`, height: '100%', backgroundColor: c.due, borderRadius: 99 }} />
      </View>
      <T v="caption">{keys.length} left today</T>
      {card}
      {answered && (
        <Btn kind="primary" full title={keys.length > 1 ? 'Next' : 'Finish review'} onPress={() => { setDoneCount((n) => n + 1); refresh(); }} />
      )}
    </View>
  );
}

const st = StyleSheet.create({
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xl },
  progress: { height: 6, borderRadius: 99, overflow: 'hidden' },
  codeBox: { borderWidth: 1, borderRadius: radius.md, flexGrow: 0, minHeight: 140 },
  hiddenInput: { position: 'absolute', width: 1, height: 1, opacity: 0, left: 0, top: 0 },
  blank: { fontFamily: mono, fontSize: 13.5, borderWidth: 1.5, paddingVertical: 0, paddingHorizontal: 4, height: 24, borderRadius: 6, textAlign: 'center' },
  opt: { flexDirection: 'row', alignItems: 'center', gap: space.md, borderWidth: 1, borderRadius: radius.md, paddingVertical: 14, paddingHorizontal: space.lg },
});
