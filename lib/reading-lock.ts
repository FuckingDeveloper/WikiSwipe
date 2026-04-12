const MIN_READING_LOCK_SECONDS = 15;
const MAX_READING_LOCK_SECONDS = 120;
const TARGET_WORDS_PER_MINUTE = 240;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function countWords(text: string): number {
  const matches = text.match(/[\p{L}\p{N}'’-]+/gu);
  return matches?.length ?? 0;
}

export function estimateReadingLockSeconds(text: string): number {
  const words = countWords(text);

  if (!Number.isFinite(words) || words <= 0) {
    return 30;
  }

  const estimated = Math.ceil((words / TARGET_WORDS_PER_MINUTE) * 60);
  return clamp(estimated, MIN_READING_LOCK_SECONDS, MAX_READING_LOCK_SECONDS);
}
