import { AppItem, Category, Announcement, PortalSettings } from '../types/portal';

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
  // งานบริหารเวชภัณฑ์ยา
  {
    id: 'app-inv-1',
    categoryId: 'cat-inventory',
    title: 'ระบบเบิกจ่ายและโอนย้ายเวชภัณฑ์ยา',
    description: 'Drug Requisition & Stock Transfer - บันทึกและอนุมัติการเบิกเวชภัณฑ์ยาประจำวันของหอผู้ป่วยและหน่วยงาน',
    url: 'https://script.google.com/macros/s/AKfycbx35euibHYX4-2KHQrpuKCcQlwv7npX3cNHP4bVEwPLNa6-iC9m8XIOBoJv8AVyAeTcbA/exec',
    iconName: 'Boxes',
    tag: 'คลังยาและเบิกจ่าย',
    status: 'online',
    isFavorite: true,
  },
  {
    id: 'app-inv-2',
    categoryId: 'cat-inventory',
    title: 'ระบบตรวจนับคลังยาและรายงานคงคลัง',
    description: 'Inventory Audit & Stock Balance - ตรวจนับสต็อกยาจริงประจำงวด ตรวจสอบยอดคงเหลือ และวิเคราะห์มูลค่าคลัง',
    url: 'https://script.google.com/macros/s/AKfycbzEbj5NHKdBNa8NAz16S9ixZsluyI5CvSnQ7ewlbpobJXOjfNXI4e60f-BRzfcv_AlF6w/exec',
    iconName: 'ClipboardCheck',
    tag: 'ตรวจนับสต็อก',
    status: 'online',
    isFavorite: false,
  },
  {
    id: 'app-inv-3',
    categoryId: 'cat-inventory',
    title: 'ระบบแจ้งเตือนยาหมดอายุ (LINE/Telegram)',
    description: 'AppSheet + Google Script Auto Notification - ตรวจสอบวันหมดอายุล่วงหน้า 30-90 วัน และส่งการแจ้งเตือนอัตโนมัติ',
    url: 'https://script.google.com/macros/s/AKfycbx_8NTJGp1Tg5_15eeCNhBuDnHwnGUmUTjD5OaduAwC9aBfRH4nXuWkdgOS7KYtG8rXTA/exec#expiry-bot',
    iconName: 'BellRing',
    tag: 'AppSheet + Alert Bot',
    status: 'online',
    isFavorite: true,
  },
  {
    id: 'app-inv-4',
    categoryId: 'cat-inventory',
    title: 'ระบบจัดซื้อและติดตามใบสั่งซื้อเวชภัณฑ์',
    description: 'Procurement & PO Tracking System - ติดตามสถานะใบสั่งซื้อยา (PO) ทะเบียนคุมราคา และประเมินการส่งมอบยา',
    url: 'https://script.google.com/macros/s/AKfycbx_8NTJGp1Tg5_15eeCNhBuDnHwnGUmUTjD5OaduAwC9aBfRH4nXuWkdgOS7KYtG8rXTA/exec',
    iconName: 'FileSpreadsheet',
    tag: 'จัดซื้อยา',
    status: 'online',
    isFavorite: false,
  },

  // งานบริบาลทางเภสัชกรรม
  {
    id: 'app-clin-1',
    categoryId: 'cat-clinical',
    title: 'ระบบบันทึกการบริบาลทางเภสัชกรรม',
    description: 'Clinical Pharmacist Notes & Consultation - บันทึกการบริบาลผู้ป่วยใน/ผู้ป่วยนอก การให้คำปรึกษา และการแก้ไข DRPs',
    url: 'https://script.google.com/macros/s/AKfycbxUvJpCxp-Ifkh3xNWdFZb21q9bFdP2JZgOxye5NYGTASXRjOKwKSkUI-WKOrvzUEegzw/exec',
    iconName: 'Stethoscope',
    tag: 'บริบาลคลินิก',
    status: 'online',
    isFavorite: true,
  },
  {
    id: 'app-clin-2',
    categoryId: 'cat-clinical',
    title: 'ระบบรายงานอาการไม่พึงประสงค์จากการใช้ยา (ADR)',
    description: 'Adverse Drug Reaction & Safety Registry - เฝ้าระวัง บันทึกประวัติการแพ้ยา ประเมินระดับความรุนแรง และออกบัตรแพ้ยา',
    url: 'https://script.google.com/macros/s/AKfycbyBM2jpIoMZ1WL5-SseGjxLoBf1I_DVk84ZVQe4DJFow_cwabnAtX54mss9EnhsWeFh/exec',
    iconName: 'ShieldAlert',
    tag: 'ความปลอดภัยผู้ป่วย',
    status: 'online',
    isFavorite: false,
  },

  // งานผลิตยาสมุนไพร
  {
    id: 'app-herb-1',
    categoryId: 'cat-herbal',
    title: 'ระบบควบคุมรุ่นการผลิตและสูตรตำรับยาสมุนไพร',
    description: 'Herbal Medicine Batch Record & QC Master - จัดการสูตรตำรับสมุนไพร ควบคุมกระบวนการผลิต GMP และตรวจสอบคุณภาพก่อนปล่อยผ่าน',
    url: 'https://script.google.com/macros/s/AKfycbxfXoH2gwoVQBG7OOlptmc3suMXS_K4-0Y_QbkwqHShKmlK5FTVUj3xpg83Nb_Vgd_U/exec',
    iconName: 'FlaskConical',
    tag: 'ผลิตยาสมุนไพร GMP',
    status: 'online',
    isFavorite: true,
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
  pin: '1234',
  hospitalName: 'กลุ่มงานเภสัชกรรมและคุ้มครองผู้บริโภค',
  departmentName: 'Pharmacy Service & Healthcare Digital Portal',
  subtitle: 'ศูนย์รวมระบบงานดิจิทัล คลังยา งานบริบาล และงานผลิตสมุนไพร',
};
