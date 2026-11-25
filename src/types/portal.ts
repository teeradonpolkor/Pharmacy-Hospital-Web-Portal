export type AppStatus = 'online' | 'maintenance' | 'updated';

export interface AppItem {
  id: string;
  categoryId: string;
  title: string;
  description: string;
  url: string;
  iconName: string;
  tag: string;
  status: AppStatus;
  isFavorite?: boolean;
  createdAt?: string;
  updatedAt?: string;
  openMode?: 'new_tab' | 'modal_frame';
}

export interface Category {
  id: string;
  name: string;
  description: string;
  iconName: string;
  accentColor?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  type: 'urgent' | 'info' | 'update';
  isPinned?: boolean;
}

export interface PortalSettings {
  pin: string;
  hospitalName: string;
  departmentName: string;
  subtitle: string;
}

// --- Shift Roster (ตารางปฏิบัติงานนอกเวลาราชการ) ---

export interface RosterStaff {
  id: string;
  name: string;
  position: string;
  morningRate: number; // เวรละ (ช) 08.00 - 16.00 น. - CONFIDENTIAL (Admin only)
  afternoonRate: number; // เวรละ (บ) 16.01 - 20.00 น. - CONFIDENTIAL (Admin only)
  order: number;
  isActive: boolean;
}

export interface RosterPublicRow {
  staffId: string;
  name: string;
  position: string;
  order: number;
  morningDays: number[];
  afternoonDays: number[];
}

export interface RosterPublicMonth {
  monthKey: string; // "YYYY-MM" e.g. "2026-10"
  yearAD: number;
  month: number; // 1..12
  title: string;
  holidays: number[];
  rows: RosterPublicRow[];
  isPublished: boolean;
  note?: string;
  updatedAt: string;
}

export interface RosterAdminRow extends RosterPublicRow {
  morningRate: number; // CONFIDENTIAL
  afternoonRate: number; // CONFIDENTIAL
}

export interface RosterAdminMonth {
  monthKey: string; // "YYYY-MM"
  yearAD: number;
  month: number; // 1..12
  title: string;
  holidays: number[];
  rows: RosterAdminRow[];
  isPublished: boolean;
  note?: string;
  updatedAt: string;
}

export interface RosterConfig {
  id: string;
  departmentTitle: string;
  morningLabel: string;
  afternoonLabel: string;
  leftSignatoryName: string;
  leftSignatoryPosition: string;
  leftSignatoryRole: string;
  rightSignatoryName: string;
  rightSignatoryPosition: string;
  rightSignatoryRole: string;
}
