import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { getApiKey, load, onKeyChange, save } from '../storage';
import { space, useTheme } from '../theme';
import { Btn, Callout, Card, Icon, Segmented, T, s } from '../components/ui';

// Remembers the last choice per drill ("predict", "bug", "write").
export function useSource(drill) {
  const [source, setSourceState] = useState('builtin');
  const [hasKey, setHasKey] = useState(false);
  useEffect(() => {
    getApiKey().then((k) => {
      setHasKey(!!k);
      load('source:' + drill, k ? 'ai' : 'builtin').then((v) => setSourceState(k ? v : 'builtin'));
    });
    return onKeyChange((k) => setHasKey(!!k));
  }, [drill]);
  const setSource = (v) => {
    setSourceState(v);
    save('source:' + drill, v);
  };
  return { source, setSource, hasKey };
}

export function SourceSwitch({ source, setSource }) {
  return (
    <Segmented
      full
      value={source}
      onChange={setSource}
      options={[
        { value: 'ai', label: 'New from AI' },
        { value: 'builtin', label: 'Built-in set' },
      ]}
    />
  );
}

// Fetches AI-made items in batches and keeps a cursor through them.
export function useAiBatch(gen, lang, active) {
  const [items, setItems] = useState([]);
  const [i, setI] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const busy = useRef(false);

  const fetchMore = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    setError('');
    try {
      const batch = await gen(lang);
      setItems((prev) => [...prev, ...batch]);
    } catch (e) {
      setError(e.message || 'Something went wrong. Try again.');
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }, [gen, lang]);

  useEffect(() => {
    if (active && i >= items.length && !loading && !error) fetchMore();
  }, [active, i, items.length]);

  // Changing language starts a fresh batch in that language.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    setItems([]);
    setI(0);
    setError('');
  }, [lang]);

  return {
    item: items[i],
    index: i,
    total: items.length,
    loading,
    error,
    next: () => setI((n) => n + 1),
    retry: fetchMore,
  };
}

export function AiLoading({ what }) {
  const c = useTheme();
  return (
    <Card style={{ alignItems: 'center', paddingVertical: space.xxl, gap: space.md }}>
      <ActivityIndicator color={c.accent} />
      <T v="bodyStrong">Writing new {what} for you</T>
      <T v="small" color={c.muted} style={{ textAlign: 'center' }}>Aimed at today's topic and the things you've been getting wrong. This takes a few seconds.</T>
    </Card>
  );
}

export function AiError({ message, onRetry, onBuiltIn }) {
  return (
    <View style={{ gap: space.md }}>
      <Callout tone="bad" icon="alert-circle" title="Couldn't make new ones">{message}</Callout>
      <View style={s.row}>
        <Btn kind="primary" icon="refresh-cw" title="Try again" onPress={onRetry} />
        <Btn title="Use the built-in set" onPress={onBuiltIn} />
      </View>
    </View>
  );
}

export function NeedsKey({ nav, onBuiltIn }) {
  return (
    <View style={{ gap: space.md }}>
      <Callout icon="key" title="Add your API key to get new ones">
        AI-made questions use the same Anthropic key as the tutor. Until then, the built-in set works offline.
      </Callout>
      <View style={s.row}>
        <Btn kind="primary" title="Open Settings" onPress={() => nav.go('today', { name: 'settings' })} />
        <Btn title="Use the built-in set" onPress={onBuiltIn} />
      </View>
    </View>
  );
}

export function AiNote() {
  const c = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
      <Icon name="zap" size={13} color={c.muted} />
      <T v="caption">Made by AI for you. If an answer looks wrong, ask the tutor.</T>
    </View>
  );
}
