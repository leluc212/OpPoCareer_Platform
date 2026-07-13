// Days mapping and ordering
const DAYS_ORDER = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

const LABELS_VI = {
  'T2': 'Thứ 2',
  'T3': 'Thứ 3',
  'T4': 'Thứ 4',
  'T5': 'Thứ 5',
  'T6': 'Thứ 6',
  'T7': 'Thứ 7',
  'CN': 'Chủ nhật'
};

const LABELS_EN = {
  'T2': 'Mon',
  'T3': 'Tue',
  'T4': 'Wed',
  'T5': 'Thu',
  'T6': 'Fri',
  'T7': 'Sat',
  'CN': 'Sun'
};

/**
 * Helper to check if a list of sorted indices forms a contiguous range.
 */
function isContiguousRange(indices) {
  if (indices.length < 2) return false;
  for (let i = 1; i < indices.length; i++) {
    if (indices[i] !== indices[i - 1] + 1) {
      return false;
    }
  }
  return true;
}

/**
 * Format a list of days to ranges where possible.
 * Examples:
 *   ['T2', 'T3', 'T4', 'T5', 'T6', 'T7'] -> 'Thứ 2 - Thứ 7' (VI) / 'Mon - Sat' (EN)
 *   ['T2', 'T4', 'T6'] -> 'Thứ 2, Thứ 4, Thứ 6' (VI) / 'Mon, Wed, Fri' (EN)
 *   ['T2', 'T3', 'T5', 'T6'] -> 'Thứ 2 - Thứ 3, Thứ 5 - Thứ 6'
 *
 * @param {string|string[]} daysInput - Comma separated string or list of day keys (T2, T3, T4, T5, T6, T7, CN)
 * @param {string} language - 'vi' or 'en'
 * @returns {string} Formatted range
 */
export function formatDaysRange(daysInput, language = 'vi') {
  if (!daysInput) return '';

  const daysList = Array.isArray(daysInput)
    ? daysInput
    : String(daysInput)
        .split(',')
        .map(d => d.trim())
        .filter(Boolean);

  if (daysList.length === 0) return '';

  const labels = language === 'vi' ? LABELS_VI : LABELS_EN;

  // Filter out invalid keys and sort according to canonical week order
  const validSortedDays = DAYS_ORDER.filter(day => daysList.includes(day));

  if (validSortedDays.length === 0) {
    // If none are in DAYS_ORDER, return joined input
    return daysList.map(d => labels[d] || d).join(', ');
  }

  // Find consecutive groups
  const groups = [];
  let currentGroup = [validSortedDays[0]];

  for (let i = 1; i < validSortedDays.length; i++) {
    const prevDay = validSortedDays[i - 1];
    const currDay = validSortedDays[i];
    const prevIndex = DAYS_ORDER.indexOf(prevDay);
    const currIndex = DAYS_ORDER.indexOf(currDay);

    if (currIndex === prevIndex + 1) {
      currentGroup.push(currDay);
    } else {
      groups.push(currentGroup);
      currentGroup = [currDay];
    }
  }
  groups.push(currentGroup);

  // Format groups
  const formattedGroups = groups.map(group => {
    if (group.length >= 2) {
      const startLabel = labels[group[0]];
      const endLabel = labels[group[group.length - 1]];
      return `${startLabel} - ${endLabel}`;
    } else {
      return labels[group[0]];
    }
  });

  return formattedGroups.join(', ');
}

/**
 * Format serialized shift strings containing days and time.
 * Examples:
 *   'T2,T3,T4,T5,T6 @ 07:00 - 11:30' -> 'Thứ 2 - Thứ 6 | 07:00 - 11:30'
 *   'T2,T3,T4 @ 07:00 - 11:30 | T7 @ 08:00 - 12:00' -> 'Thứ 2 - Thứ 4 | 07:00 - 11:30 | Thứ 7 | 08:00 - 12:00'
 *
 * @param {string} shiftStr - The raw shift string
 * @param {string} language - 'vi' or 'en'
 * @returns {string} Formatted shift string
 */
export function formatShiftString(shiftStr, language = 'vi') {
  if (!shiftStr || typeof shiftStr !== 'string') return shiftStr;

  return shiftStr
    .split(/\s*\|\s*/)
    .map(slot => {
      const trimmedSlot = slot.trim();
      const atIdx = trimmedSlot.indexOf('@');
      if (atIdx !== -1) {
        const daysPart = trimmedSlot.slice(0, atIdx).trim();
        const timePart = trimmedSlot.slice(atIdx + 1).trim();
        const formattedDays = formatDaysRange(daysPart, language);
        return `${formattedDays} | ${timePart}`;
      }
      return trimmedSlot;
    })
    .join(' | ');
}
