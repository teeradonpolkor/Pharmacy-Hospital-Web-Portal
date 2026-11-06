import React, { useState } from 'react';
import {
  ExternalLink,
  Star,
  Copy,
  Check,
  Edit3,
  ArrowUpRight,
} from 'lucide-react';
import { AppItem, Category } from '../types/portal';
import { DynamicIcon } from './DynamicIcon';

interface AppCardProps {
  app: AppItem;
  category?: Category;
  isAdminUnlocked: boolean;
  onEdit: (app: AppItem) => void;
  onToggleFavorite: (id: string) => void;
  onSelectDetail: (app: AppItem) => void;
}

export const AppCard: React.FC<AppCardProps> = ({
  app,
  category,
  isAdminUnlocked,
  onEdit,
  onToggleFavorite,
  onSelectDetail,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(app.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLaunch = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(app.url, '_blank', 'noopener,noreferrer');
  };

  const isOnline = app.status === 'online';
  const isMaintenance = app.status === 'maintenance';

  return (
    <div
      onClick={() => onSelectDetail(app)}
      className="group relative flex flex-col justify-between p-5 sm:p-6 rounded-3xl bg-white/85 hover:bg-white border border-[#1E223D]/10 hover:border-[#F54F1B]/40 cursor-pointer overflow-hidden transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-[#1E223D]/10 hover:-translate-y-1 backdrop-blur-md"
    >
      {/* Top subtle coral accent line on hover */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#F54F1B] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Card Header: Icon, Live Status Dot, and Action Icons */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-4">
          {/* App Icon with Soft Glow Frame */}
          <div className="relative">
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-[#1E223D] border border-[#1E223D]/20 flex items-center justify-center text-[#E6D5B7] group-hover:bg-[#F54F1B] group-hover:text-white transition-all duration-300 shadow-md shadow-[#1E223D]/15">
              <DynamicIcon name={app.iconName} className="w-6 h-6 sm:w-7 sm:h-7 transition-transform group-hover:scale-110" />
            </div>

            {/* Favorite Star Badge */}
            {app.isFavorite && (
              <span className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-[#F54F1B] text-white shadow-md shadow-[#F54F1B]/30">
                <Star className="w-2.5 h-2.5 fill-current" />
              </span>
            )}
          </div>

          {/* Status Indicator & Quick Tools */}
          <div className="flex items-center gap-1.5">
            {/* Live Pulsing Dot Status Indicator */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border backdrop-blur-md transition-colors ${
                isOnline
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : isMaintenance
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}
            >
              <span className="relative flex h-2 w-2">
                {isOnline && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    isOnline
                      ? 'bg-emerald-600'
                      : isMaintenance
                      ? 'bg-amber-600'
                      : 'bg-blue-600'
                  }`}
                />
              </span>
              <span>{isOnline ? 'Active' : isMaintenance ? 'ปิดปรับปรุง' : 'อัปเดต'}</span>
            </div>

            {/* Favorite Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(app.id);
              }}
              className={`p-1.5 rounded-xl transition-colors ${
                app.isFavorite
                  ? 'text-[#F54F1B] hover:text-[#e04514]'
                  : 'text-[#4B5277] hover:text-[#1E223D] hover:bg-[#1E223D]/5'
              }`}
              title={app.isFavorite ? 'ยกเลิกการติดดาว' : 'ติดดาว (Favorite)'}
            >
              <Star className={`w-4 h-4 ${app.isFavorite ? 'fill-current' : ''}`} />
            </button>

            {/* Edit Button in Admin Mode */}
            {isAdminUnlocked && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(app);
                }}
                className="p-1.5 rounded-xl text-[#4B5277] hover:text-[#1E223D] hover:bg-[#1E223D]/5 transition-colors"
                title="แก้ไขข้อมูลแอปนี้"
              >
                <Edit3 className="w-4 h-4 text-[#F54F1B]" />
              </button>
            )}
          </div>
        </div>

        {/* Category & Tag Subtitle */}
        <div className="flex items-center gap-2 mb-2 text-[11px] font-semibold text-[#F54F1B]">
          <span className="truncate max-w-[140px]">{category?.name || 'ทั่วไป'}</span>
          <span className="text-[#4B5277]">·</span>
          <span className="text-[#4B5277] font-medium truncate">{app.tag}</span>
        </div>

        {/* App Title */}
        <h3 className="text-base sm:text-lg font-bold text-[#1E223D] tracking-tight leading-snug group-hover:text-[#F54F1B] transition-colors mb-2">
          {app.title}
        </h3>

        {/* App Description */}
        <p className="text-xs text-[#4B5277] line-clamp-2 leading-relaxed">
          {app.description}
        </p>
      </div>

      {/* Card Footer: Launch Button and Link Copy */}
      <div className="mt-5 pt-4 border-t border-[#1E223D]/10 flex items-center justify-between gap-3">
        <button
          onClick={handleCopyLink}
          className="p-2 rounded-xl text-[#4B5277] hover:text-[#1E223D] hover:bg-[#1E223D]/5 transition-colors flex items-center gap-1.5 text-xs font-medium"
          title="คัดลอกลิงก์ Google Script / Web App"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700 text-[11px] font-semibold">คัดลอกแล้ว</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">คัดลอกลิงก์</span>
            </>
          )}
        </button>

        {/* Main Launch Button */}
        <button
          onClick={handleLaunch}
          className="px-4 py-2 rounded-xl bg-[#F54F1B] hover:bg-[#e04514] text-white text-xs sm:text-sm font-semibold shadow-md shadow-[#F54F1B]/20 hover:shadow-lg active:scale-95 transition-all flex items-center gap-1.5 group/btn"
        >
          <span>เปิดใช้งาน</span>
          <ArrowUpRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
        </button>
      </div>
    </div>
  );
};
