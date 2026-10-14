import { Feather } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { font, mono, radius, space, type, useTheme } from '../theme';
import { tokenize } from '../code';

/* ---------- Text ---------- */
// <T v="title">…</T> — every piece of text goes through the type scale.
export function T({ v = 'body', color, style, children, ...rest }) {
  const c = useTheme();
  const base = type[v] || type.body;
  const defaultColor = v === 'body' || v === 'small' ? c.body : v === 'caption' ? c.muted : c.ink;
  return (
    <Text style={[base, { color: color || defaultColor }, style]} {...rest}>
      {children}
    </Text>
  );
}

export function Icon({ name, size = 20, color, style }) {
  const c = useTheme();
  return <Feather name={name} size={size} color={color || c.ink} style={style} />;
}

/* ---------- Layout ---------- */
// Scrollable page with a readable max width on large screens.
export function Page({ children, scrollRef, gap = space.lg, contentStyle, ...rest }) {
  return (
    <ScrollView ref={scrollRef} keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }} {...rest}>
      <View style={[st.page, { gap }, contentStyle]}>{children}</View>
    </ScrollView>
  );
}

// Screen header: optional back, a title, an optional subtitle and a right-side action.
export function Header({ title, subtitle, onBack, right, large = true }) {
  const c = useTheme();
  return (
    <View style={{ gap: space.sm }}>
      {(onBack || right) && (
        <View style={st.headerBar}>
          {onBack ? (
            <Pressable onPress={onBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back" style={st.back}>
              <Icon name="chevron-left" size={22} color={c.accent} />
              <T v="bodyStrong" color={c.accent}>Back</T>
            </Pressable>
          ) : (
            <View />
          )}
          {right || <View />}
        </View>
      )}
      <T v={large ? 'display' : 'title'} accessibilityRole="header">
        {title}
      </T>
      {!!subtitle && <T v="body" color={c.muted}>{subtitle}</T>}
    </View>
  );
}

export function Section({ title, action, children, gap = space.sm }) {
  return (
    <View style={{ gap }}>
      {(title || action) && (
        <View style={st.between}>
          {title ? <T v="h3">{title}</T> : <View />}
          {action}
        </View>
      )}
      {children}
    </View>
  );
}

/* ---------- Surfaces ---------- */
export function Card({ children, style, tone, padded = true, onPress, accessibilityLabel }) {
  const c = useTheme();
  const bg = tone === 'accent' ? c.accentSoft : tone === 'due' ? c.dueSoft : tone === 'good' ? c.goodSoft : c.surface;
  const border = tone ? 'transparent' : c.line;
  const inner = [st.card, padded && st.cardPad, { backgroundColor: bg, borderColor: border }, style];
  if (onPress) {
    return (
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel} style={({ pressed }) => [inner, pressed && { opacity: 0.85 }]}>
        {children}
      </Pressable>
    );
  }
  return <View style={inner}>{children}</View>;
}

// A group of rows inside one card, separated by hairlines (iOS-settings style).
export function List({ children }) {
  const c = useTheme();
  const items = [].concat(children).filter(Boolean);
  return (
    <View style={[st.card, { backgroundColor: c.surface, borderColor: c.line, overflow: 'hidden' }]}>
      {items.map((ch, i) => (
        <View key={i}>
          {i > 0 && <View style={[st.divider, { backgroundColor: c.line }]} />}
          {ch}
        </View>
      ))}
    </View>
  );
}

// One tappable row: icon tile, title, description, and a trailing badge or chevron.
export function Row({ icon, iconTone = 'accent', lead, title, description, trailing, onPress, disabled }) {
  const c = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [st.row, pressed && { backgroundColor: c.sunken }]}
    >
      {lead || (!!icon && <IconTile name={icon} tone={iconTone} />)}
      <View style={{ flex: 1, gap: 2 }}>
        <T v="bodyStrong">{title}</T>
        {!!description && <T v="small" color={c.muted} numberOfLines={2}>{description}</T>}
      </View>
      {trailing}
      {onPress && <Icon name="chevron-right" size={18} color={c.faint} />}
    </Pressable>
  );
}

// Step number in a path; turns into a check when done.
export function StepTile({ n, done, next }) {
  const c = useTheme();
  return (
    <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
      backgroundColor: done ? c.good : next ? c.accent : c.sunken }}>
      {done ? <Icon name="check" size={18} color="#fff" /> : <T v="smallStrong" color={next ? c.onAccent : c.muted}>{n}</T>}
    </View>
  );
}

export function IconTile({ name, tone = 'accent', size = 36 }) {
  const c = useTheme();
  const map = {
    accent: [c.accentSoft, c.accent],
    good: [c.goodSoft, c.good],
    bad: [c.badSoft, c.bad],
    due: [c.dueSoft, c.due],
    plain: [c.sunken, c.muted],
  };
  const [bg, fg] = map[tone] || map.accent;
  return (
    <View style={{ width: size, height: size, borderRadius: 10, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={name} size={size * 0.5} color={fg} />
    </View>
  );
}

export function Badge({ children, tone = 'accent' }) {
  const c = useTheme();
  const map = { accent: [c.accentSoft, c.accent], due: [c.dueSoft, c.due], good: [c.goodSoft, c.good], bad: [c.badSoft, c.bad], plain: [c.sunken, c.muted] };
  const [bg, fg] = map[tone] || map.accent;
  return (
    <View style={[st.badge, { backgroundColor: bg }]}>
      <T v="caption" color={fg} style={{ fontFamily: font.semibold }}>{children}</T>
    </View>
  );
}

// Side-stripe note: "Use it when" (good), "Watch out" (bad), info (accent).
export function Callout({ tone = 'accent', title, children, icon }) {
  const c = useTheme();
  const col = tone === 'good' ? c.good : tone === 'bad' ? c.bad : tone === 'due' ? c.due : c.accent;
  const bg = tone === 'good' ? c.goodSoft : tone === 'bad' ? c.badSoft : tone === 'due' ? c.dueSoft : c.accentSoft;
  return (
    <View style={[st.callout, { backgroundColor: bg }]}>
      {!!icon && <Icon name={icon} size={18} color={col} style={{ marginTop: 3 }} />}
      <View style={{ flex: 1, gap: 2 }}>
        {!!title && <T v="smallStrong" color={col}>{title}</T>}
        {typeof children === 'string' ? <T v="body" color={c.ink}>{children}</T> : children}
      </View>
    </View>
  );
}

/* ---------- Controls ---------- */
export function Btn({ title, onPress, kind = 'secondary', disabled, small, icon, full, accessibilityLabel }) {
  const c = useTheme();
  const look = {
    primary: { bg: c.accent, fg: c.onAccent, border: c.accent },
    secondary: { bg: c.surface, fg: c.ink, border: c.line },
    ghost: { bg: 'transparent', fg: c.accent, border: 'transparent' },
    danger: { bg: c.badSoft, fg: c.bad, border: 'transparent' },
  }[kind];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        st.btn,
        small && st.btnSmall,
        full && { alignSelf: 'stretch' },
        { backgroundColor: look.bg, borderColor: look.border, opacity: disabled ? 0.45 : pressed ? 0.8 : 1 },
      ]}
    >
      {!!icon && <Icon name={icon} size={small ? 16 : 18} color={look.fg} />}
      <Text style={[small ? type.smallStrong : type.bodyStrong, { color: look.fg }]}>{title}</Text>
    </Pressable>
  );
}

export function Segmented({ options, value, onChange, full }) {
  const c = useTheme();
  return (
    <View style={[st.seg, { backgroundColor: c.sunken }, full && { alignSelf: 'stretch' }]}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            onPress={() => onChange(o.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            style={[st.segItem, full && { flex: 1 }, on && { backgroundColor: c.surface, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }]}
          >
            <T v="smallStrong" color={on ? c.ink : c.muted} style={{ textAlign: 'center' }}>{o.label}</T>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Chip({ label, on, onPress, icon }) {
  const c = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!on }}
      style={[st.chip, { backgroundColor: on ? c.ink : c.surface, borderColor: on ? c.ink : c.line }]}
    >
      {!!icon && <Icon name={icon} size={14} color={on ? c.bg : c.muted} />}
      <T v="smallStrong" color={on ? c.bg : c.body}>{label}</T>
    </Pressable>
  );
}

export function ChipRow({ children }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm, paddingRight: space.lg }}>
      {children}
    </ScrollView>
  );
}

export function Checkbox({ on, onPress, label, sub }) {
  const c = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="checkbox" accessibilityState={{ checked: !!on }} style={st.checkRow} hitSlop={4}>
      <View style={[st.box, { borderColor: on ? c.good : c.faint, backgroundColor: on ? c.good : 'transparent' }]}>
        {on && <Icon name="check" size={14} color="#fff" />}
      </View>
      <View style={{ flex: 1 }}>
        <T v="body" color={on ? c.muted : c.ink}>{label}</T>
        {!!sub && <T v="small" color={c.muted}>{sub}</T>}
      </View>
    </Pressable>
  );
}

export function Field({ style, multiline, ...rest }) {
  const c = useTheme();
  return (
    <TextInput
      placeholderTextColor={c.faint}
      autoCapitalize="none"
      autoCorrect={false}
      spellCheck={false}
      multiline={multiline}
      style={[
        st.field,
        { color: c.ink, backgroundColor: c.surface, borderColor: c.line },
        multiline && { minHeight: 120, textAlignVertical: 'top', fontFamily: mono, fontSize: 14, lineHeight: 21 },
        style,
      ]}
      {...rest}
    />
  );
}

/* ---------- Code ---------- */
export function CodeBlock({ code, lang, size = 13.5 }) {
  const c = useTheme();
  const toks = tokenize(code, lang);
  return (
    <ScrollView horizontal style={[st.code, { backgroundColor: c.codeBg, borderColor: c.line }]} contentContainerStyle={{ padding: space.lg }}>
      <Text selectable style={{ fontFamily: mono, fontSize: size, lineHeight: size * 1.6, color: c.ink }}>
        {toks.map((t, i) => (t.k ? <Text key={i} style={{ color: c[t.k] }}>{t.t}</Text> : t.t))}
      </Text>
    </ScrollView>
  );
}

// Wide-screen helper: two columns on desktop web, one on phones.
export function useWide(min = 900) {
  return useWindowDimensions().width >= min;
}

export const s = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, alignItems: 'center' },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.md },
});

const st = StyleSheet.create({
  page: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: 48 },
  headerBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 32 },
  back: { flexDirection: 'row', alignItems: 'center', marginLeft: -6 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.md },
  card: { borderRadius: radius.lg, borderWidth: 1 },
  divider: { position: 'absolute', top: 0, left: 64, right: 0, height: StyleSheet.hairlineWidth },
  cardPad: { padding: space.lg, gap: space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: 14 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill },
  callout: { flexDirection: 'row', gap: space.sm, borderRadius: radius.md, padding: space.md },
  btn: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: radius.md, paddingVertical: 12, paddingHorizontal: 18, alignSelf: 'flex-start' },
  btnSmall: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
  seg: { flexDirection: 'row', borderRadius: radius.md, padding: 3, alignSelf: 'flex-start' },
  segItem: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 9 },
  chip: { flexDirection: 'row', gap: 6, alignItems: 'center', borderWidth: 1, borderRadius: radius.pill, paddingVertical: 7, paddingHorizontal: 14 },
  checkRow: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start', paddingVertical: 6 },
  box: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  field: { borderWidth: 1, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, fontFamily: font.regular, fontSize: 16 },
  code: { borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.md, flexGrow: 0 },
});
