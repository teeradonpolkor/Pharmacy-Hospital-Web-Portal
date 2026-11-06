import { AppItem, Category, Announcement, PortalSettings } from '../types/portal';

export const DATA_VERSION = '2026-11-06_v2';

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'cat-inventory',
    name: 'งานบริหารเวชภัณฑ์ยา',
    description: 'ระบบบริหารจัดการคลังยา คลังเวชภัณฑ์ การจัดซื้อ ตรวจนับ และเบิกจ่าย',
    iconName: 'Package',
    accentColor: '#F54F1B',
  },
  {
    id: 'cat-clinical',
    name: 'งานบริบาลทางเภสัชกรรม',
    description: 'ระบบบันทึกงานบริบาลทางคลินิก การประเมินผู้ป่วย และเฝ้าระวังความปลอดภัยด้านยา',
    iconName: 'Stethoscope',
    accentColor: '#38BDF8',
  },
  {
    id: 'cat-herbal',
    name: 'งานผลิตยาสมุนไพร',
    description: 'ระบบควบคุมตำรับ มาตรฐานการผลิตยาสมุนไพร GMP และบันทึกรุ่นผลิต',
    iconName: 'Leaf',
    accentColor: '#34D399',
  },
];

export const INITIAL_APPS: AppItem[] = [
  // 1. งานบริหารเวชภัณฑ์ยา
  {
    id: 'app-inv-1',
    categoryId: 'cat-inventory',
    title: 'ระบบบริหารเวชภัณฑ์ยาและมิใช่ยา',
    description: 'Drug Requisition & Stock Transfer - บันทึกและอนุมัติการเบิกเวชภัณฑ์ยาหน่วยงาน',
    url: 'https://script.google.com/macros/s/AKfycbx35euibHYX4-2KHQrpuKCcQlwv7npX3cNHP4bVEwPLNa6-iC9m8XIOBoJv8AVyAeTcbA/exec',
    iconName: 'Boxes',
    tag: 'คลังยาและเบิกจ่าย',
    status: 'online',
    isFavorite: true,
    updatedAt: '2026-11-06T04:29:57.670Z',
  },
  {
    id: 'app-inv-2',
    categoryId: 'cat-inventory',
    title: 'ระบบบริหารเวชภัฑณ์ยาห้องอุบัติเหตุและฉุกเฉิน',
    description: 'Inventory Audit & Stock Balance - Emergency Room',
    url: 'https://script.google.com/macros/s/AKfycbzEbj5NHKdBNa8NAz16S9ixZsluyI5CvSnQ7ewlbpobJXOjfNXI4e60f-BRzfcv_AlF6w/exec',
    iconName: 'ClipboardCheck',
    tag: 'ตรวจนับสต็อก',
    status: 'online',
    isFavorite: false,
    updatedAt: '2026-11-06T04:31:50.908Z',
  },
  {
    id: 'app-inv-3',
    categoryId: 'cat-inventory',
    title: 'ระบบแจ้งเตือนยาหมดอายุ (LINE/Telegram)',
    description: 'AppSheet + Google Script Auto Notification - ตรวจสอบวันหมดอายุล่วงหน้า 30-90 วัน และส่งการแจ้งเตือนอัตโนมัติ',
    url: 'https://www.appsheet.com/newshortcut/c35b2447-eebc-4233-863f-d4806cccc38f',
    iconName: 'BellRing',
    tag: 'AppSheet + Alert Bot',
    status: 'online',
    isFavorite: true,
    updatedAt: '2026-11-06T04:36:11.896Z',
  },
  {
    id: 'app-inv-4',
    categoryId: 'cat-inventory',
    title: 'Stock & Expiry Alert : ระบบป้องกันและตรวจสอบความพร้อมใช้ของยาบนหอผู้ป่วย',
    description: 'ระบบป้องกันและตรวจสอบความพร้อมใช้ของยาบนหอผู้ป่วย',
    url: 'https://script.google.com/macros/s/AKfycbx_8NTJGp1Tg5_15eeCNhBuDnHwnGUmUTjD5OaduAwC9aBfRH4nXuWkdgOS7KYtG8rXTA/exec',
    iconName: 'FileSpreadsheet',
    tag: 'จัดซื้อยา',
    status: 'online',
    isFavorite: false,
    updatedAt: '2026-11-06T04:37:53.126Z',
  },

  // 2. งานบริบาลทางเภสัชกรรม
  {
    id: 'app-clin-1',
    categoryId: 'cat-clinical',
    title: 'ระบบติดตามผู้ป่วย',
    description: 'ระบบติดตามผู้ป่วย',
    url: 'https://script.google.com/macros/s/AKfycbxUvJpCxp-Ifkh3xNWdFZb21q9bFdP2JZgOxye5NYGTASXRjOKwKSkUI-WKOrvzUEegzw/exec',
    iconName: 'Stethoscope',
    tag: 'บริบาลคลินิก',
    status: 'online',
    isFavorite: true,
    updatedAt: '2026-11-06T04:39:03.165Z',
  },
  {
    id: 'app-clin-2',
    categoryId: 'cat-clinical',
    title: 'ระบบรายงานความคลาดเคลื่อนทางยา',
    description: 'รายงานความคลาดเคลื่อนทางยา',
    url: 'https://script.google.com/macros/s/AKfycbyBM2jpIoMZ1WL5-SseGjxLoBf1I_DVk84ZVQe4DJFow_cwabnAtX54mss9EnhsWeFh/exec',
    iconName: 'ShieldAlert',
    tag: 'ความปลอดภัยผู้ป่วย',
    status: 'online',
    isFavorite: false,
    updatedAt: '2026-11-06T04:40:06.892Z',
  },

  // 3. งานผลิตยาสมุนไพร
  {
    id: 'app-herb-1',
    categoryId: 'cat-herbal',
    title: 'ระบบบริหารคลังโรงงานผลิตยาสมุนไพร',
    description: 'บริหารคลังโรงงานผลิตยาสมุนไพร',
    url: 'https://script.google.com/macros/s/AKfycbxfXoH2gwoVQBG7OOlptmc3suMXS_K4-0Y_QbkwqHShKmlK5FTVUj3xpg83Nb_Vgd_U/exec',
    iconName: 'FlaskConical',
    tag: 'ผลิตยาสมุนไพร GMP',
    status: 'online',
    isFavorite: true,
    updatedAt: '2026-11-06T04:42:04.371Z',
  },
];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    title: 'กำหนดการส่งใบเบิกยาประจำสัปดาห์',
    content: 'ทุกหอผู้ป่วยและหน่วยงานกรุณาส่งใบเบิกยาเข้าระบบภายในวันพฤหัสบดี เวลา 16:00 น. เพื่อให้คลังยาจัดเตรียมยาตามรอบปกติ',
    date: 'วันนี้',
    type: 'info',
    isPinned: true,
  },
  {
    id: 'ann-2',
    title: 'ระบบแจ้งเตือนยาหมดอายุ (LINE Notification) เปิดใช้งานแล้ว',
    content: 'เปิดระบบเชื่อมโยงข้อมูล AppSheet กับ LINE Notify ห้องยา เพื่อแจ้งเตือนยาที่จะหมดอายุภายใน 60 วันโดยอัตโนมัติทุกเช้า 08:30 น.',
    date: 'อัปเดตล่าสุด',
    type: 'update',
    isPinned: false,
  },
  {
    id: 'ann-3',
    title: 'ประกาศปรับปรุงระบบประจำเดือน (Scheduled Maintenance)',
    content: 'Google Apps Script บางส่วนอาจมีการปิดปรับปรุงชั่วคราวในวันอาทิตย์ที่ 15 ของเดือน เวลา 22:00 - 23:00 น.',
    date: 'สำคัญ',
    type: 'urgent',
    isPinned: false,
  },
];

export const INITIAL_SETTINGS: PortalSettings = {
  pin: '1994',
  hospitalName: 'กลุ่มงานเภสัชกรรมและคุ้มครองผู้บริโภค',
  departmentName: 'Pharmacy Service & Healthcare Digital Portal',
  subtitle: 'โรงพยาบาลห้วยเกิ้ง อำเภอ กุมภวาปี จังหวัด อุดรธานี',
};
