// Study-plan helpers shared by Today, the full plan and reminders.
import { useEffect, useState } from 'react';
import { PLAN, START, TEST } from './data';
import { load, save } from './storage';

const DAY = 86400000;

export const today0 = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

// Every plan day, flattened: { idx, week, weekTitle, title, task, cid, date }
export const DAYS = PLAN.flatMap((w, wi) =>
  w.days.map(([title, task, cid]) => ({ week: wi, weekTitle: w.w, title, task, cid }))
).map((d, idx) => ({ ...d, idx, date: new Date(START.getFullYear(), START.getMonth(), START.getDate() + idx) }));

export const todayIndex = () => Math.round((today0() - START) / DAY);
export const daysLeft = () => Math.round((TEST - today0()) / DAY);
export function todayTopic() {
  const d = DAYS[todayIndex()];
  return d ? d.title : 'general review';
}

export const fmtDate = (d, opts = { weekday: 'short', month: 'short', day: 'numeric' }) => d.toLocaleDateString('en-US', opts);

// Where "Start" on a plan day should take you.
export function startTarget(day) {
  if (day.cid) return { tab: 'learn', route: { name: 'concept', id: day.cid } };
  if (/build|rehearsal/i.test(day.title)) return { tab: 'build' };
  if (/Weak|review/i.test(day.title)) return { tab: 'practice', route: { name: 'mode', mode: 'review' } };
  return { tab: 'tutor' };
}

// Done days, shared live between screens.
let doneCache = null;
const listeners = new Set();
export function useDone() {
  const [done, setDone] = useState(doneCache || new Set());
  useEffect(() => {
    const fn = (s) => setDone(s);
    listeners.add(fn);
    if (!doneCache) load('done', []).then((d) => { doneCache = new Set(d); listeners.forEach((l) => l(doneCache)); });
    return () => listeners.delete(fn);
  }, []);
  const toggle = (i) => {
    const next = new Set(doneCache || []);
    next.has(i) ? next.delete(i) : next.add(i);
    doneCache = next;
    save('done', [...next]);
    listeners.forEach((l) => l(next));
  };
  return [done, toggle];
}

// Topics marked as learned, shared live between screens.
let learnedCache = null;
const learnedListeners = new Set();
export function useLearned() {
  const [learned, setLearned] = useState(learnedCache || new Set());
  useEffect(() => {
    const fn = (s) => setLearned(s);
    learnedListeners.add(fn);
    if (!learnedCache) load('learned', []).then((d) => { learnedCache = new Set(d); learnedListeners.forEach((l) => l(learnedCache)); });
    return () => learnedListeners.delete(fn);
  }, []);
  const toggle = (id) => {
    const next = new Set(learnedCache || []);
    next.has(id) ? next.delete(id) : next.add(id);
    learnedCache = next;
    save('learned', [...next]);
    learnedListeners.forEach((l) => l(next));
  };
  return [learned, toggle];
}
