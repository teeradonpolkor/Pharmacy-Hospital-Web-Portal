import { CustomThaiHoliday, ThaiHolidayCategory } from '../types/portal';
import { getWeekendDays } from './rosterData';

export interface DetectedThaiHoliday {
  id?: string;
  dateKey: string; // YYYY-MM-DD
  yearAD: number;
  month: number;
  day: number;
  name: string;
  category: ThaiHolidayCategory;
  isCustom: boolean;
}

export interface ThaiMonthHolidayReport {
  yearAD: number;
  month: number;
  weekends: number[];
  thaiHolidays: DetectedThaiHoliday[];
  allHolidayDays: number[];
  hasLunarCoverage: boolean;
}

export function formatDateKey(yearAD: number, month: number, day: number): string {
  return `${yearAD}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export const THAI_HOLIDAY_CATEGORY_LABELS: Record<ThaiHolidayCategory, string> = {
  royal: 'วันสำคัญราชวงศ์ / เฉลิมพระชนมพรรษา',
  buddhist: 'วันสำคัญทางพระพุทธศาสนา',
  national: 'วันหยุดราชการประจำปี',
  substitute: 'วันหยุดชดเชย',
  special: 'วันหยุดกรณีพิเศษ (มติ ครม. / เพิ่มเอง)',
};

// Fixed annual Thai government holidays (วันหยุดราชการไทยประจำปี)
const FIXED_THAI_GOV_HOLIDAYS: Array<{
  month: number;
  day: number;
  name: string;
  category: ThaiHolidayCategory;
}> = [
  { month: 1, day: 1, name: 'วันขึ้นปีใหม่', category: 'national' },
  {
    month: 4,
    day: 6,
    name: 'วันพระบาทสมเด็จพระพุทธยอดฟ้าจุฬาโลกมหาราช และวันที่ระลึกมหาจักรีบรมราชวงศ์',
    category: 'royal',
  },
  { month: 4, day: 13, name: 'วันสงกรานต์', category: 'national' },
  { month: 4, day: 14, name: 'วันสงกรานต์', category: 'national' },
  { month: 4, day: 15, name: 'วันสงกรานต์', category: 'national' },
  { month: 5, day: 4, name: 'วันฉัตรมงคล', category: 'royal' },
  {
    month: 6,
    day: 3,
    name: 'วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าฯ พระบรมราชินี',
    category: 'royal',
  },
  {
    month: 7,
    day: 28,
    name: 'วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระเจ้าอยู่หัว',
    category: 'royal',
  },
  {
    month: 8,
    day: 12,
    name: 'วันเฉลิมพระชนมพรรษาสมเด็จพระบรมราชชนนีพันปีหลวง และวันแม่แห่งชาติ',
    category: 'royal',
  },
  { month: 10, day: 13, name: 'วันนวมินทรมหาราช', category: 'royal' },
  { month: 10, day: 23, name: 'วันปิยมหาราช', category: 'royal' },
  {
    month: 12,
    day: 5,
    name: 'วันคล้ายวันพระบรมราชสมภพ ร.9 / วันชาติ / วันพ่อแห่งชาติ',
    category: 'royal',
  },
  { month: 12, day: 10, name: 'วันรัฐธรรมนูญ', category: 'national' },
  { month: 12, day: 31, name: 'วันสิ้นปี', category: 'national' },
];

// Official Thai Buddhist Lunar & Special Government Holidays by Gregorian Year (พ.ศ. 2567–2575)
const LUNAR_AND_SPECIAL_HOLIDAYS_BY_YEAR: Record<
  number,
  Array<{ month: number; day: number; name: string; category: ThaiHolidayCategory }>
> = {
  2024: [
    { month: 2, day: 24, name: 'วันมาฆบูชา', category: 'buddhist' },
    { month: 5, day: 10, name: 'วันพืชมงคล', category: 'royal' },
    { month: 5, day: 22, name: 'วันวิสาขบูชา', category: 'buddhist' },
    { month: 7, day: 20, name: 'วันอาสาฬหบูชา', category: 'buddhist' },
    { month: 7, day: 21, name: 'วันเข้าพรรษา', category: 'buddhist' },
  ],
  2025: [
    { month: 2, day: 12, name: 'วันมาฆบูชา', category: 'buddhist' },
    { month: 5, day: 9, name: 'วันพืชมงคล', category: 'royal' },
    { month: 5, day: 11, name: 'วันวิสาขบูชา', category: 'buddhist' },
    { month: 6, day: 2, name: 'วันหยุดราชการเพิ่มเป็นกรณีพิเศษ (มติ ครม.)', category: 'special' },
    { month: 7, day: 10, name: 'วันอาสาฬหบูชา', category: 'buddhist' },
    { month: 7, day: 11, name: 'วันเข้าพรรษา', category: 'buddhist' },
    { month: 8, day: 11, name: 'วันหยุดราชการเพิ่มเป็นกรณีพิเศษ (มติ ครม.)', category: 'special' },
  ],
  2026: [
    { month: 1, day: 2, name: 'วันหยุดราชการเพิ่มเป็นกรณีพิเศษ (มติ ครม.)', category: 'special' },
    { month: 3, day: 3, name: 'วันมาฆบูชา', category: 'buddhist' },
    { month: 5, day: 13, name: 'วันพืชมงคล', category: 'royal' },
    { month: 5, day: 31, name: 'วันวิสาขบูชา', category: 'buddhist' },
    { month: 7, day: 29, name: 'วันอาสาฬหบูชา', category: 'buddhist' },
    { month: 7, day: 30, name: 'วันเข้าพรรษา', category: 'buddhist' },
  ],
  2027: [
    { month: 2, day: 21, name: 'วันมาฆบูชา', category: 'buddhist' },
    { month: 5, day: 20, name: 'วันวิสาขบูชา', category: 'buddhist' },
    { month: 7, day: 18, name: 'วันอาสาฬหบูชา', category: 'buddhist' },
    { month: 7, day: 19, name: 'วันเข้าพรรษา', category: 'buddhist' },
  ],
  2028: [
    { month: 2, day: 10, name: 'วันมาฆบูชา', category: 'buddhist' },
    { month: 5, day: 8, name: 'วันวิสาขบูชา', category: 'buddhist' },
    { month: 7, day: 6, name: 'วันอาสาฬหบูชา', category: 'buddhist' },
    { month: 7, day: 7, name: 'วันเข้าพรรษา', category: 'buddhist' },
  ],
  2029: [
    { month: 2, day: 28, name: 'วันมาฆบูชา', category: 'buddhist' },
    { month: 5, day: 27, name: 'วันวิสาขบูชา', category: 'buddhist' },
    { month: 7, day: 25, name: 'วันอาสาฬหบูชา', category: 'buddhist' },
    { month: 7, day: 26, name: 'วันเข้าพรรษา', category: 'buddhist' },
  ],
  2030: [
    { month: 2, day: 17, name: 'วันมาฆบูชา', category: 'buddhist' },
    { month: 5, day: 17, name: 'วันวิสาขบูชา', category: 'buddhist' },
    { month: 7, day: 15, name: 'วันอาสาฬหบูชา', category: 'buddhist' },
    { month: 7, day: 16, name: 'วันเข้าพรรษา', category: 'buddhist' },
  ],
  2031: [
    { month: 3, day: 7, name: 'วันมาฆบูชา', category: 'buddhist' },
    { month: 5, day: 6, name: 'วันวิสาขบูชา', category: 'buddhist' },
    { month: 7, day: 4, name: 'วันอาสาฬหบูชา', category: 'buddhist' },
    { month: 7, day: 5, name: 'วันเข้าพรรษา', category: 'buddhist' },
  ],
  2032: [
    { month: 2, day: 25, name: 'วันมาฆบูชา', category: 'buddhist' },
    { month: 5, day: 24, name: 'วันวิสาขบูชา', category: 'buddhist' },
    { month: 7, day: 22, name: 'วันอาสาฬหบูชา', category: 'buddhist' },
    { month: 7, day: 23, name: 'วันเข้าพรรษา', category: 'buddhist' },
  ],
};

function buildBuiltInHolidaysWithSubstitutions(yearAD: number): DetectedThaiHoliday[] {
  // Include late Dec of previous year so Dec 31 on weekend properly substitutes into Jan
  const seedYears = [yearAD - 1, yearAD];
  const baseMap = new Map<string, DetectedThaiHoliday>();

  for (const y of seedYears) {
    for (const h of FIXED_THAI_GOV_HOLIDAYS) {
      if (y === yearAD - 1 && h.month !== 12) continue;
      const dateKey = formatDateKey(y, h.month, h.day);
      baseMap.set(dateKey, {
        dateKey,
        yearAD: y,
        month: h.month,
        day: h.day,
        name: h.name,
        category: h.category,
        isCustom: false,
      });
    }

    const lunarList = LUNAR_AND_SPECIAL_HOLIDAYS_BY_YEAR[y] || [];
    for (const h of lunarList) {
      if (y === yearAD - 1 && h.month !== 12) continue;
      const dateKey = formatDateKey(y, h.month, h.day);
      const existing = baseMap.get(dateKey);
      if (existing) {
        existing.name = `${existing.name} / ${h.name}`;
      } else {
        baseMap.set(dateKey, {
          dateKey,
          yearAD: y,
          month: h.month,
          day: h.day,
          name: h.name,
          category: h.category,
          isCustom: false,
        });
      }
    }
  }

  // Sort chronologically to compute substitution holidays (วันหยุดชดเชย)
  const orderedBase = Array.from(baseMap.values()).sort((a, b) =>
    a.dateKey.localeCompare(b.dateKey)
  );
  const occupiedKeys = new Set<string>(orderedBase.map((item) => item.dateKey));
  const fullMap = new Map<string, DetectedThaiHoliday>(baseMap);

  for (const item of orderedBase) {
    // Special Cabinet holidays are already explicitly placed on weekdays
    if (item.category === 'special') continue;

    const d = new Date(item.yearAD, item.month - 1, item.day);
    const dow = d.getDay();
    if (dow === 0 || dow === 6) {
      // Advance to the next weekday that isn't already an official holiday
      const sub = new Date(d);
      let safety = 0;
      while (safety < 14) {
        sub.setDate(sub.getDate() + 1);
        const subDow = sub.getDay();
        const subYear = sub.getFullYear();
        const subMonth = sub.getMonth() + 1;
        const subDay = sub.getDate();
        const subKey = formatDateKey(subYear, subMonth, subDay);

        if (subDow !== 0 && subDow !== 6 && !occupiedKeys.has(subKey)) {
          occupiedKeys.add(subKey);
          fullMap.set(subKey, {
            dateKey: subKey,
            yearAD: subYear,
            month: subMonth,
            day: subDay,
            name: `วันหยุดชดเชย${item.name}`,
            category: 'substitute',
            isCustom: false,
          });
          break;
        }
        safety += 1;
      }
    }
  }

  return Array.from(fullMap.values())
    .filter((item) => item.yearAD === yearAD)
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey));
}

export function checkThaiMonthHolidays(
  yearAD: number,
  month: number,
  customHolidays: CustomThaiHoliday[] = []
): ThaiMonthHolidayReport {
  const weekends = getWeekendDays(yearAD, month);
  const builtInForMonth = buildBuiltInHolidaysWithSubstitutions(yearAD).filter(
    (h) => h.month === month
  );

  const mergedByDay = new Map<number, DetectedThaiHoliday>();
  for (const item of builtInForMonth) {
    mergedByDay.set(item.day, item);
  }

  // Merge user-added custom Thai holidays (custom overrides or appends cleanly)
  const customForMonth = customHolidays.filter(
    (c) => c.yearAD === yearAD && c.month === month
  );
  for (const c of customForMonth) {
    mergedByDay.set(c.day, {
      id: c.id,
      dateKey: c.dateKey,
      yearAD: c.yearAD,
      month: c.month,
      day: c.day,
      name: c.name,
      category: c.category,
      isCustom: true,
    });
  }

  const thaiHolidays = Array.from(mergedByDay.values()).sort((a, b) => a.day - b.day);
  const allHolidayDays = Array.from(
    new Set([...weekends, ...thaiHolidays.map((h) => h.day)])
  ).sort((a, b) => a - b);

  return {
    yearAD,
    month,
    weekends,
    thaiHolidays,
    allHolidayDays,
    hasLunarCoverage: Boolean(LUNAR_AND_SPECIAL_HOLIDAYS_BY_YEAR[yearAD]),
  };
}
