import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  QrCode,
  ArrowUpRight,
} from 'lucide-react';
import { AppItem, Category } from '../types/portal';
import { DynamicIcon } from './DynamicIcon';

interface AppDetailModalProps {
  app: AppItem | null;
  category?: Category;
  onClose: () => void;
  onEdit?: (app: AppItem) => void;
  isAdminUnlocked: boolean;
}

export const AppDetailModal: React.FC<AppDetailModalProps> = ({
  app,
  category,
  onClose,
  onEdit,
  isAdminUnlocked,
}) => {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  if (!app) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(app.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLaunch = () => {
    window.open(app.url, '_blank', 'noopener,noreferrer');
  };

  // QR code URL for mobile scanning
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    app.url
  )}&bgcolor=FFFFFF&color=1E223D&margin=1`;

  const isOnline = app.status === 'online';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E223D]/50 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-xl p-6 sm:p-8 rounded-3xl bg-white/95 backdrop-blur-2xl overflow-hidden border border-[#1E223D]/15 shadow-2xl"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[#4B5277] hover:text-[#1E223D] hover:bg-[#1E223D]/5 transition-colors"
          aria-label="ปิดหน้าต่าง"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Section */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-[#1E223D] border border-[#1E223D]/20 flex items-center justify-center text-[#E6D5B7] shadow-lg shadow-[#1E223D]/15 shrink-0">
            <DynamicIcon name={app.iconName} className="w-8 h-8" />
          </div>

          <div className="min-w-0 pr-6">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E6D5B7] text-[#1E223D] border border-[#1E223D]/10">
                {category?.name || 'หมวดหมู่ทั่วไป'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#1E223D]/5 text-[#4B5277]">
                {app.tag}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                  isOnline
                    ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                    : 'text-amber-800 bg-amber-50 border border-amber-200'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {isOnline ? 'Online (พร้อมใช้งาน)' : 'ปิดปรับปรุง'}
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-[#1E223D] tracking-tight leading-snug">
              {app.title}
            </h3>
          </div>
        </div>

        {/* Content & Description */}
        <div className="space-y-4 mb-6">
          <div className="p-4 rounded-2xl bg-[#F4EFE6] border border-[#1E223D]/10">
            <h4 className="text-xs font-bold text-[#F54F1B] uppercase tracking-wider mb-2">
              รายละเอียดและการทำงาน
            </h4>
            <p className="text-sm text-[#4B5277] leading-relaxed">
              {app.description}
            </p>
          </div>

          {/* URL Box */}
          <div className="p-3.5 rounded-2xl bg-[#F4EFE6] border border-[#1E223D]/10 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <span className="text-[10px] text-[#4B5277] uppercase font-bold tracking-wider block mb-0.5">
                Target URL (Google Apps Script / Web App)
              </span>
              <p className="text-xs font-mono text-[#1E223D] font-semibold truncate select-all">
                {app.url}
              </p>
            </div>
            <button
              onClick={handleCopyLink}
              className="p-2 rounded-xl text-[#4B5277] hover:text-[#1E223D] hover:bg-[#1E223D]/5 transition-colors shrink-0"
              title="คัดลอกลิงก์"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* QR Code toggle for mobile ward rounds / devices */}
          {showQr && (
            <div className="p-4 rounded-2xl bg-[#F9F5EE] border border-[#1E223D]/10 flex flex-col items-center text-center animate-fade-in shadow-inner">
              <p className="text-xs text-[#1E223D] mb-3 font-semibold">
                สแกน QR Code ด้วยสมาร์ทโฟนหรือแท็บเล็ตเพื่อเปิดแอปพลิเคชันทันที
              </p>
              <div className="p-3 rounded-xl bg-white border border-[#1E223D]/15 shadow-md">
                <img
                  src={qrCodeUrl}
                  alt="QR Code"
                  className="w-44 h-44 object-contain rounded-lg"
                  loading="lazy"
                />
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#1E223D]/10">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowQr(!showQr)}
              className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-[#F4EFE6] hover:bg-[#E6D5B7] text-[#1E223D] border border-[#1E223D]/10 transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <QrCode className="w-4 h-4 text-[#F54F1B]" />
              <span>{showQr ? 'ซ่อน QR Code' : 'แสดง QR Code'}</span>
            </button>

            {isAdminUnlocked && onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(app);
                }}
                className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-white hover:bg-[#F4EFE6] text-[#F54F1B] border border-[#F54F1B]/30 transition-colors flex items-center justify-center gap-2 shadow-xs"
              >
                <span>แก้ไขข้อมูลแอป</span>
              </button>
            )}
          </div>

          <button
            onClick={handleLaunch}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#F54F1B] hover:bg-[#e04514] text-white text-sm font-semibold shadow-md shadow-[#F54F1B]/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 group"
          >
            <span>เข้าสู่ระบบงาน (เปิดแท็บใหม่)</span>
            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
