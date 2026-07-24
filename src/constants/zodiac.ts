
export interface ZodiacResult {
    sign: string;
    emoji: string;
  }
  
  const ZODIAC_RANGES: Array<{
    sign: string;
    emoji: string;
    startMonth: number;
    startDay: number;
    endMonth: number;
    endDay: number;
  }> = [
    { sign: 'Capricorn', emoji: '♑', startMonth: 12, startDay: 22, endMonth: 1, endDay: 19 },
    { sign: 'Aquarius', emoji: '♒', startMonth: 1, startDay: 20, endMonth: 2, endDay: 18 },
    { sign: 'Pisces', emoji: '♓', startMonth: 2, startDay: 19, endMonth: 3, endDay: 20 },
    { sign: 'Aries', emoji: '♈', startMonth: 3, startDay: 21, endMonth: 4, endDay: 19 },
    { sign: 'Taurus', emoji: '♉', startMonth: 4, startDay: 20, endMonth: 5, endDay: 20 },
    { sign: 'Gemini', emoji: '♊', startMonth: 5, startDay: 21, endMonth: 6, endDay: 20 },
    { sign: 'Cancer', emoji: '♋', startMonth: 6, startDay: 21, endMonth: 7, endDay: 22 },
    { sign: 'Leo', emoji: '♌', startMonth: 7, startDay: 23, endMonth: 8, endDay: 22 },
    { sign: 'Virgo', emoji: '♍', startMonth: 8, startDay: 23, endMonth: 9, endDay: 22 },
    { sign: 'Libra', emoji: '♎', startMonth: 9, startDay: 23, endMonth: 10, endDay: 22 },
    { sign: 'Scorpio', emoji: '♏', startMonth: 10, startDay: 23, endMonth: 11, endDay: 21 },
    { sign: 'Sagittarius', emoji: '♐', startMonth: 11, startDay: 22, endMonth: 12, endDay: 21 },
  ];
  

  export function getZodiacSign(dob?: string | Date | null): ZodiacResult | null {
    if (!dob) return null;
  
    const date = dob instanceof Date ? dob : parseDobString(dob);
    if (!date || isNaN(date.getTime())) return null;
  

    const month = date.getUTCMonth() + 1; // 1-12
    const day = date.getUTCDate();
  
    for (const range of ZODIAC_RANGES) {
      if (range.startMonth === range.endMonth) {
        if (month === range.startMonth && day >= range.startDay && day <= range.endDay) {
          return { sign: range.sign, emoji: range.emoji };
        }
      } else if (range.startMonth > range.endMonth) {
        // Wraps the new year (Capricorn: Dec 22 - Jan 19)
        if (
          (month === range.startMonth && day >= range.startDay) ||
          (month === range.endMonth && day <= range.endDay)
        ) {
          return { sign: range.sign, emoji: range.emoji };
        }
      } else {
        if (
          (month === range.startMonth && day >= range.startDay) ||
          (month === range.endMonth && day <= range.endDay) ||
          (month > range.startMonth && month < range.endMonth)
        ) {
          return { sign: range.sign, emoji: range.emoji };
        }
      }
    }
  
    return null;
  }
  
  /** Parses 'YYYY-MM-DD' or full ISO strings into a UTC-safe Date. */
  function parseDobString(value: string): Date | null {
    const isoDateOnly = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    if (isoDateOnly) {
      const [, y, m, d] = isoDateOnly;
      return new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
    }
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  
  /** Formats a DOB string/Date as 'MMM D, YYYY', e.g. 'Apr 6, 2002'. */
  export function formatDob(dob?: string | Date | null): string | null {
    if (!dob) return null;
    const date = dob instanceof Date ? dob : parseDobString(dob);
    if (!date || isNaN(date.getTime())) return null;
  
    const MONTHS = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
  }