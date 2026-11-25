import {
  RosterStaff,
  RosterAdminMonth,
  RosterPublicMonth,
  RosterConfig,
} from '../types/portal';

export const THAI_MONTHS = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];

export const THAI_DAYS_SHORT = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

export function getDaysInMonth(yearAD: number, month: number): number {
  return new Date(yearAD, month, 0).getDate();
}

export function getDayOfWeek(yearAD: number, month: number, day: number): number {
  return new Date(yearAD, month - 1, day).getDay();
}

export function getWeekendDays(yearAD: number, month: number): number[] {
  const totalDays = getDaysInMonth(yearAD, month);
  const weekends: number[] = [];
  for (let d = 1; d <= totalDays; d++) {
    const dow = getDayOfWeek(yearAD, month, d);
    if (dow === 0 || dow === 6) {
      weekends.push(d);
    }
  }
  return weekends;
}

export function formatMonthKey(yearAD: number, month: number): string {
  return `${yearAD}-${String(month).padStart(2, '0')}`;
}

export function formatThaiMonthYear(yearAD: number, month: number): string {
  const monthName = THAI_MONTHS[month - 1] || '';
  return `${monthName} ${yearAD + 543}`;
}

export function stripSecretRatesToPublic(adminMonth: RosterAdminMonth): RosterPublicMonth {
  return {
    monthKey: adminMonth.monthKey,
    yearAD: adminMonth.yearAD,
    month: adminMonth.month,
    title: adminMonth.title,
    holidays: [...adminMonth.holidays].sort((a, b) => a - b),
    rows: [...adminMonth.rows]
      .sort((a, b) => a.order - b.order)
      .map((r) => ({
        staffId: r.staffId,
        name: r.name,
        position: r.position,
        order: r.order,
        morningDays: [...r.morningDays].sort((a, b) => a - b),
        afternoonDays: [...r.afternoonDays].sort((a, b) => a - b),
      })),
    isPublished: true,
    note: adminMonth.note || '',
    updatedAt: adminMonth.updatedAt,
  };
}

export const INITIAL_ROSTER_CONFIG: RosterConfig = {
  id: 'default',
  departmentTitle: 'ตารางปฏิบัติงานนอกเวลาราชการ กลุ่มงานเภสัชกรรมและคุ้มครองผู้บริโภค',
  morningLabel: '1 ช หมายถึง เวลาปฏิบัติงานในช่วงเวลา 8.00 – 16.00 น.',
  afternoonLabel: '2 บ หมายถึง เวลาปฏิบัติงานในช่วงเวลา 16.01 – 20.00 น.',
  leftSignatoryName: 'นายศักดิ์ชาย ชัติยา',
  leftSignatoryPosition: 'เภสัชกรชำนาญการพิเศษ',
  leftSignatoryRole: 'หัวหน้ากลุ่มงานเภสัชกรรมและคุ้มครองผู้บริโภค',
  rightSignatoryName: 'นายสุริยา ด่างน้ำเที่ยง',
  rightSignatoryPosition: 'นายแพทย์ชำนาญการพิเศษ (ด้านเวชกรรม)',
  rightSignatoryRole: 'รักษาการในตำแหน่งผู้อำนวยการโรงพยาบาลห้วยเกิ้ง',
};

export const INITIAL_ROSTER_STAFF: RosterStaff[] = [
  {
    id: 'staff-1',
    name: 'นายธีรดนย์ พลค้อ',
    position: 'เภสัชกร ชำนาญการ',
    morningRate: 780,
    afternoonRate: 390,
    order: 1,
    isActive: true,
  },
  {
    id: 'staff-2',
    name: 'นายอติชาติ โพธิผล',
    position: 'เภสัชกร',
    morningRate: 780,
    afternoonRate: 390,
    order: 2,
    isActive: true,
  },
  {
    id: 'staff-3',
    name: 'นายจีรัฏฐ์ เกตะวันดี',
    position: 'เภสัชกร',
    morningRate: 780,
    afternoonRate: 390,
    order: 3,
    isActive: true,
  },
  {
    id: 'staff-4',
    name: 'นส. ณิชากร โสภารัตน์',
    position: 'เจ้าพนักงานเภสัชกรรม',
    morningRate: 520,
    afternoonRate: 260,
    order: 4,
    isActive: true,
  },
];

// ตารางปฏิบัติงานนอกเวลาราชการ ประจำเดือน ตุลาคม 2569 (Oct 2026) จากเอกสารอ้างอิง
export const INITIAL_ROSTER_ADMIN_OCT_2026: RosterAdminMonth = {
  monthKey: '2026-10',
  yearAD: 2026,
  month: 10,
  title: 'ตารางปฏิบัติงานนอกเวลาราชการ กลุ่มงานเภสัชกรรมและคุ้มครองผู้บริโภค',
  holidays: [3, 4, 10, 11, 13, 17, 18, 23, 24, 25, 31],
  isPublished: true,
  note: '',
  updatedAt: '2026-10-01T00:00:00.000Z',
  rows: [
    {
      staffId: 'staff-1',
      name: 'นายธีรดนย์ พลค้อ',
      position: 'เภสัชกร ชำนาญการ',
      order: 1,
      morningRate: 780,
      afternoonRate: 390,
      morningDays: [17, 18, 31],
      afternoonDays: [8, 9, 19, 20, 26],
    },
    {
      staffId: 'staff-2',
      name: 'นายอติชาติ โพธิผล',
      position: 'เภสัชกร',
      order: 2,
      morningRate: 780,
      afternoonRate: 390,
      morningDays: [10, 11, 13],
      afternoonDays: [12, 14, 15, 16, 30],
    },
    {
      staffId: 'staff-3',
      name: 'นายจีรัฏฐ์ เกตะวันดี',
      position: 'เภสัชกร',
      order: 3,
      morningRate: 780,
      afternoonRate: 390,
      morningDays: [23, 24, 25],
      afternoonDays: [21, 22, 27, 28, 29],
    },
    {
      staffId: 'staff-4',
      name: 'นส. ณิชากร โสภารัตน์',
      position: 'เจ้าพนักงานเภสัชกรรม',
      order: 4,
      morningRate: 520,
      afternoonRate: 260,
      morningDays: [3, 4],
      afternoonDays: [1, 2, 5, 6, 7],
    },
  ],
};

// ตารางปฏิบัติงานนอกเวลาราชการ ประจำเดือน พฤศจิกายน 2569 (Nov 2026 - current month)
export const INITIAL_ROSTER_ADMIN_NOV_2026: RosterAdminMonth = {
  monthKey: '2026-11',
  yearAD: 2026,
  month: 11,
  title: 'ตารางปฏิบัติงานนอกเวลาราชการ กลุ่มงานเภสัชกรรมและคุ้มครองผู้บริโภค',
  holidays: [1, 7, 8, 14, 15, 21, 22, 28, 29],
  isPublished: true,
  note: '',
  updatedAt: '2026-11-01T00:00:00.000Z',
  rows: [
    {
      staffId: 'staff-1',
      name: 'นายธีรดนย์ พลค้อ',
      position: 'เภสัชกร ชำนาญการ',
      order: 1,
      morningRate: 780,
      afternoonRate: 390,
      morningDays: [1, 14, 15],
      afternoonDays: [2, 3, 4, 16, 17],
    },
    {
      staffId: 'staff-2',
      name: 'นายอติชาติ โพธิผล',
      position: 'เภสัชกร',
      order: 2,
      morningRate: 780,
      afternoonRate: 390,
      morningDays: [7, 8, 28],
      afternoonDays: [5, 6, 9, 10, 11],
    },
    {
      staffId: 'staff-3',
      name: 'นายจีรัฏฐ์ เกตะวันดี',
      position: 'เภสัชกร',
      order: 3,
      morningRate: 780,
      afternoonRate: 390,
      morningDays: [21, 22, 29],
      afternoonDays: [12, 13, 18, 19, 20],
    },
    {
      staffId: 'staff-4',
      name: 'นส. ณิชากร โสภารัตน์',
      position: 'เจ้าพนักงานเภสัชกรรม',
      order: 4,
      morningRate: 520,
      afternoonRate: 260,
      morningDays: [],
      afternoonDays: [23, 24, 25, 26, 27, 30],
    },
  ],
};

export const INITIAL_ROSTER_PUBLIC_OCT_2026: RosterPublicMonth = stripSecretRatesToPublic(
  INITIAL_ROSTER_ADMIN_OCT_2026
);

export const INITIAL_ROSTER_PUBLIC_NOV_2026: RosterPublicMonth = stripSecretRatesToPublic(
  INITIAL_ROSTER_ADMIN_NOV_2026
);
