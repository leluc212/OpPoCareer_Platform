import { describe, it, expect } from 'vitest';
import { formatDaysRange, formatShiftString } from './formatDays';

describe('formatDaysRange', () => {
  it('should return empty string for empty inputs', () => {
    expect(formatDaysRange('')).toBe('');
    expect(formatDaysRange([])).toBe('');
    expect(formatDaysRange(null)).toBe('');
  });

  it('should format a contiguous range of indices in Vietnamese', () => {
    // T2 to T6
    expect(formatDaysRange('T2,T3,T4,T5,T6', 'vi')).toBe('Thứ 2 - Thứ 6');
    // T2 to T7
    expect(formatDaysRange('T2,T3,T4,T5,T6,T7', 'vi')).toBe('Thứ 2 - Thứ 7');
    // T2 to CN
    expect(formatDaysRange('T2,T3,T4,T5,T6,T7,CN', 'vi')).toBe('Thứ 2 - Chủ nhật');
  });

  it('should format a contiguous range of indices in English', () => {
    // T2 to T6
    expect(formatDaysRange('T2,T3,T4,T5,T6', 'en')).toBe('Mon - Fri');
    // T2 to T7
    expect(formatDaysRange('T2,T3,T4,T5,T6,T7', 'en')).toBe('Mon - Sat');
    // T2 to CN
    expect(formatDaysRange('T2,T3,T4,T5,T6,T7,CN', 'en')).toBe('Mon - Sun');
  });

  it('should handle non-contiguous days correctly', () => {
    expect(formatDaysRange('T2,T4,T6', 'vi')).toBe('Thứ 2, Thứ 4, Thứ 6');
    expect(formatDaysRange(['T2', 'T4', 'T6'], 'en')).toBe('Mon, Wed, Fri');
  });

  it('should format mixed ranges correctly', () => {
    expect(formatDaysRange('T2,T3,T5,T6,T7', 'vi')).toBe('Thứ 2 - Thứ 3, Thứ 5 - Thứ 7');
    expect(formatDaysRange('T2,T3,T5,T6,CN', 'vi')).toBe('Thứ 2 - Thứ 3, Thứ 5 - Thứ 6, Chủ nhật');
    expect(formatDaysRange('T2,T3,T5,T6,CN', 'en')).toBe('Mon - Tue, Thu - Fri, Sun');
  });

  it('should format single days correctly', () => {
    expect(formatDaysRange('T2', 'vi')).toBe('Thứ 2');
    expect(formatDaysRange('T7', 'en')).toBe('Sat');
  });
});

describe('formatShiftString', () => {
  it('should handle empty or invalid inputs', () => {
    expect(formatShiftString('')).toBe('');
    expect(formatShiftString(null)).toBe(null);
  });

  it('should format simple shift string', () => {
    expect(formatShiftString('T2,T3,T4,T5,T6 @ 07:00 - 11:30', 'vi')).toBe('Thứ 2 - Thứ 6 @ 07:00 - 11:30');
    expect(formatShiftString('T2,T3,T4,T5,T6 @ 07:00 - 11:30', 'en')).toBe('Mon - Fri @ 07:00 - 11:30');
  });

  it('should format multiple shifts separated by pipes', () => {
    const raw = 'T2,T3,T4,T5 @ 07:00 - 11:30 | T6,T7 @ 08:00 - 12:00';
    expect(formatShiftString(raw, 'vi')).toBe('Thứ 2 - Thứ 5 @ 07:00 - 11:30 | Thứ 6 - Thứ 7 @ 08:00 - 12:00');
    expect(formatShiftString(raw, 'en')).toBe('Mon - Thu @ 07:00 - 11:30 | Fri - Sat @ 08:00 - 12:00');
  });

  it('should preserve formatting if no @ matches', () => {
    expect(formatShiftString('Full-time', 'vi')).toBe('Full-time');
    expect(formatShiftString('07:00 - 15:00', 'vi')).toBe('07:00 - 15:00');
  });
});
