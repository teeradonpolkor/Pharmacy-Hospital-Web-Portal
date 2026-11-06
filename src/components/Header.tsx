import React, { useState, useEffect } from 'react';
import {
  Lock,
  Unlock,
  Plus,
  Settings,
  Bookmark,
  Clock,
} from 'lucide-react';
import { PortalSettings } from '../types/portal';

interface HeaderProps {
  settings: PortalSettings;
  isAdminUnlocked: boolean;
  onOpenPinModal: () => void;
  onLockAdmin: () => void;
  onOpenManageModal: () => void;
  onOpenAddNewApp: () => void;
  totalApps: number;
  onlineApps: number;
  favoriteCount: number;
  showFavoritesOnly: boolean;
  onToggleFavoritesOnly: () => void;
  onFocusSearch: () => void;
  isCloudSynced?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  isAdminUnlocked,
  onOpenPinModal,
  onLockAdmin,
  onOpenManageModal,
  onOpenAddNewApp,
  totalApps,
  onlineApps,
  favoriteCount,
  showFavoritesOnly,
  onToggleFavoritesOnly,
}) => {
  const [timeString, setTimeString] = useState<string>('');
  const [dateString, setDateString] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString('th-TH', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
      setDateString(
        now.toLocaleDateString('th-TH', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#E6D5B7]/85 border-b border-[#1E223D]/10 transition-colors shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Brand & Hospital Unit */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-[#1E223D] border border-[#1E223D]/20 flex items-center justify-center shadow-md shadow-[#1E223D]/10 shrink-0">
              <span className="text-xl font-bold text-[#E6D5B7]">
                ℞
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-[#1E223D] truncate">
                  {settings.hospitalName}
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#1E223D]/10 text-[#1E223D] border border-[#1E223D]/15 whitespace-nowrap">
                  Pharmacy Portal
                </span>
              </div>
              <p className="text-xs text-[#4B5277] truncate font-medium">
                {settings.subtitle}
              </p>
            </div>
          </div>

          {/* Quick Metrics & Live Time (Desktop) */}
          <div className="hidden lg:flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/70 border border-[#1E223D]/10 text-[#1E223D] shadow-xs">
              <Clock className="w-3.5 h-3.5 text-[#F54F1B]" />
              <span className="text-[#4B5277]">{dateString}</span>
              <span className="font-mono text-[#1E223D] font-semibold">{timeString}</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/70 border border-[#1E223D]/10 text-[#1E223D] shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
              </span>
              <span className="text-[#4B5277]">พร้อมใช้งาน:</span>
              <span className="font-semibold text-[#1E223D]">{onlineApps}/{totalApps} ระบบ</span>
            </div>

            <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/70 border border-[#1E223D]/10 text-xs shadow-xs" title="เชื่อมต่อฐานข้อมูล Google Firebase Firestore แบบ Real-time เรียบร้อยแล้ว">
              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[#4B5277]">ฐานข้อมูลกลาง:</span>
              <span className="font-semibold text-emerald-800">Cloud Sync (Realtime)</span>
            </div>
          </div>

          {/* Actions: Favorites Toggle & Admin Controls */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Quick Favorites Toggle */}
            <button
              onClick={onToggleFavoritesOnly}
              className={`p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                showFavoritesOnly
                  ? 'bg-[#F54F1B] text-white shadow-md shadow-[#F54F1B]/25'
                  : 'bg-white/80 text-[#1E223D] hover:bg-white hover:text-[#F54F1B] border border-[#1E223D]/10 shadow-xs'
              }`}
              title="แสดงเฉพาะแอปที่ติดดาว (Favorites)"
            >
              <Bookmark className={`w-4 h-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
              <span className="hidden sm:inline">ที่ใช้บ่อย</span>
              {favoriteCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                  showFavoritesOnly ? 'bg-white/20 text-white' : 'bg-[#1E223D]/10 text-[#1E223D] font-bold'
                }`}>
                  {favoriteCount}
                </span>
              )}
            </button>

            {/* Admin Management / PIN Button */}
            {isAdminUnlocked ? (
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/80 border border-[#1E223D]/15 shadow-xs">
                <button
                  onClick={onOpenAddNewApp}
                  className="px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#F54F1B] text-white hover:bg-[#e04514] transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">เพิ่มแอป</span>
                </button>
                <button
                  onClick={onOpenManageModal}
                  className="px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium text-[#1E223D] hover:bg-[#1E223D]/10 transition-colors flex items-center gap-1.5"
                  title="การตั้งค่าระบบและจัดการแอปทั้งหมด"
                >
                  <Settings className="w-3.5 h-3.5 text-[#F54F1B]" />
                  <span className="hidden md:inline">จัดการข้อมูล</span>
                </button>
                <button
                  onClick={onLockAdmin}
                  className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-500/10 transition-colors"
                  title="ล็อกโหมดผู้ดูแลระบบ"
                >
                  <Unlock className="w-4 h-4 text-emerald-600" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenPinModal}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#1E223D] hover:bg-[#2A3159] text-white transition-all flex items-center gap-2 group shadow-sm"
              >
                <Lock className="w-3.5 h-3.5 text-[#E6D5B7] group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline">จัดการระบบ (PIN)</span>
                <span className="sm:hidden">จัดการ</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
