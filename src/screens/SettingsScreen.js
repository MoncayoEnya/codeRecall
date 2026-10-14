import { useEffect, useState } from 'react';
import { Linking, View } from 'react-native';
import { LANGS } from '../data';
import { remindersSupported, scheduleReminders } from '../reminders';
import { getApiKey, load, onKeyChange, removeApiKey, save, setApiKey } from '../storage';
import { mono, space, useTheme, useThemeMode } from '../theme';
import { Btn, Card, Chip, Field, Header, Page, Section, Segmented, T, s } from '../components/ui';

export const MODELS = [
  { value: 'claude-haiku-5-5', label: 'Haiku (cheaper)' },
  { value: 'claude-sonnet-5-5', label: 'Sonnet (smarter)' },
];

const REMINDER_TIMES = [
  { label: 'Off', hour: null },
  { label: '7 AM', hour: 7 },
  { label: '12 PM', hour: 12 },
  { label: '6 PM', hour: 18 },
  { label: '8 PM', hour: 20 },
  { label: '9 PM', hour: 21 },
];

export default function SettingsScreen({ nav, lang, setLang }) {
  const c = useTheme();
  const { mode, setMode } = useThemeMode();
  const [remind, setRemind] = useState(null);
  const [remindNote, setRemindNote] = useState('');
  const [key, setKey] = useState(null);
  const [draft, setDraft] = useState('');
  const [keyNote, setKeyNote] = useState('');
  const [model, setModel] = useState(MODELS[0].value);

  useEffect(() => {
    load('remindHour', null).then(setRemind);
    load('model', MODELS[0].value).then(setModel);
    getApiKey().then(setKey);
    return onKeyChange(setKey);
  }, []);

  const pickReminder = async (hour) => {
    setRemindNote('');
    try {
      const ok = await scheduleReminders(hour);
      if (!ok) return setRemindNote('Notifications are blocked. Allow them for Code Recall in your phone settings, then pick a time again.');
      setRemind(hour);
      save('remindHour', hour);
      setRemindNote(hour == null ? 'Reminders are off.' : "Reminders are on. Each one names that day's task.");
    } catch {
      setRemindNote("Reminders couldn't be scheduled in Expo Go. They work in the installed app.");
    }
  };

  const saveKey = async () => {
    const k = draft.trim();
    if (!k.startsWith('sk-ant-')) return setKeyNote('Anthropic keys start with "sk-ant-". Check that you copied the whole key.');
    await setApiKey(k);
    setDraft('');
    setKeyNote('Key saved. The tutor is ready.');
  };

  return (
    <Page gap={space.xl}>
      <Header onBack={nav.pop} title="Settings" />

      <Section title="Appearance">
        <Segmented
          full
          value={mode}
          onChange={setMode}
          options={[
            { value: 'system', label: 'Match device' },
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ]}
        />
      </Section>

      <Section title="Code language">
        <T v="small" color={c.muted}>Used for code on cards and in practice. C# matches your skills test.</T>
        <Segmented value={lang} onChange={setLang} options={Object.entries(LANGS).map(([value, label]) => ({ value, label }))} />
      </Section>

      {remindersSupported && (
        <Section title="Daily reminder">
          <View style={s.row}>
            {REMINDER_TIMES.map((t) => (
              <Chip key={t.label} label={t.label} on={remind === t.hour} onPress={() => pickReminder(t.hour)} />
            ))}
          </View>
          {!!remindNote && <T v="small" color={c.muted}>{remindNote}</T>}
        </Section>
      )}

      <Section title="Tutor">
        <Card style={{ gap: space.md }}>
          {key ? (
            <>
              <View style={s.between}>
                <T v="body" color={c.ink}>API key</T>
                <T v="small" color={c.muted} style={{ fontFamily: mono }}>{key.slice(0, 10)}…{key.slice(-4)}</T>
              </View>
              <T v="smallStrong">Model</T>
              <Segmented value={model} onChange={(m) => { setModel(m); save('model', m); }} options={MODELS} />
              <View style={s.row}>
                <Btn small kind="danger" title="Remove key" onPress={removeApiKey} />
                <Btn small kind="ghost" title="Usage and billing" onPress={() => Linking.openURL('https://console.anthropic.com/settings/billing')} />
              </View>
            </>
          ) : (
            <>
              <T v="body">
                The tutor uses your own Anthropic API key, billed per use and separate from a Claude subscription. The key stays on this device.
              </T>
              <Field value={draft} onChangeText={setDraft} placeholder="sk-ant-…" secureTextEntry />
              <View style={s.row}>
                <Btn kind="primary" title="Save key" onPress={saveKey} disabled={!draft.trim()} />
                <Btn kind="ghost" title="Get a key" onPress={() => Linking.openURL('https://console.anthropic.com/settings/keys')} />
              </View>
            </>
          )}
          {!!keyNote && <T v="small" color={keyNote.startsWith('Key saved') ? c.good : c.bad}>{keyNote}</T>}
        </Card>
      </Section>

      <T v="caption" color={c.faint} style={{ textAlign: 'center' }}>
        Code Recall. Progress is saved on this device only.
      </T>
    </Page>
  );
}
