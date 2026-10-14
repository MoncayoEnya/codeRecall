// Helpers for showing and practising code snippets.
import { LANGS } from './data';

// SQL cards are the same in every language. A card with no version for the
// chosen language (C#-only WinForms code, for example) falls back to C#.
export const codeOf = (concept, lang) => concept.code.sql || concept.code[lang] || concept.code.cs;
export const langOf = (concept, lang) => (concept.code.sql ? 'sql' : concept.code[lang] ? lang : 'cs');
export const langName = (l) => (l === 'sql' ? 'SQL' : LANGS[l]);

const KW = {
  py: 'def return if elif else for while in range and or not class self import from try except finally break continue True False None print pass lambda',
  java: 'public private static void int double boolean char String class new return if else for while do try catch finally this true false null break switch case import extends',
  cpp: 'int double bool char string void class public private return if else for while do try catch const auto true false break switch case vector map stack queue cout cin endl',
  js: 'const let var function return if else for while do of in new class this try catch finally true false null undefined break switch case constructor',
  cs: 'using var new class public private static void int double bool char string return if else for foreach in while do try catch finally this true false null break switch case get set out List Dictionary Console',
  sql: 'SELECT FROM WHERE JOIN ON GROUP BY HAVING ORDER AS COUNT AND OR LIMIT CREATE TABLE INSERT INTO VALUES UPDATE SET DELETE PRIMARY KEY IDENTITY NOT NULL INT VARCHAR LIKE',
};
const kwSet = Object.fromEntries(Object.entries(KW).map(([k, v]) => [k, new Set(v.split(' '))]));

const commentMark = (l) => (l === 'py' ? '#' : l === 'sql' ? '--' : '//');

// Split code into colored tokens: kw, str, num, com, or plain (k = null).
export function tokenize(code, l) {
  const com = l === 'py' ? '#[^\\n]*' : l === 'sql' ? '--[^\\n]*' : '\\/\\/[^\\n]*';
  const re = new RegExp(
    `(${com})|("(?:[^"\\\\\\n]|\\\\.)*"|'(?:[^'\\\\\\n]|\\\\.)*')|(\\b\\d+(?:\\.\\d+)?\\b)|(\\b[A-Za-z_]\\w*\\b)`,
    'g'
  );
  const out = [];
  let last = 0;
  let m;
  const push = (t, k) => {
    if (!t) return;
    const prev = out[out.length - 1];
    if (prev && prev.k === k) prev.t += t;
    else out.push({ t, k });
  };
  while ((m = re.exec(code))) {
    push(code.slice(last, m.index), null);
    if (m[1]) push(m[0], 'com');
    else if (m[2]) push(m[0], 'str');
    else if (m[3]) push(m[0], 'num');
    else push(m[0], kwSet[l]?.has(m[0]) ? 'kw' : null);
    last = re.lastIndex;
  }
  push(code.slice(last), null);
  return out;
}

// Code for typing / blanks: no comment-only lines, no trailing comments.
export function cleanCode(code, l) {
  const mark = commentMark(l);
  const lines = code
    .split('\n')
    .filter((x) => !x.trim().startsWith(mark))
    .map((line) => {
      const i = line.indexOf(mark);
      if (i < 0) return line;
      const before = line.slice(0, i);
      return (before.match(/"/g) || []).length % 2 ? line : before.replace(/\s+$/, '');
    })
    .filter((line, i, arr) => !(line === '' && arr[i - 1] === ''));
  return lines.join('\n').replace(/^\n+|\n+$/g, '');
}

const BLANKABLE = new Set(
  ('for while do if else elif return def class function break try catch except finally new this self push pop append ' +
    'in of static const let range true True false False null None void int string String public private extends ' +
    'foreach var using get set out Add Remove RemoveAll Find Parameters AddWithValue ExecuteNonQuery ExecuteReader Read Open ' +
    'SELECT FROM WHERE JOIN ON GROUP BY HAVING ORDER COUNT AS INSERT INTO VALUES UPDATE SET DELETE').split(' ')
);

// Pick 3–6 keywords to hide. Returns [{i, w}] sorted by position.
export function pickBlanks(code) {
  const re = /\b[A-Za-z_]\w*\b/g;
  const cands = [];
  let m;
  while ((m = re.exec(code))) {
    if (!BLANKABLE.has(m[0])) continue;
    const lineStart = code.lastIndexOf('\n', m.index) + 1;
    if ((code.slice(lineStart, m.index).match(/"/g) || []).length % 2) continue;
    cands.push({ i: m.index, w: m[0] });
  }
  const n = Math.min(cands.length, Math.max(3, Math.round(cands.length * 0.4)), 6);
  return shuffle(cands).slice(0, n).sort((a, b) => a.i - b.i);
}

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Compare an answer with what the student wrote, line by line.
// Spacing doesn't matter; braces-only lines don't count toward the score.
const normLine = (l) =>
  l.trim().replace(/\s+/g, ' ').replace(/\s*([(){}[\];,=+\-*/<>!&|:.])\s*/g, '$1').replace(/^[{}]+|[{}]+$/g, '');
const isKey = (n) => n !== '' && !/^[{}();]+$/.test(n);

export function lineDiff(answer, mine) {
  const ref = answer.split('\n').map((text) => ({ text, n: normLine(text) }));
  const mineLines = mine.split('\n').map((text) => ({ text, n: normLine(text) })).filter((x) => isKey(x.n));
  const refKeys = ref.map((r, i) => ({ ...r, i })).filter((r) => isKey(r.n));
  // Longest common subsequence over key lines.
  const A = refKeys, B = mineLines;
  const dp = Array.from({ length: A.length + 1 }, () => new Array(B.length + 1).fill(0));
  for (let i = A.length - 1; i >= 0; i--)
    for (let j = B.length - 1; j >= 0; j--)
      dp[i][j] = A[i].n === B[j].n ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const hitRef = new Set(), hitMine = new Set();
  for (let i = 0, j = 0; i < A.length && j < B.length; ) {
    if (A[i].n === B[j].n) { hitRef.add(A[i].i); hitMine.add(j); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  return {
    score: A.length ? hitRef.size / A.length : 0,
    ref: ref.map((r, i) => ({ text: r.text, key: isKey(r.n), hit: hitRef.has(i) })),
    extra: B.filter((_, j) => !hitMine.has(j)).map((x) => x.text.trim()),
  };
}
