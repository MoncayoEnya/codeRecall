// Everything that asks Claude for new practice content.
// Generated items are checked for shape, saved on the device (so Review can bring them back),
// and aimed at the topics you've been getting wrong.
import { LANGS, QUIZ, byId } from './data';
import { BUGS, WRITE } from './drills';
import { getApiKey, load, save } from './storage';
import { getReview } from './review';
import { todayTopic } from './plan';

export const DEFAULT_MODEL = 'claude-haiku-5-5';

export async function askClaude({ system, messages, maxTokens = 1200 }) {
  const apiKey = await getApiKey();
  if (!apiKey) throw new Error('Add your Anthropic API key in Settings to get AI-made practice.');
  const model = await load('model', DEFAULT_MODEL);
  let res;
  try {
    res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true', // needed only on web
      },
      body: JSON.stringify({ model, max_tokens: maxTokens, system, messages }),
    });
  } catch {
    throw new Error('No internet connection. Use the built-in set, or try again when you are online.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) throw new Error('Your API key was rejected. Check it in Settings.');
    if (res.status === 429) throw new Error('Too many requests. Wait a minute, then try again.');
    if (res.status === 529) throw new Error('Claude is busy right now. Try again in a moment.');
    throw new Error(data?.error?.message || `The request failed (${res.status}). Try again.`);
  }
  return (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
}

// Pull one JSON value out of a reply, even if it is wrapped in a code fence or a sentence.
export function parseJSON(text) {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fence ? fence[1] : text;
  const start = body.search(/[[{]/);
  const end = Math.max(body.lastIndexOf(']'), body.lastIndexOf('}'));
  if (start < 0 || end < start) throw new Error('bad');
  return JSON.parse(body.slice(start, end + 1));
}

const SYSTEM = `You write practice material for a 4th-year BSCS student in the Philippines preparing for a programming skills test on November 10, 2026. The test is about CRUD (Create, Read, Update, Delete), most likely a C# Windows Forms app with SQL Server or MySQL, using SqlConnection, SqlCommand with parameters, SqlDataAdapter, DataGridView, List<T> and input validation.
Rules for everything you write:
- Code must be correct and realistic, the kind a grader or professor would use. Keep snippets short (under 15 lines unless asked).
- Before answering, mentally run any code you show and double-check every answer. If you are not sure an answer is right, write a different item.
- Plain English. No markdown outside JSON string values.
- Reply with ONLY the JSON requested, nothing before or after it.`;

const LANG_NAMES = { ...LANGS, sql: 'SQL' };
const s = (v) => typeof v === 'string' && v.trim().length > 0;
const uid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// Topics behind the user's current mistakes, so new items can target them.
async function weakSpots() {
  const map = await getReview();
  const gen = await load('gen', {});
  const names = new Set();
  for (const key of Object.keys(map)) {
    const [t, a] = key.split(':');
    if (t === 'quiz' && QUIZ[+a]) names.add(QUIZ[+a].q + ' (' + QUIZ[+a].l + ')');
    else if (t === 'bug') names.add('bug: ' + (BUGS.find((x) => x.id === a)?.title || ''));
    else if (t === 'write') names.add('writing: ' + (WRITE.find((x) => x.id === a)?.title || ''));
    else if (t === 'blank' && byId[a]) names.add(byId[a].title);
    else if (t.startsWith('g') && gen[a]) names.add(gen[a].topic || gen[a].title || '');
  }
  return [...names].filter(Boolean).slice(0, 6);
}

async function context(lang) {
  const weak = await weakSpots();
  return `Preferred language: ${LANG_NAMES[lang] || 'C#'}. Today's study-plan topic: ${todayTopic()}.${
    weak.length ? ` They recently got these wrong, so lean toward the same ideas: ${weak.join('; ')}.` : ''
  }`;
}

async function generate(prompt, maxTokens = 2500) {
  const text = await askClaude({ system: SYSTEM, messages: [{ role: 'user', content: prompt }], maxTokens });
  try {
    return parseJSON(text);
  } catch {
    throw new Error("The AI's reply couldn't be read. Try again.");
  }
}

// Save generated items so Review can show them again later.
async function remember(items) {
  const gen = await load('gen', {});
  for (const it of items) gen[it.id] = it;
  const ids = Object.keys(gen);
  if (ids.length > 300) for (const id of ids.slice(0, ids.length - 300)) delete gen[id]; // keep it small
  await save('gen', gen);
  return items;
}
export async function getGenerated(id) {
  return (await load('gen', {}))[id] || null;
}
export async function getAllGenerated() {
  return load('gen', {});
}

/* ---------- Predict the output ---------- */
export async function genQuestions(lang, n = 5) {
  const data = await generate(
    `${await context(lang)}
Write ${n} "what does this code print / what happens" multiple-choice questions. Mix: at least 2 about CRUD or SQL behavior (UPDATE without WHERE, ExecuteNonQuery vs ExecuteScalar, List.Remove vs RemoveAt, int.TryParse, string comparison, loops over records), the rest on fundamentals likely on the test. Use ${LANG_NAMES[lang] || 'C#'} for most code; SQL is allowed.
Return a JSON array. Each item:
{"l": language name exactly one of "C#","Python","Java","C++","JavaScript","SQL", "topic": 2-5 word topic, "q": short question, "code": the snippet, "opts": [4 short distinct answers], "a": index 0-3 of the correct option, "why": one or two sentences explaining the answer}`
  );
  const ok = (Array.isArray(data) ? data : []).filter(
    (x) => s(x?.q) && s(x?.code) && Array.isArray(x.opts) && x.opts.length === 4 && x.opts.every(s) && new Set(x.opts).size === 4 && Number.isInteger(x.a) && x.a >= 0 && x.a < 4 && s(x.why)
  );
  if (!ok.length) throw new Error("The AI didn't return usable questions. Try again.");
  return remember(ok.map((x) => ({ ...x, kind: 'quiz', id: uid('q') })));
}

/* ---------- Bug hunt ---------- */
export async function genBugs(lang, n = 3) {
  const data = await generate(
    `${await context(lang)}
Write ${n} "find the bug" snippets, mostly C# CRUD code (SqlCommand, parameters, ExecuteNonQuery, DataGridView events, validation, List<T>) plus at most one SQL statement. Each snippet is 3-8 lines with EXACTLY ONE line that is wrong. The bug must be the kind students really make on a CRUD test. Do not mark the bug with comments.
Return a JSON array. Each item:
{"lang": "cs" or "sql", "title": the symptom in under 6 words (e.g. "Every row got updated"), "topic": 2-5 words, "code": the snippet with lines separated by \\n, "bad": 0-based index of the wrong line, "why": one or two sentences, "fix": the corrected line or a one-line instruction}`
  );
  const ok = (Array.isArray(data) ? data : []).filter((x) => {
    if (!s(x?.code) || !s(x?.title) || !s(x?.why) || !s(x?.fix)) return false;
    const lines = x.code.split('\n');
    return Number.isInteger(x.bad) && x.bad >= 0 && x.bad < lines.length && lines[x.bad].trim().length > 0;
  });
  if (!ok.length) throw new Error("The AI didn't return usable bugs. Try again.");
  return remember(ok.map((x) => ({ ...x, lang: x.lang === 'sql' ? 'sql' : 'cs', kind: 'bug', id: uid('b') })));
}

/* ---------- Write from scratch ---------- */
export async function genWrites(lang, n = 3) {
  const data = await generate(
    `${await context(lang)}
Write ${n} "write this from scratch" tasks a CRUD skills test might ask: a button handler, a method, a validation check, a SQL statement, or a class. Each answer is 4-15 lines. Mostly ${LANG_NAMES[lang] || 'C#'} (C# WinForms with SqlConnection if C#); at most one SQL task. Name controls clearly (txtName, dgv, btnAdd) and say in the prompt which names to use.
Return a JSON array. Each item:
{"lang": "cs","py","java","cpp","js" or "sql", "title": 2-4 words, "topic": 2-5 words, "prompt": one or two sentences saying exactly what to write, including names to use, "answer": the model answer code}`
  );
  const ok = (Array.isArray(data) ? data : []).filter((x) => s(x?.title) && s(x?.prompt) && s(x?.answer) && x.answer.split('\n').length >= 2);
  if (!ok.length) throw new Error("The AI didn't return usable tasks. Try again.");
  return remember(ok.map((x) => ({ ...x, lang: LANG_NAMES[x.lang] ? x.lang : 'cs', kind: 'write', id: uid('w') })));
}

/* ---------- Build scenario ---------- */
export async function genScenario() {
  const x = await generate(
    `${await context('cs')}
Write ONE new C# Windows Forms CRUD skills-test scenario that is different from: Student Records, Library Books, Product Inventory, Employee Payroll, Clinic Appointments. Pick a realistic Filipino school or small-business setting.
Return a JSON object:
{"title": 2-3 words, "minutes": 60, 75 or 90, "table": a plain-text table spec, first line the table name, then one line per column formatted like "  column_name   TYPE  rules" (5-7 columns, include id INT PK auto-increment), "extra": one extra feature in one sentence, "checks": [3 specific things a grader would test for THIS scenario, each one sentence]}`,
    1500
  );
  if (!s(x?.title) || !s(x?.table) || !s(x?.extra) || !Array.isArray(x.checks) || x.checks.filter(s).length < 2) {
    throw new Error("The AI didn't return a usable scenario. Try again.");
  }
  const sc = { id: uid('sc'), kind: 'scenario', title: x.title, minutes: [60, 75, 90].includes(x.minutes) ? x.minutes : 75, table: x.table, extra: x.extra, checks: x.checks.filter(s).slice(0, 4), ai: true };
  await remember([sc]);
  const list = await load('genScenarios', []);
  await save('genScenarios', [sc.id, ...list].slice(0, 20));
  return sc;
}
