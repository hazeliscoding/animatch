import { TestBed } from '@angular/core/testing';
import { HistoryStore, relativeTime } from './history-store';

describe('HistoryStore', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('records comparisons newest-first and dedupes pairs', () => {
    const store = TestBed.inject(HistoryStore);
    store.recordComparison('alice', 'bob', 70);
    store.recordComparison('carol', 'dan', 55);
    store.recordComparison('alice', 'bob', 72);
    expect(store.comparisons().map((c) => c.a)).toEqual(['alice', 'carol']);
    expect(store.comparisons()[0].score).toBe(72);
  });

  it('caps history at 10 entries and persists to localStorage', () => {
    const store = TestBed.inject(HistoryStore);
    for (let i = 0; i < 13; i++) store.recordComparison(`u${i}`, 'x', i);
    expect(store.comparisons()).toHaveLength(10);
    const raw = JSON.parse(localStorage.getItem('animatch.recentComparisons')!);
    expect(raw).toHaveLength(10);
    expect(raw[0].a).toBe('u12');
  });

  it('dedupes groups regardless of member order', () => {
    const store = TestBed.inject(HistoryStore);
    store.recordGroup(['alice', 'bob']);
    store.recordGroup(['bob', 'alice']);
    expect(store.groups()).toHaveLength(1);
  });

  it('survives corrupt localStorage', () => {
    localStorage.setItem('animatch.recentComparisons', '{not json');
    const store = TestBed.inject(HistoryStore);
    expect(store.comparisons()).toEqual([]);
  });
});

describe('relativeTime', () => {
  const now = 1_000_000_000_000;
  it('formats seconds, minutes, hours, and days', () => {
    expect(relativeTime(now - 30_000, now)).toBe('just now');
    expect(relativeTime(now - 5 * 60_000, now)).toBe('5m ago');
    expect(relativeTime(now - 3 * 3_600_000, now)).toBe('3h ago');
    expect(relativeTime(now - 2 * 86_400_000, now)).toBe('2d ago');
  });
});
