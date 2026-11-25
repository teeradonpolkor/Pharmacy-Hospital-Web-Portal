import React, { useState, useMemo, useEffect } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Printer,
  Lock,
  Unlock,
  Users,
  Clock,
  Sun,
  Sunset,
} from 'lucide-react';
import { RosterPublicMonth } from '../types/portal';
import {
  formatThaiMonthYear,
  getDaysInMonth,
  getDayOfWeek,
  THAI_DAYS_SHORT,
} from '../data/rosterData';

interface PublicRosterViewProps {
  publicRosters: RosterPublicMonth[];
  isAdminUnlocked: boolean;
  onOpenAdminRoster: () => void;
  onRequestAdminPin: () => void;
}

export const PublicRosterView: React.FC<PublicRosterViewProps> = ({
  publicRosters,
  isAdminUnlocked,
  onOpenAdminRoster,
  onRequestAdminPin,
}) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();
  const currentMonthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

  // Sort published months chronologically
  const sortedRosters = useMemo(() => {
    return [...publicRosters]
      .filter((r) => r.isPublished)
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  }, [publicRosters]);

  // Default selected month: current month if published, otherwise latest published month
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(() => {
    const hasCurrent = sortedRosters.some((r) => r.monthKey === currentMonthKey);
    if (hasCurrent) return currentMonthKey;
    return sortedRosters[sortedRosters.length - 1]?.monthKey || currentMonthKey;
  });

  // Sync selection if published list changes and current selection isn't available yet
  useEffect(() => {
    if (sortedRosters.length > 0 && !sortedRosters.some((r) => r.monthKey === selectedMonthKey)) {
      const hasCurrent = sortedRosters.some((r) => r.monthKey === currentMonthKey);
      setSelectedMonthKey(
        hasCurrent
          ? currentMonthKey
          : sortedRosters[sortedRosters.length - 1].monthKey
      );
    }
  }, [sortedRosters, selectedMonthKey, currentMonthKey]);

  const [selectedStaffId, setSelectedStaffId] = useState<string>('all');

  const activeRoster = useMemo(() => {
    return sortedRosters.find((r) => r.monthKey === selectedMonthKey) || null;
  }, [sortedRosters, selectedMonthKey]);

  const currentIdx = sortedRosters.findIndex((r) => r.monthKey === selectedMonthKey);

  const handlePrevMonth = () => {
    if (currentIdx > 0) {
      setSelectedMonthKey(sortedRosters[currentIdx - 1].monthKey);
    }
  };

  const handleNextMonth = () => {
    if (currentIdx >= 0 && currentIdx < sortedRosters.length - 1) {
      setSelectedMonthKey(sortedRosters[currentIdx + 1].monthKey);
    }
  };

  const handlePrintPublicRoster = () => {
    window.print();
  };

  // Determine today's duty from the current month's published roster
  const todayRoster = useMemo(() => {
    return sortedRosters.find((r) => r.monthKey === currentMonthKey) || null;
  }, [sortedRosters, currentMonthKey]);

  const todayMorningStaff = useMemo(() => {
    if (!todayRoster) return [];
    return todayRoster.rows.filter((row) => row.morningDays.includes(currentDay));
  }, [todayRoster, currentDay]);

  const todayAfternoonStaff = useMemo(() => {
    if (!todayRoster) return [];
    return todayRoster.rows.filter((row) => row.afternoonDays.includes(currentDay));
  }, [todayRoster, currentDay]);

  const daysCount = activeRoster
    ? getDaysInMonth(activeRoster.yearAD, activeRoster.month)
    : 30;
  const daysArray = Array.from({ length: daysCount }, (_, i) => i + 1);
  const webDayColPercent = `${(69.5 / daysCount).toFixed(4)}%`;

  const visibleRows = useMemo(() => {
    if (!activeRoster) return [];
    const sorted = [...activeRoster.rows].sort((a, b) => a.order - b.order);
    if (selectedStaffId === 'all') return sorted;
    return sorted.filter((r) => r.staffId === selectedStaffId);
  }, [activeRoster, selectedStaffId]);

  const isViewingCurrentMonth = activeRoster?.monthKey === currentMonthKey;

  return (
    <div className="space-y-6">
      {/* Today's Duty Summary Strip (if current month is published) */}
      {todayRoster && (
        <div className="no-print p-4 sm:p-5 rounded-3xl bg-white/80 backdrop-blur-md border border-[#1E223D]/10 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#1E223D] text-[#E6D5B7] flex items-center justify-center shrink-0 shadow-sm">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[#F54F1B]">
                ผู้ปฏิบัติงานนอกเวลาราชการวันนี้ ({currentDay}{' '}
                {formatThaiMonthYear(currentYear, currentMonth)})
              </p>
              <h3 className="text-sm sm:text-base font-bold text-[#1E223D]">
                เวรประจำวันกลุ่มงานเภสัชกรรมและคุ้มครองผู้บริโภค
              </h3>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="px-3.5 py-2 rounded-2xl bg-[#F4EFE6] border border-[#1E223D]/10 flex items-center gap-2 text-xs">
              <Sun className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-semibold text-[#1E223D]">เวรเช้า (ช):</span>
              <span className="text-[#4B5277] font-medium">
                {todayMorningStaff.length > 0
                  ? todayMorningStaff.map((s) => s.name).join(', ')
                  : 'ไม่มีเวรเช้า (วันทำการปกติ)'}
              </span>
            </div>

            <div className="px-3.5 py-2 rounded-2xl bg-[#F4EFE6] border border-[#1E223D]/10 flex items-center gap-2 text-xs">
              <Sunset className="w-4 h-4 text-[#F54F1B] shrink-0" />
              <span className="font-semibold text-[#1E223D]">เวรบ่าย (บ):</span>
              <span className="text-[#4B5277] font-medium">
                {todayAfternoonStaff.length > 0
                  ? todayAfternoonStaff.map((s) => s.name).join(', ')
                  : 'ไม่มีผู้ปฏิบัติงาน'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Control Bar: Month-by-Month Selector + Staff Filter + Print + Admin Button */}
      <div className="no-print p-4 sm:p-5 rounded-3xl bg-white/80 backdrop-blur-md border border-[#1E223D]/10 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Month-by-month Navigation */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1 bg-[#F4EFE6] p-1 rounded-2xl border border-[#1E223D]/10">
            <button
              onClick={handlePrevMonth}
              disabled={currentIdx <= 0}
              className="p-2 rounded-xl text-[#1E223D] hover:bg-white disabled:opacity-35 disabled:hover:bg-transparent transition-colors"
              title="เดือนก่อนหน้า"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 px-2">
              <CalendarDays className="w-4 h-4 text-[#F54F1B] shrink-0" />
              <select
                value={selectedMonthKey}
                onChange={(e) => setSelectedMonthKey(e.target.value)}
                className="bg-transparent text-sm font-bold text-[#1E223D] outline-none cursor-pointer pr-1"
                aria-label="เลือกเดือนที่ต้องการดู"
              >
                {sortedRosters.length === 0 ? (
                  <option value={currentMonthKey}>
                    {formatThaiMonthYear(currentYear, currentMonth)}
                  </option>
                ) : (
                  sortedRosters.map((r) => (
                    <option key={r.monthKey} value={r.monthKey}>
                      ประจำเดือน {formatThaiMonthYear(r.yearAD, r.month)}
                    </option>
                  ))
                )}
              </select>
            </div>

            <button
              onClick={handleNextMonth}
              disabled={currentIdx < 0 || currentIdx >= sortedRosters.length - 1}
              className="p-2 rounded-xl text-[#1E223D] hover:bg-white disabled:opacity-35 disabled:hover:bg-transparent transition-colors"
              title="เดือนถัดไป"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Staff filter */}
          {activeRoster && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-[#F4EFE6] border border-[#1E223D]/10">
              <Users className="w-4 h-4 text-[#4B5277] shrink-0" />
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="bg-transparent text-xs sm:text-sm font-medium text-[#1E223D] outline-none cursor-pointer"
                aria-label="กรองตามรายชื่อบุคลากร"
              >
                <option value="all">บุคลากรทั้งหมด ({activeRoster.rows.length} คน)</option>
                {[...activeRoster.rows]
                  .sort((a, b) => a.order - b.order)
                  .map((row) => (
                    <option key={row.staffId} value={row.staffId}>
                      {row.name}
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>

        {/* Actions: Print Public Copy + Admin Roster Button */}
        <div className="flex items-center gap-2.5 justify-end">
          {activeRoster && (
            <button
              onClick={handlePrintPublicRoster}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#F4EFE6] text-[#1E223D] border border-[#1E223D]/15 text-xs font-semibold flex items-center gap-2 transition-colors shadow-2xs whitespace-nowrap shrink-0"
              title="พิมพ์ตารางเวรขนาด A4 แนวนอน ครบทุกวันในหน้าเดียว"
            >
              <Printer className="w-4 h-4 text-[#F54F1B]" />
              <span>พิมพ์ตารางเวร</span>
            </button>
          )}

          {isAdminUnlocked ? (
            <button
              onClick={onOpenAdminRoster}
              className="px-4 py-2.5 rounded-xl bg-[#F54F1B] hover:bg-[#e04514] text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-[#F54F1B]/20 whitespace-nowrap shrink-0"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>เปิดหลังบ้านจัดตารางเวร</span>
            </button>
          ) : (
            <button
              onClick={onRequestAdminPin}
              className="px-4 py-2.5 rounded-xl bg-[#1E223D] hover:bg-[#2A3159] text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-sm whitespace-nowrap shrink-0"
            >
              <Lock className="w-3.5 h-3.5 text-[#E6D5B7]" />
              <span>จัดตารางเวร (PIN)</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Public Roster Table Card (Fits 1..31 days in 1 page without horizontal scroll & prints cleanly A4 Landscape, NO money, NO signatories) */}
      {!activeRoster ? (
        <div className="no-print py-16 px-6 text-center rounded-3xl bg-white/80 border border-[#1E223D]/10 space-y-3 shadow-xs">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#1E223D]/5 border border-[#1E223D]/10 flex items-center justify-center text-[#4B5277]">
            <CalendarDays className="w-7 h-7" />
          </div>
          <h4 className="text-base font-bold text-[#1E223D]">
            ยังไม่มีตารางเวรที่เผยแพร่สำหรับเดือนนี้
          </h4>
          <p className="text-xs text-[#4B5277] max-w-md mx-auto">
            หัวหน้ากลุ่มงานยังไม่ได้เผยแพร่ตารางเวรของเดือนที่เลือกขึ้นหน้าหลัก หรือกรุณาเลือกเดือนอื่นที่มีการเผยแพร่แล้ว
          </p>
        </div>
      ) : (
        <div className="printable-roster rounded-3xl bg-white/95 border border-[#1E223D]/12 shadow-sm overflow-hidden print:border print:border-[#1E223D]/25">
          {/* Roster Table Header */}
          <div className="px-5 py-4 sm:px-6 border-b border-[#1E223D]/10 bg-[#F9F5EE] flex flex-col sm:flex-row sm:items-center justify-between gap-2 print:px-3 print:py-2">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#1E223D] print:text-sm">
                {activeRoster.title} ประจำเดือน {formatThaiMonthYear(activeRoster.yearAD, activeRoster.month)}
              </h3>
              <p className="text-xs text-[#4B5277] mt-0.5 print:hidden">
                ตารางปฏิบัติงานสำหรับบุคลากร (ฉบับเผยแพร่ทั่วไป · ไม่แสดงข้อมูลค่าตอบแทน)
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-[#4B5277] shrink-0 print:text-[10px]">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-[#EAF2E3] border border-emerald-300 inline-block" />
                <span>วันหยุดราชการ / ส.-อา.</span>
              </span>
              {isViewingCurrentMonth && (
                <span className="inline-flex items-center gap-1.5 print:hidden">
                  <span className="w-3 h-3 rounded bg-[#F54F1B]/20 border border-[#F54F1B] inline-block" />
                  <span>วันนี้ ({currentDay})</span>
                </span>
              )}
            </div>
          </div>

          {/* Single-Page Fit Matrix (No scroll on desktop >= 1024px & fits 100% on A4 Landscape print) */}
          <div className="overflow-x-auto lg:overflow-x-visible print:overflow-visible">
            <table className="w-full min-w-[820px] lg:min-w-0 print:min-w-0 lg:table-fixed print:table-fixed border-collapse text-[11px] print:text-[9.5px]">
              <colgroup>
                <col className="w-[13%]" />
                <col className="w-[9.5%]" />
                <col className="w-[2.6%]" />
                {daysArray.map((day) => (
                  <col key={day} style={{ width: webDayColPercent }} />
                ))}
                <col className="w-[5.4%]" />
              </colgroup>

              <thead>
                <tr className="bg-[#F4EFE6] text-[#1E223D] border-b border-[#1E223D]/15">
                  <th className="px-2 py-2 text-left font-bold border-r border-[#1E223D]/12 print:px-1.5 print:py-1">
                    ชื่อ-สกุล
                  </th>
                  <th className="px-1.5 py-2 text-left font-bold border-r border-[#1E223D]/12 print:px-1 print:py-1">
                    ตำแหน่ง
                  </th>
                  <th className="px-1 py-2 text-center font-bold border-r border-[#1E223D]/15 print:px-0.5 print:py-1">
                    เวร
                  </th>
                  {daysArray.map((day) => {
                    const isHoliday = activeRoster.holidays.includes(day);
                    const isToday = isViewingCurrentMonth && day === currentDay;
                    const dowLabel =
                      THAI_DAYS_SHORT[getDayOfWeek(activeRoster.yearAD, activeRoster.month, day)];
                    return (
                      <th
                        key={day}
                        className={`px-0 py-1.5 text-center font-semibold border-r border-[#1E223D]/10 tabular-nums print:py-1 ${
                          isToday
                            ? 'bg-[#F54F1B] text-white print:bg-transparent print:text-[#1E223D]'
                            : isHoliday
                            ? 'bg-[#EAF2E3] text-emerald-900'
                            : 'text-[#1E223D]'
                        }`}
                      >
                        <div className="leading-tight text-[11px] print:text-[9.5px]">{day}</div>
                        <div
                          className={`text-[8px] font-normal leading-tight ${
                            isToday
                              ? 'text-white/90 print:text-[#4B5277]'
                              : isHoliday
                              ? 'text-emerald-700'
                              : 'text-[#4B5277]'
                          }`}
                        >
                          {dowLabel}
                        </div>
                      </th>
                    );
                  })}
                  <th className="px-1 py-2 text-center font-bold bg-[#F4EFE6] print:py-1">
                    จำนวน
                  </th>
                </tr>
              </thead>

              <tbody>
                {visibleRows.map((row) => {
                  const morningCount = row.morningDays.length;
                  const afternoonCount = row.afternoonDays.length;

                  return (
                    <React.Fragment key={row.staffId}>
                      {/* Morning Row (ช) */}
                      <tr className="border-b border-[#1E223D]/10 hover:bg-[#F9F5EE]/50 transition-colors">
                        <td
                          rowSpan={2}
                          className="bg-white px-2 py-2 font-semibold text-[#1E223D] border-r border-[#1E223D]/12 align-middle text-[11px] leading-snug break-words print:px-1.5 print:py-1 print:text-[9.5px]"
                        >
                          {row.name}
                        </td>
                        <td
                          rowSpan={2}
                          className="px-1.5 py-2 text-[#4B5277] border-r border-[#1E223D]/12 align-middle text-[10px] leading-snug break-words print:px-1 print:py-1 print:text-[9px]"
                        >
                          {row.position}
                        </td>
                        <td className="px-0.5 py-1.5 text-center font-bold text-amber-800 bg-amber-50/70 border-r border-[#1E223D]/15 text-[10px] print:py-1">
                          ช
                        </td>
                        {daysArray.map((day) => {
                          const hasShift = row.morningDays.includes(day);
                          const isHoliday = activeRoster.holidays.includes(day);
                          const isToday = isViewingCurrentMonth && day === currentDay;
                          return (
                            <td
                              key={day}
                              className={`text-center py-1.5 px-0 border-r border-[#1E223D]/10 font-bold print:py-1 ${
                                isToday
                                  ? 'bg-[#F54F1B]/10 print:bg-transparent'
                                  : isHoliday
                                  ? 'bg-[#EAF2E3]/70'
                                  : ''
                              }`}
                            >
                              {hasShift ? (
                                <span className="inline-flex items-center justify-center w-[18px] h-[18px] rounded bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold print:w-auto print:h-auto print:bg-transparent print:border-0 print:text-[9.5px]">
                                  ช
                                </span>
                              ) : null}
                            </td>
                          );
                        })}
                        <td
                          rowSpan={2}
                          className="px-1 py-1.5 text-center border-l border-[#1E223D]/10 bg-[#F9F5EE]/60 font-semibold text-[#1E223D] tabular-nums text-[10px] whitespace-nowrap print:py-1 print:text-[9px]"
                        >
                          <div className="text-amber-800">ช : {morningCount}</div>
                          <div className="text-[#F54F1B] mt-0.5">บ : {afternoonCount}</div>
                        </td>
                      </tr>

                      {/* Afternoon Row (บ) */}
                      <tr className="border-b border-[#1E223D]/15 hover:bg-[#F9F5EE]/50 transition-colors">
                        <td className="px-0.5 py-1.5 text-center font-bold text-[#F54F1B] bg-[#F54F1B]/5 border-r border-[#1E223D]/15 text-[10px] print:py-1">
                          บ
                        </td>
                        {daysArray.map((day) => {
                          const hasShift = row.afternoonDays.includes(day);
                          const isHoliday = activeRoster.holidays.includes(day);
                          const isToday = isViewingCurrentMonth && day === currentDay;
                          return (
                            <td
                              key={day}
                              className={`text-center py-1.5 px-0 border-r border-[#1E223D]/10 font-bold print:py-1 ${
                                isToday
                                  ? 'bg-[#F54F1B]/10 print:bg-transparent'
                                  : isHoliday
                                  ? 'bg-[#EAF2E3]/70'
                                  : ''
                              }`}
                            >
                              {hasShift ? (
                                <span className="inline-flex items-center justify-center w-[18px] h-[18px] rounded bg-[#F54F1B]/15 text-[#c83a0e] border border-[#F54F1B]/30 text-[10px] font-bold print:w-auto print:h-auto print:bg-transparent print:border-0 print:text-[9.5px]">
                                  บ
                                </span>
                              ) : null}
                            </td>
                          );
                        })}
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Legend & Public Note */}
          <div className="px-5 py-4 sm:px-6 bg-[#F9F5EE] border-t border-[#1E223D]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#4B5277] print:px-3 print:py-2 print:text-[10px]">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#1E223D]">หมายเหตุ:</span>
                <span>1 ช หมายถึง เวลาปฏิบัติงานในช่วงเวลา 8.00 – 16.00 น.</span>
              </div>
              <div className="sm:pl-13">
                <span>2 บ หมายถึง เวลาปฏิบัติงานในช่วงเวลา 16.01 – 20.00 น.</span>
              </div>
              {activeRoster.note && (
                <div className="pt-1 text-[#1E223D] font-medium">
                  บันทึกเพิ่มเติม: {activeRoster.note}
                </div>
              )}
            </div>

            <div className="text-[11px] text-[#4B5277] shrink-0 print:text-[9.5px]">
              อัปเดตล่าสุด:{' '}
              {new Date(activeRoster.updatedAt).toLocaleDateString('th-TH', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
