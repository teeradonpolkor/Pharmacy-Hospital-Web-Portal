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
