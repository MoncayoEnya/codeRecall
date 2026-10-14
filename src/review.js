// Mistake notebook: anything you get wrong comes back 1, 3 and 7 days later.
// Get it right three reviews in a row and it is retired.
import { load, save } from './storage';

const DAY = 86400000;
const INTERVALS = [1, 3, 7];
const listeners = new Set();

export const todayNum = () => {
  const d = new Date();
  return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / DAY);
};

// Keys look like "quiz:3", "bug:noopen", "write:insert", "blank:for:cs".
export async function record(key, ok) {
  const map = await load('review', {});
  const now = todayNum();
  if (!ok) {
    map[key] = { step: 0, due: now + INTERVALS[0], misses: (map[key]?.misses || 0) + 1 };
  } else if (map[key]) {
    // Only count it when the item was due; extra practice the same day doesn't advance it.
    if (map[key].due > now) return;
    const step = map[key].step + 1;
    if (step >= INTERVALS.length) delete map[key];
    else map[key] = { ...map[key], step, due: now + INTERVALS[step] };
  } else return;
  await save('review', map);
  listeners.forEach((fn) => fn(map));
}

export async function getReview() {
  return load('review', {});
}

export function dueKeys(map) {
  const now = todayNum();
  return Object.keys(map).filter((k) => map[k].due <= now).sort((a, b) => map[a].due - map[b].due);
}

export function onReviewChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
