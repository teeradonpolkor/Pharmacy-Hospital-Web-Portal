import React, { useState } from 'react';
import {
  Megaphone,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Info,
  CheckCircle2,
  X,
  Plus,
  Pin,
  Trash2,
} from 'lucide-react';
import { Announcement } from '../types/portal';

interface AnnouncementsBannerProps {
  announcements: Announcement[];
  isAdminUnlocked: boolean;
  onAddAnnouncement: () => void;
  onDeleteAnnouncement: (id: string) => void;
}

export const AnnouncementsBanner: React.FC<AnnouncementsBannerProps> = ({
  announcements,
  isAdminUnlocked,
  onAddAnnouncement,
  onDeleteAnnouncement,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  const visibleAnnouncements = announcements.filter(
    (a) => !dismissedIds.includes(a.id)
  );

  if (visibleAnnouncements.length === 0 && !isAdminUnlocked) {
    return null;
  }

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedIds((prev) => [...prev, id]);
  };

  const getBadgeStyle = (type: Announcement['type']) => {
    switch (type) {
      case 'urgent':
        return {
          icon: <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />,
          borderColor: 'border-rose-200',
          bg: 'bg-rose-50/90',
          text: 'text-rose-700',
          label: 'ด่วน / แจ้งเตือน',
        };
      case 'update':
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />,
          borderColor: 'border-emerald-200',
          bg: 'bg-emerald-50/90',
          text: 'text-emerald-700',
          label: 'อัปเดตระบบ',
        };
      case 'info':
      default:
        return {
          icon: <Info className="w-4 h-4 text-[#F54F1B] shrink-0" />,
          borderColor: 'border-[#D4BE9B]/50',
          bg: 'bg-[#F9F5EE]',
          text: 'text-[#1E223D]',
          label: 'ประกาศทั่วไป',
        };
    }
  };

  return (
    <div className="w-full rounded-2xl bg-white/75 backdrop-blur-xl border border-[#1E223D]/10 overflow-hidden shadow-xs transition-all duration-300">
      {/* Top Banner Header Bar */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-4 py-3 sm:px-6 flex items-center justify-between cursor-pointer hover:bg-white/40 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#F54F1B]/15 border border-[#F54F1B]/25 flex items-center justify-center text-[#F54F1B] shrink-0">
            <Megaphone className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs sm:text-sm font-bold text-[#1E223D] tracking-wide">
              ประกาศ & ข้อความด่วน (Announcements)
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#1E223D]/10 text-[#1E223D]">
              {visibleAnnouncements.length} รายการ
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAdminUnlocked && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddAnnouncement();
              }}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#1E223D] text-white hover:bg-[#2A3159] flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>เขียนประกาศ</span>
            </button>
          )}

          <button
            className="p-1 rounded-lg text-[#4B5277] hover:text-[#1E223D] transition-colors"
            aria-label="ย่อ/ขยายประกาศ"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded List */}
      {isExpanded && (
        <div className="px-4 pb-4 sm:px-6 pt-1 space-y-2.5 border-t border-[#1E223D]/10">
          {visibleAnnouncements.length === 0 ? (
            <p className="text-xs text-[#4B5277] py-2 text-center">
              ยังไม่มีข้อความประกาศในขณะนี้
            </p>
          ) : (
            visibleAnnouncements.map((item) => {
              const style = getBadgeStyle(item.type);
              return (
                <div
                  key={item.id}
                  className={`relative p-3.5 sm:p-4 rounded-xl ${style.bg} border ${style.borderColor} transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-3 shadow-2xs`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="mt-0.5">{style.icon}</div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-[10px] uppercase font-bold tracking-wider ${style.text}`}>
                          {style.label}
                        </span>
                        {item.isPinned && (
                          <span className="flex items-center gap-1 text-[10px] text-[#F54F1B] font-semibold">
                            <Pin className="w-2.5 h-2.5" />
                            <span>ปักหมุด</span>
                          </span>
                        )}
                        <span className="text-[11px] text-[#4B5277]">· {item.date}</span>
                      </div>
                      <h4 className="text-sm font-bold text-[#1E223D]">
                        {item.title}
                      </h4>
                      <p className="text-xs text-[#4B5277] mt-1 leading-relaxed">
                        {item.content}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 self-end sm:self-start shrink-0">
                    {isAdminUnlocked && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteAnnouncement(item.id);
                        }}
                        className="p-1 rounded-lg text-[#4B5277] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="ลบประกาศนี้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDismiss(item.id, e)}
                      className="p-1 rounded-lg text-[#4B5277] hover:text-[#1E223D] hover:bg-[#1E223D]/5 transition-colors"
                      title="ซ่อนข้อความนี้"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
