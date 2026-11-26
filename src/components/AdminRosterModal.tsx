import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  CalendarDays,
  Users,
  FileSignature,
  Save,
  Globe,
  EyeOff,
  Printer,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  RefreshCw,
  CalendarCheck,
  ShieldAlert,
  Lock,
  ArrowLeft,
  Copy,
  CalendarSearch,
  Sparkles,
  Flag,
  FileSpreadsheet,
} from 'lucide-react';
import {
  RosterStaff,
  RosterAdminMonth,
  RosterAdminRow,
  RosterConfig,
  CustomThaiHoliday,
  ThaiHolidayCategory,
} from '../types/portal';
import {
  THAI_MONTHS,
  THAI_DAYS_SHORT,
  getDaysInMonth,
  getDayOfWeek,
  getWeekendDays,
  formatMonthKey,
  formatThaiMonthYear,
  INITIAL_ROSTER_CONFIG,
} from '../data/rosterData';
import {
  checkThaiMonthHolidays,
  formatDateKey,
  THAI_HOLIDAY_CATEGORY_LABELS,
} from '../data/thaiHolidays';
import { exportAdminRosterToExcel } from '../utils/rosterExport';

interface AdminRosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffList: RosterStaff[];
  adminRosters: RosterAdminMonth[];
  rosterConfig: RosterConfig;
  customHolidays: CustomThaiHoliday[];
  onSaveAdminRoster: (roster: RosterAdminMonth) => Promise<void>;
  onDeleteAdminRoster: (monthKey: string) => Promise<void>;
  onSaveStaff: (staff: RosterStaff) => Promise<void>;
  onDeleteStaff: (staffId: string) => Promise<void>;
  onSaveConfig: (config: RosterConfig) => Promise<void>;
  onSaveThaiHoliday: (holiday: CustomThaiHoliday) => Promise<void>;
  onDeleteThaiHoliday: (holidayId: string) => Promise<void>;
}

export const AdminRosterModal: React.FC<AdminRosterModalProps> = ({
  isOpen,
  onClose,
  staffList,
  adminRosters,
  rosterConfig,
  customHolidays,
  onSaveAdminRoster,
  onDeleteAdminRoster,
  onSaveStaff,
  onDeleteStaff,
  onSaveConfig,
  onSaveThaiHoliday,
  onDeleteThaiHoliday,
}) => {
  const now = new Date();
  const defaultYear = now.getFullYear();
  const defaultMonth = now.getMonth() + 1;

  const [activeTab, setActiveTab] = useState<'schedule' | 'staff' | 'config'>('schedule');
  const [selectedYearAD, setSelectedYearAD] = useState<number>(defaultYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(defaultMonth);
  const [draftRoster, setDraftRoster] = useState<RosterAdminMonth | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string>('');
  const [showOfficialPrintPreview, setShowOfficialPrintPreview] = useState<boolean>(false);

  // Thai holiday checker & custom holiday form state
  const [showHolidayPanel, setShowHolidayPanel] = useState<boolean>(false);
  const [showAddHolidayForm, setShowAddHolidayForm] = useState<boolean>(false);
  const [customHolidayDay, setCustomHolidayDay] = useState<number>(1);
  const [customHolidayName, setCustomHolidayName] = useState<string>('');
  const [customHolidayCategory, setCustomHolidayCategory] =
    useState<ThaiHolidayCategory>('special');
  const [applyNewHolidayToRoster, setApplyNewHolidayToRoster] = useState<boolean>(true);

  // Staff form state
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [staffName, setStaffName] = useState('');
  const [staffPosition, setStaffPosition] = useState('');
  const [staffMorningRate, setStaffMorningRate] = useState('780');
  const [staffAfternoonRate, setStaffAfternoonRate] = useState('390');
  const [staffOrder, setStaffOrder] = useState('1');
  const [staffActive, setStaffActive] = useState(true);

  // Config form state
  const [configForm, setConfigForm] = useState<RosterConfig>(rosterConfig || INITIAL_ROSTER_CONFIG);

  const monthKey = formatMonthKey(selectedYearAD, selectedMonth);

  useEffect(() => {
    setConfigForm(rosterConfig || INITIAL_ROSTER_CONFIG);
  }, [rosterConfig]);

  // Load selected month into draftRoster when monthKey or adminRosters changes
  useEffect(() => {
    const existing = adminRosters.find((r) => r.monthKey === monthKey);
    if (existing) {
      setDraftRoster({
        ...existing,
        holidays: [...existing.holidays],
        rows: existing.rows.map((row) => ({
          ...row,
          morningDays: [...row.morningDays],
          afternoonDays: [...row.afternoonDays],
        })),
      });
    } else {
      setDraftRoster(null);
    }
  }, [monthKey, adminRosters]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const daysInSelectedMonth = getDaysInMonth(selectedYearAD, selectedMonth);
  const daysArray = Array.from({ length: daysInSelectedMonth }, (_, i) => i + 1);

  const holidayReport = useMemo(
    () => checkThaiMonthHolidays(selectedYearAD, selectedMonth, customHolidays),
    [selectedYearAD, selectedMonth, customHolidays]
  );

  const holidayNameByDay = useMemo(() => {
    const map = new Map<number, string>();
    holidayReport.thaiHolidays.forEach((h) => {
      map.set(h.day, h.name);
    });
    return map;
  }, [holidayReport]);

  const handleCreateMonthSchedule = (copyFromPrevious: boolean = false) => {
    const activeStaff = [...staffList]
      .filter((s) => s.isActive)
      .sort((a, b) => a.order - b.order);

    let rows: RosterAdminRow[] = activeStaff.map((s) => ({
      staffId: s.id,
      name: s.name,
      position: s.position,
      order: s.order,
      morningRate: s.morningRate,
      afternoonRate: s.afternoonRate,
      morningDays: [],
      afternoonDays: [],
    }));

    if (copyFromPrevious && adminRosters.length > 0) {
      const latest = [...adminRosters].sort((a, b) => b.monthKey.localeCompare(a.monthKey))[0];
      if (latest) {
        rows = rows.map((r) => {
          const prevRow = latest.rows.find((pr) => pr.staffId === r.staffId);
          if (!prevRow) return r;
          return {
            ...r,
            morningDays: prevRow.morningDays.filter((d) => d <= daysInSelectedMonth),
            afternoonDays: prevRow.afternoonDays.filter((d) => d <= daysInSelectedMonth),
          };
        });
      }
    }

    const newDraft: RosterAdminMonth = {
      monthKey,
      yearAD: selectedYearAD,
      month: selectedMonth,
      title: configForm.departmentTitle,
      holidays: holidayReport.allHolidayDays,
      rows,
      isPublished: false,
      note: '',
      updatedAt: new Date().toISOString(),
    };

    setDraftRoster(newDraft);
    showToast(
      `สร้างแบบร่างตารางเวร ${formatThaiMonthYear(selectedYearAD, selectedMonth)} พร้อมวันหยุดราชการไทยแล้ว`
    );
  };

  const handleToggleHoliday = (day: number) => {
    if (!draftRoster) return;
    const exists = draftRoster.holidays.includes(day);
    const updatedHolidays = exists
      ? draftRoster.holidays.filter((d) => d !== day)
      : [...draftRoster.holidays, day].sort((a, b) => a - b);

    setDraftRoster({
      ...draftRoster,
      holidays: updatedHolidays,
    });
  };

  const handleAutoWeekends = () => {
    if (!draftRoster) return;
    const weekends = getWeekendDays(selectedYearAD, selectedMonth);
    const merged = Array.from(new Set([...draftRoster.holidays, ...weekends])).sort((a, b) => a - b);
    setDraftRoster({
      ...draftRoster,
      holidays: merged,
    });
    showToast('เพิ่มวันเสาร์-อาทิตย์ของเดือนนี้เรียบร้อยแล้ว');
  };

  const handleCheckThaiHolidays = () => {
    setShowHolidayPanel(true);
    if (holidayReport.thaiHolidays.length > 0) {
      showToast(
        `พบวันหยุดราชการ/นักขัตฤกษ์ไทย ${holidayReport.thaiHolidays.length} วัน ในเดือน${THAI_MONTHS[selectedMonth - 1]}`
      );
    } else {
      showToast(
        `ไม่พบวันหยุดนักขัตฤกษ์ไทยในเดือน${THAI_MONTHS[selectedMonth - 1]} (สามารถกดเพิ่มเองได้)`
      );
    }
  };

  const handleApplyAllThaiHolidays = (includeWeekends: boolean) => {
    if (!draftRoster) return;
    const targetDays = includeWeekends
      ? holidayReport.allHolidayDays
      : holidayReport.thaiHolidays.map((h) => h.day);

    const merged = Array.from(new Set([...draftRoster.holidays, ...targetDays])).sort(
      (a, b) => a - b
    );
    setDraftRoster({
      ...draftRoster,
      holidays: merged,
    });
    showToast(
      includeWeekends
        ? 'นำวันหยุด ส.-อา. และวันหยุดราชการไทยทั้งหมดลงตารางแล้ว'
        : 'นำวันหยุดนักขัตฤกษ์ไทยลงตารางเรียบร้อยแล้ว'
    );
  };

  const handleSubmitCustomHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = customHolidayName.trim();
    if (!trimmedName) return;

    const safeDay = Math.min(Math.max(1, customHolidayDay), daysInSelectedMonth);
    const dateKey = formatDateKey(selectedYearAD, selectedMonth, safeDay);
    const payload: CustomThaiHoliday = {
      id: `hol-${dateKey}-${Date.now()}`,
      dateKey,
      yearAD: selectedYearAD,
      month: selectedMonth,
      day: safeDay,
      name: trimmedName.slice(0, 200),
      category: customHolidayCategory,
      createdAt: new Date().toISOString(),
    };

    setIsSaving(true);
    try {
      await onSaveThaiHoliday(payload);
      if (applyNewHolidayToRoster && draftRoster) {
        const merged = Array.from(new Set([...draftRoster.holidays, safeDay])).sort(
          (a, b) => a - b
        );
        setDraftRoster({
          ...draftRoster,
          holidays: merged,
        });
      }
      setCustomHolidayName('');
      setShowAddHolidayForm(false);
      setShowHolidayPanel(true);
      showToast(`เพิ่มวันหยุด "${trimmedName}" วันที่ ${safeDay} เรียบร้อยแล้ว`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSyncStaffIntoMonth = () => {
    if (!draftRoster) return;
    const activeStaff = [...staffList]
      .filter((s) => s.isActive)
      .sort((a, b) => a.order - b.order);

    const updatedRows: RosterAdminRow[] = activeStaff.map((s) => {
      const existingRow = draftRoster.rows.find((r) => r.staffId === s.id);
      return {
        staffId: s.id,
        name: s.name,
        position: s.position,
        order: s.order,
        morningRate: s.morningRate,
        afternoonRate: s.afternoonRate,
        morningDays: existingRow ? existingRow.morningDays : [],
        afternoonDays: existingRow ? existingRow.afternoonDays : [],
      };
    });

    setDraftRoster({
      ...draftRoster,
      rows: updatedRows,
    });
    showToast('อัปเดตรายชื่อบุคลากรและอัตราค่าตอบแทนล่าสุดเข้าตารางแล้ว');
  };

  const handleToggleShift = (staffId: string, shiftType: 'morning' | 'afternoon', day: number) => {
    if (!draftRoster) return;
    setDraftRoster({
      ...draftRoster,
      rows: draftRoster.rows.map((row) => {
        if (row.staffId !== staffId) return row;
        if (shiftType === 'morning') {
          const has = row.morningDays.includes(day);
          const nextDays = has
            ? row.morningDays.filter((d) => d !== day)
            : [...row.morningDays, day].sort((a, b) => a - b);
          return { ...row, morningDays: nextDays };
        } else {
          const has = row.afternoonDays.includes(day);
          const nextDays = has
            ? row.afternoonDays.filter((d) => d !== day)
            : [...row.afternoonDays, day].sort((a, b) => a - b);
          return { ...row, afternoonDays: nextDays };
        }
      }),
    });
  };

  const handleSaveRoster = async (publishState?: boolean) => {
    if (!draftRoster) return;
    setIsSaving(true);
    try {
      const nextPublish = publishState !== undefined ? publishState : draftRoster.isPublished;
      const payload: RosterAdminMonth = {
        ...draftRoster,
        isPublished: nextPublish,
        updatedAt: new Date().toISOString(),
      };
      await onSaveAdminRoster(payload);
      setDraftRoster(payload);
      showToast(
        nextPublish
          ? 'บันทึกและเผยแพร่ตารางเวรขึ้นหน้าหลัก (ไม่แสดงยอดเงิน) เรียบร้อยแล้ว'
          : 'บันทึกฉบับร่างในหลังบ้านเรียบร้อยแล้ว (ยังไม่แสดงบนหน้าหลัก)'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCurrentMonth = async () => {
    if (!draftRoster) return;
    if (!confirm(`ยืนยันการลบตารางเวรเดือน ${formatThaiMonthYear(selectedYearAD, selectedMonth)} หรือไม่?`)) {
      return;
    }
    setIsSaving(true);
    try {
      await onDeleteAdminRoster(draftRoster.monthKey);
      setDraftRoster(null);
      showToast('ลบตารางเวรของเดือนนี้แล้ว');
    } finally {
      setIsSaving(false);
    }
  };

  // Confidential Totals Calculation (ONLY in Admin Backend)
  const grandTotalPay = useMemo(() => {
    if (!draftRoster) return 0;
    return draftRoster.rows.reduce((sum, row) => {
      const mTotal = row.morningDays.length * row.morningRate;
      const aTotal = row.afternoonDays.length * row.afternoonRate;
      return sum + mTotal + aTotal;
    }, 0);
  }, [draftRoster]);

  // Daily coverage counts
  const dailyCoverage = useMemo(() => {
    const map: Record<number, { morning: number; afternoon: number }> = {};
    daysArray.forEach((d) => {
      map[d] = { morning: 0, afternoon: 0 };
    });
    if (draftRoster) {
      draftRoster.rows.forEach((row) => {
        row.morningDays.forEach((d) => {
          if (map[d]) map[d].morning += 1;
        });
        row.afternoonDays.forEach((d) => {
          if (map[d]) map[d].afternoon += 1;
        });
      });
    }
    return map;
  }, [draftRoster, daysArray]);

  // Staff Management Handlers
  const handleStartEditStaff = (s: RosterStaff) => {
    setEditingStaffId(s.id);
    setStaffName(s.name);
    setStaffPosition(s.position);
    setStaffMorningRate(String(s.morningRate));
    setStaffAfternoonRate(String(s.afternoonRate));
    setStaffOrder(String(s.order));
    setStaffActive(s.isActive);
  };

  const handleResetStaffForm = () => {
    setEditingStaffId(null);
    setStaffName('');
    setStaffPosition('');
    setStaffMorningRate('780');
    setStaffAfternoonRate('390');
    setStaffOrder(String(staffList.length + 1));
    setStaffActive(true);
  };

  const handleSubmitStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim()) return;
    setIsSaving(true);
    try {
      const payload: RosterStaff = {
        id: editingStaffId || `staff-${Date.now()}`,
        name: staffName.trim(),
        position: staffPosition.trim() || 'เภสัชกร',
        morningRate: Number(staffMorningRate) || 0,
        afternoonRate: Number(staffAfternoonRate) || 0,
        order: Number(staffOrder) || 1,
        isActive: staffActive,
      };
      await onSaveStaff(payload);
      showToast(editingStaffId ? 'แก้ไขข้อมูลบุคลากรแล้ว' : 'เพิ่มบุคลากรใหม่แล้ว');
      handleResetStaffForm();
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSaveConfig(configForm);
      showToast('บันทึกข้อมูลหัวตารางและผู้ลงนามแล้ว');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadExcel = async () => {
    if (!draftRoster || isExportingExcel) return;
    setIsExportingExcel(true);
    try {
      await exportAdminRosterToExcel(draftRoster, configForm);
      showToast('ดาวน์โหลดไฟล์ Excel (.xlsx) เรียบร้อยแล้ว');
    } finally {
      setIsExportingExcel(false);
    }
  };

  // Official Print Preview Overlay (matches image_b01088e6.png)
  if (showOfficialPrintPreview && draftRoster) {
    const adminDayColPercent = `${(62 / daysInSelectedMonth).toFixed(4)}%`;

    return (
      <div className="print-reset-container fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex flex-col overflow-auto p-4 sm:p-8">
        {/* Non-print toolbar */}
        <div className="no-print max-w-[1200px] w-full mx-auto mb-4 flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl shadow-lg">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowOfficialPrintPreview(false)}
              className="px-3.5 py-2 rounded-xl bg-[#F4EFE6] hover:bg-[#E6D5B7] text-[#1E223D] text-xs font-semibold flex items-center gap-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>กลับหน้าจัดตารางเวร</span>
            </button>
            <div>
              <h3 className="text-sm font-bold text-[#1E223D]">
                ตัวอย่างเอกสารราชการ (ฉบับสมบูรณ์พร้อมยอดเงินและผู้ลงนาม)
              </h3>
              <p className="text-[11px] text-[#4B5277]">
                แนะนำให้เลือกกระดาษแนวนอน (Landscape) ขนาด A4 เมื่อสั่งพิมพ์หรือบันทึกเป็น PDF
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleDownloadExcel}
              disabled={isExportingExcel}
              className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{isExportingExcel ? 'กำลังสร้าง Excel...' : 'ดาวน์โหลด Excel'}</span>
            </button>

            <button
              onClick={() => window.print()}
              className="px-5 py-2.5 rounded-xl bg-[#F54F1B] hover:bg-[#e04514] text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>สั่งพิมพ์ / บันทึกเป็น PDF</span>
            </button>
          </div>
        </div>

        {/* Printable Official Document */}
        <div className="printable-roster max-w-[1200px] w-full mx-auto bg-white text-black p-5 sm:p-8 rounded-xl shadow-2xl border border-slate-300">
          <div className="text-center font-bold text-xs sm:text-sm mb-3">
            {draftRoster.title} ประจำเดือน {formatThaiMonthYear(draftRoster.yearAD, draftRoster.month)}
          </div>

          <table className="w-full table-fixed border-collapse border border-black text-[9.5px] sm:text-[10px]">
            <colgroup>
              <col style={{ width: '11.5%' }} />
              <col style={{ width: '8.5%' }} />
              <col style={{ width: '6%' }} />
              {daysArray.map((day) => (
                <col key={day} style={{ width: adminDayColPercent }} />
              ))}
              <col style={{ width: '6%' }} />
              <col style={{ width: '6%' }} />
            </colgroup>

            <thead>
              <tr className="bg-[#f7f7ec]">
                <th className="border border-black px-1 py-1.5 text-center font-bold">ชื่อ-สกุล</th>
                <th className="border border-black px-1 py-1.5 text-center font-bold">ตำแหน่ง</th>
                <th className="border border-black px-1 py-1.5 text-center font-bold">เวรละ</th>
                {daysArray.map((day) => {
                  const isHol = draftRoster.holidays.includes(day);
                  return (
                    <th
                      key={day}
                      className={`border border-black px-0 py-1.5 text-center font-bold tabular-nums ${
                        isHol ? 'bg-[#e7efe0]' : ''
                      }`}
                    >
                      {day}
                    </th>
                  );
                })}
                <th className="border border-black px-1 py-1.5 text-center font-bold">จำนวน</th>
                <th className="border border-black px-1 py-1.5 text-center font-bold">จำนวนเงิน</th>
              </tr>
            </thead>
            <tbody>
              {[...draftRoster.rows]
                .sort((a, b) => a.order - b.order)
                .map((row) => {
                  const mCount = row.morningDays.length;
                  const aCount = row.afternoonDays.length;
                  const totalAmount = mCount * row.morningRate + aCount * row.afternoonRate;

                  return (
                    <React.Fragment key={row.staffId}>
                      <tr>
                        <td rowSpan={2} className="border border-black px-1.5 py-1 align-middle leading-tight break-words">
                          {row.name}
                        </td>
                        <td rowSpan={2} className="border border-black px-1 py-1 text-center align-middle leading-tight break-words">
                          {row.position}
                        </td>
                        <td className="border border-black px-1 py-1 text-right whitespace-nowrap tabular-nums">
                          {row.morningRate} (ช):
                        </td>
                        {daysArray.map((day) => {
                          const isHol = draftRoster.holidays.includes(day);
                          const has = row.morningDays.includes(day);
                          return (
                            <td
                              key={day}
                              className={`border border-black text-center py-1 px-0 ${
                                isHol ? 'bg-[#e7efe0]' : ''
                              }`}
                            >
                              {has ? 'ช' : ''}
                            </td>
                          );
                        })}
                        <td rowSpan={2} className="border border-black px-1 py-1 text-center align-middle whitespace-nowrap tabular-nums">
                          <div>ช : {mCount}</div>
                          <div className="mt-1">บ : {aCount}</div>
                        </td>
                        <td rowSpan={2} className="border border-black px-1 py-1 text-right align-middle font-semibold tabular-nums">
                          {totalAmount.toLocaleString('th-TH')}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-black px-1 py-1 text-right whitespace-nowrap tabular-nums">
                          {row.afternoonRate} (บ):
                        </td>
                        {daysArray.map((day) => {
                          const isHol = draftRoster.holidays.includes(day);
                          const has = row.afternoonDays.includes(day);
                          return (
                            <td
                              key={day}
                              className={`border border-black text-center py-1 px-0 ${
                                isHol ? 'bg-[#e7efe0]' : ''
                              }`}
                            >
                              {has ? 'บ' : ''}
                            </td>
                          );
                        })}
                      </tr>
                    </React.Fragment>
                  );
                })}
              {/* Grand Total Row */}
              <tr className="font-bold bg-slate-50">
                <td
                  colSpan={3 + daysInSelectedMonth + 1}
                  className="border border-black px-3 py-1.5 text-center"
                >
                  รวมทั้งสิ้น
                </td>
                <td className="border border-black px-1 py-1.5 text-right tabular-nums">
                  {grandTotalPay.toLocaleString('th-TH')}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Legend */}
          <div className="mt-3.5 text-[10.5px] flex gap-6">
            <div className="font-semibold shrink-0">หมายเหตุ:</div>
            <div className="space-y-0.5">
              <div>{configForm.morningLabel}</div>
              <div>{configForm.afternoonLabel}</div>
            </div>
          </div>

          {/* Official Signatories */}
          <div className="mt-10 grid grid-cols-2 gap-12 text-center text-[11px]">
            <div className="space-y-0.5">
              <div className="mb-2.5">........................................................</div>
              <div className="font-semibold">{configForm.leftSignatoryName}</div>
              <div>{configForm.leftSignatoryPosition}</div>
              <div>{configForm.leftSignatoryRole}</div>
            </div>
            <div className="space-y-0.5">
              <div className="mb-2.5">........................................................</div>
              <div className="font-semibold">{configForm.rightSignatoryName}</div>
              <div>{configForm.rightSignatoryPosition}</div>
              <div>{configForm.rightSignatoryRole}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-[#1E223D]/60 backdrop-blur-md">
      <div className="relative w-full max-w-[1380px] h-[94vh] rounded-3xl bg-white/95 backdrop-blur-2xl flex flex-col overflow-hidden border border-[#1E223D]/15 shadow-2xl text-[#1E223D]">
        {/* Header */}
        <div className="px-5 py-4 sm:px-6 border-b border-[#1E223D]/10 flex items-center justify-between gap-4 shrink-0 bg-[#1E223D] text-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#F54F1B] flex items-center justify-center text-white shrink-0 shadow-sm">
              <Lock className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold tracking-tight truncate">
                  ระบบหลังบ้านจัดตารางเวร (Confidential Admin)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#E6D5B7]/20 text-[#E6D5B7]">
                  PIN Verified · แสดงอัตราค่าตอบแทน
                </span>
              </div>
              <p className="text-xs text-[#E6D5B7]/85 truncate">
                จัดตารางเวร คำนวณยอดเงินค่าตอบแทนลับเฉพาะผู้ดูแล และเผยแพร่เฉพาะตารางเวรขึ้นหน้าเว็บหลัก
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast Notification */}
        {toastMsg && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2 text-xs text-emerald-800 font-semibold flex items-center gap-2 animate-fade-in shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="px-5 sm:px-6 pt-3 pb-2.5 border-b border-[#1E223D]/10 flex items-center justify-between gap-3 flex-wrap shrink-0 bg-[#F9F5EE]">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('schedule')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'schedule'
                  ? 'bg-[#F54F1B] text-white shadow-xs'
                  : 'text-[#4B5277] hover:text-[#1E223D] hover:bg-white'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              <span>จัดตารางเวรรายเดือน</span>
            </button>

            <button
              onClick={() => setActiveTab('staff')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'staff'
                  ? 'bg-[#F54F1B] text-white shadow-xs'
                  : 'text-[#4B5277] hover:text-[#1E223D] hover:bg-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>บุคลากรและอัตราค่าเวร ({staffList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('config')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'config'
                  ? 'bg-[#F54F1B] text-white shadow-xs'
                  : 'text-[#4B5277] hover:text-[#1E223D] hover:bg-white'
              }`}
            >
              <FileSignature className="w-4 h-4" />
              <span>หัวตารางและผู้ลงนาม</span>
            </button>
          </div>

          {/* Month & Year Picker when in schedule tab */}
          {activeTab === 'schedule' && (
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-3 py-1.5 rounded-xl bg-white border border-[#1E223D]/15 text-xs sm:text-sm font-semibold text-[#1E223D] outline-none"
              >
                {THAI_MONTHS.map((mName, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    {mName}
                  </option>
                ))}
              </select>

              <select
                value={selectedYearAD}
                onChange={(e) => setSelectedYearAD(Number(e.target.value))}
                className="px-3 py-1.5 rounded-xl bg-white border border-[#1E223D]/15 text-xs sm:text-sm font-semibold text-[#1E223D] outline-none"
              >
                {[defaultYear - 1, defaultYear, defaultYear + 1, defaultYear + 2].map((y) => (
                  <option key={y} value={y}>
                    พ.ศ. {y + 543}
                  </option>
                ))}
              </select>

              {adminRosters.length > 0 && (
                <select
                  value={monthKey}
                  onChange={(e) => {
                    const [y, m] = e.target.value.split('-').map(Number);
                    if (y && m) {
                      setSelectedYearAD(y);
                      setSelectedMonth(m);
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#F4EFE6] border border-[#1E223D]/15 text-xs font-medium text-[#4B5277] outline-none"
                  title="ข้ามไปยังเดือนที่สร้างไว้แล้ว"
                >
                  <option value="">-- เดือนที่บันทึกไว้ ({adminRosters.length}) --</option>
                  {adminRosters.map((r) => (
                    <option key={r.monthKey} value={r.monthKey}>
                      {formatThaiMonthYear(r.yearAD, r.month)} ({r.isPublished ? 'เผยแพร่แล้ว' : 'ฉบับร่าง'})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>

        {/* Main Workspace Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* TAB 1: MONTHLY ROSTER EDITOR */}
          {activeTab === 'schedule' && (
            <>
              {!draftRoster ? (
                <div className="py-16 px-6 text-center rounded-3xl bg-[#F4EFE6] border border-[#1E223D]/10 space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-[#1E223D] text-[#E6D5B7] flex items-center justify-center shadow-md">
                    <CalendarDays className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#1E223D]">
                      ยังไม่ได้สร้างตารางเวรประจำเดือน {formatThaiMonthYear(selectedYearAD, selectedMonth)}
                    </h3>
                    <p className="text-xs text-[#4B5277] mt-1 max-w-md mx-auto">
                      เริ่มต้นจัดตารางเวรใหม่สำหรับเดือนนี้ โดยระบบจะดึงรายชื่อบุคลากรและวันหยุดเสาร์-อาทิตย์ให้อัตโนมัติ
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => handleCreateMonthSchedule(false)}
                      className="px-5 py-2.5 rounded-xl bg-[#F54F1B] hover:bg-[#e04514] text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>สร้างตารางเวรใหม่ (ตารางว่าง)</span>
                    </button>

                    {adminRosters.length > 0 && (
                      <button
                        onClick={() => handleCreateMonthSchedule(true)}
                        className="px-5 py-2.5 rounded-xl bg-[#1E223D] hover:bg-[#2A3159] text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-sm transition-all"
                      >
                        <Copy className="w-4 h-4 text-[#E6D5B7]" />
                        <span>คัดลอกวันเวรจากเดือนล่าสุด</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Status & Quick Tools Bar */}
                  <div className="p-4 rounded-2xl bg-[#F4EFE6] border border-[#1E223D]/10 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                          draftRoster.isPublished
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            draftRoster.isPublished ? 'bg-emerald-600' : 'bg-amber-600'
                          }`}
                        />
                        {draftRoster.isPublished
                          ? 'สถานะ: เผยแพร่บนหน้าหลักแล้ว (ไม่มียอดเงิน)'
                          : 'สถานะ: ฉบับร่าง (เห็นเฉพาะหลังบ้าน)'}
                      </span>

                      <div className="px-3.5 py-1.5 rounded-xl bg-[#1E223D] text-white text-xs font-semibold flex items-center gap-2 shadow-xs">
                        <ShieldAlert className="w-3.5 h-3.5 text-[#E6D5B7]" />
                        <span>ยอดเบิกรวมทั้งสิ้น (ลับ):</span>
                        <span className="text-[#E6D5B7] font-mono text-sm font-bold tabular-nums">
                          {grandTotalPay.toLocaleString('th-TH')} บาท
                        </span>
                      </div>
                    </div>

                    {/* Tool Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={handleAutoWeekends}
                        className="px-3 py-2 rounded-xl bg-white hover:bg-[#F9F5EE] text-[#1E223D] border border-[#1E223D]/15 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        title="ไฮไลท์วันเสาร์-อาทิตย์เป็นวันหยุดอัตโนมัติ"
                      >
                        <CalendarCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>ตรวจจับ ส.-อา.</span>
                      </button>

                      <button
                        onClick={handleCheckThaiHolidays}
                        className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                          showHolidayPanel
                            ? 'bg-emerald-700 text-white border-emerald-700'
                            : 'bg-white hover:bg-emerald-50 text-emerald-800 border-emerald-300'
                        }`}
                        title="ตรวจสอบวันหยุดนักขัตฤกษ์และวันหยุดราชการไทยประจำเดือนนี้"
                      >
                        <CalendarSearch className="w-3.5 h-3.5" />
                        <span>
                          ตรวจสอบวันหยุดราชการไทย ({holidayReport.thaiHolidays.length})
                        </span>
                      </button>

                      <button
                        onClick={() => {
                          setShowHolidayPanel(true);
                          setShowAddHolidayForm(true);
                        }}
                        className="px-3 py-2 rounded-xl bg-white hover:bg-[#FFF5F2] text-[#F54F1B] border border-[#F54F1B]/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        title="เพิ่มวันหยุดราชการไทยหรือวันหยุดกรณีพิเศษ (กรณีไม่มีข้อมูล)"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>เพิ่มวันหยุดราชการไทย</span>
                      </button>

                      <button
                        onClick={handleSyncStaffIntoMonth}
                        className="px-3 py-2 rounded-xl bg-white hover:bg-[#F9F5EE] text-[#1E223D] border border-[#1E223D]/15 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        title="ดึงรายชื่อและค่าเวรล่าสุดจากแท็บบุคลากร"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-[#F54F1B]" />
                        <span>ซิงค์รายชื่อ/เรท</span>
                      </button>

                      <button
                        onClick={handleDownloadExcel}
                        disabled={isExportingExcel}
                        className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                        title="ส่งออกตารางเวรพร้อมสูตรและค่าตอบแทนเป็นไฟล์ Excel (.xlsx)"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>{isExportingExcel ? 'กำลังส่งออก...' : 'ดาวน์โหลด Excel'}</span>
                      </button>

                      <button
                        onClick={() => setShowOfficialPrintPreview(true)}
                        className="px-3.5 py-2 rounded-xl bg-[#1E223D] hover:bg-[#2A3159] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                      >
                        <Printer className="w-3.5 h-3.5 text-[#E6D5B7]" />
                        <span>พิมพ์เอกสารราชการ (มียอดเงิน)</span>
                      </button>
                    </div>
                  </div>

                  {/* Thai Public Holiday Verification & Custom Add Panel */}
                  {showHolidayPanel && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/75 border border-emerald-200 space-y-4 animate-fade-in">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0">
                            <Flag className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-emerald-950">
                              ตรวจสอบวันนักขัตฤกษ์และวันหยุดราชการไทย —{' '}
                              {formatThaiMonthYear(selectedYearAD, selectedMonth)}
                            </h4>
                            <p className="text-[11px] text-emerald-800">
                              พบวันเสาร์–อาทิตย์ {holidayReport.weekends.length} วัน · วันหยุดราชการไทย/ชดเชย{' '}
                              {holidayReport.thaiHolidays.length} วัน
                              {!holidayReport.hasLunarCoverage &&
                                ' (ปีนี้ยังไม่มีปฏิทินวันพระใหญ่ในระบบ กรุณาตรวจสอบหรือเพิ่มวันหยุดเอง)'}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => handleApplyAllThaiHolidays(true)}
                            className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>ไฮไลท์ทั้งหมดลงตาราง (ส.-อา. + นักขัตฤกษ์)</span>
                          </button>
                          {holidayReport.thaiHolidays.length > 0 && (
                            <button
                              onClick={() => handleApplyAllThaiHolidays(false)}
                              className="px-3 py-2 rounded-xl bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-semibold transition-colors"
                            >
                              เพิ่มเฉพาะนักขัตฤกษ์
                            </button>
                          )}
                          <button
                            onClick={() => setShowAddHolidayForm((prev) => !prev)}
                            className="px-3 py-2 rounded-xl bg-[#F54F1B] hover:bg-[#e04514] text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>เพิ่มวันหยุดราชการไทย</span>
                          </button>
                          <button
                            onClick={() => setShowHolidayPanel(false)}
                            className="p-2 rounded-xl text-emerald-800 hover:bg-emerald-100 transition-colors"
                            title="ปิดหน้าต่างตรวจสอบวันหยุด"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Detected Thai Holidays List or Empty Fallback */}
                      {holidayReport.thaiHolidays.length === 0 ? (
                        <div className="p-4 rounded-xl bg-white/90 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="text-xs text-[#4B5277]">
                            <span className="font-bold text-[#1E223D]">
                              ไม่พบข้อมูลวันหยุดนักขัตฤกษ์หรือวันหยุดราชการไทยในเดือน
                              {THAI_MONTHS[selectedMonth - 1]} {selectedYearAD + 543}
                            </span>
                            <p className="mt-0.5 text-[11px]">
                              หากมีวันหยุดราชการกรณีพิเศษตามมติ ครม. หรือวันสำคัญเพิ่มเติม สามารถกดปุ่มเพิ่มวันหยุดราชการไทยเพื่อบันทึกลงระบบได้ทันที
                            </p>
                          </div>
                          <button
                            onClick={() => setShowAddHolidayForm(true)}
                            className="px-3.5 py-2 rounded-xl bg-[#1E223D] hover:bg-[#2A3159] text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 self-start sm:self-center"
                          >
                            <Plus className="w-3.5 h-3.5 text-[#E6D5B7]" />
                            <span>เพิ่มวันหยุดราชการไทย</span>
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          {holidayReport.thaiHolidays.map((h) => {
                            const dow =
                              THAI_DAYS_SHORT[getDayOfWeek(h.yearAD, h.month, h.day)];
                            const isMarkedInGrid = draftRoster.holidays.includes(h.day);
                            return (
                              <div
                                key={`${h.dateKey}-${h.name}`}
                                className="px-3.5 py-2.5 rounded-xl bg-white border border-emerald-200/80 flex items-center justify-between gap-3"
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-bold text-[11px] tabular-nums">
                                      {h.day} {THAI_MONTHS[h.month - 1]} ({dow})
                                    </span>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F4EFE6] text-[#4B5277] font-medium">
                                      {h.isCustom
                                        ? 'เพิ่มเอง / ฐานข้อมูล'
                                        : THAI_HOLIDAY_CATEGORY_LABELS[h.category]}
                                    </span>
                                  </div>
                                  <p className="text-xs font-semibold text-[#1E223D] mt-1 truncate">
                                    {h.name}
                                  </p>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    onClick={() => handleToggleHoliday(h.day)}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                                      isMarkedInGrid
                                        ? 'bg-emerald-700 text-white border-emerald-700'
                                        : 'bg-[#F4EFE6] text-[#1E223D] border-[#1E223D]/15 hover:bg-emerald-100'
                                    }`}
                                  >
                                    {isMarkedInGrid ? 'ไฮไลท์แล้ว ✓' : '+ ไฮไลท์'}
                                  </button>
                                  {h.isCustom && h.id && (
                                    <button
                                      onClick={async () => {
                                        if (confirm(`ลบวันหยุด "${h.name}" ออกจากฐานข้อมูลหรือไม่?`)) {
                                          await onDeleteThaiHoliday(h.id!);
                                          showToast('ลบวันหยุดที่เพิ่มเองเรียบร้อยแล้ว');
                                        }
                                      }}
                                      className="p-1.5 rounded-lg text-[#4B5277] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                      title="ลบวันหยุดนี้"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Add Custom Thai Holiday Form */}
                      {showAddHolidayForm && (
                        <form
                          onSubmit={handleSubmitCustomHoliday}
                          className="p-4 rounded-xl bg-white border border-[#F54F1B]/30 space-y-3 shadow-xs"
                        >
                          <div className="flex items-center justify-between">
                            <h5 className="text-xs font-bold text-[#1E223D] flex items-center gap-1.5">
                              <Plus className="w-4 h-4 text-[#F54F1B]" />
                              <span>
                                เพิ่มวันหยุดราชการไทยประจำเดือน {formatThaiMonthYear(selectedYearAD, selectedMonth)}
                              </span>
                            </h5>
                            <button
                              type="button"
                              onClick={() => setShowAddHolidayForm(false)}
                              className="text-xs text-[#4B5277] hover:text-[#1E223D]"
                            >
                              ปิดฟอร์ม
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                            <div className="sm:col-span-3 space-y-1">
                              <label className="text-[11px] font-semibold text-[#1E223D]">
                                วันที่
                              </label>
                              <select
                                value={customHolidayDay}
                                onChange={(e) => setCustomHolidayDay(Number(e.target.value))}
                                className="w-full px-3 py-2 rounded-xl bg-[#F4EFE6] border border-[#1E223D]/15 text-xs font-semibold text-[#1E223D] outline-none"
                              >
                                {daysArray.map((d) => {
                                  const dow =
                                    THAI_DAYS_SHORT[getDayOfWeek(selectedYearAD, selectedMonth, d)];
                                  return (
                                    <option key={d} value={d}>
                                      วันที่ {d} ({dow}.)
                                    </option>
                                  );
                                })}
                              </select>
                            </div>

                            <div className="sm:col-span-5 space-y-1">
                              <label className="text-[11px] font-semibold text-[#1E223D]">
                                ชื่อวันหยุดราชการ / นักขัตฤกษ์ *
                              </label>
                              <input
                                type="text"
                                required
                                maxLength={200}
                                value={customHolidayName}
                                onChange={(e) => setCustomHolidayName(e.target.value)}
                                placeholder="เช่น วันหยุดราชการกรณีพิเศษ (มติ ครม.)"
                                className="w-full px-3 py-2 rounded-xl bg-white border border-[#1E223D]/15 text-xs outline-none focus:border-[#F54F1B]"
                              />
                            </div>

                            <div className="sm:col-span-4 space-y-1">
                              <label className="text-[11px] font-semibold text-[#1E223D]">
                                ประเภทวันหยุด
                              </label>
                              <select
                                value={customHolidayCategory}
                                onChange={(e) =>
                                  setCustomHolidayCategory(e.target.value as ThaiHolidayCategory)
                                }
                                className="w-full px-3 py-2 rounded-xl bg-white border border-[#1E223D]/15 text-xs outline-none focus:border-[#F54F1B]"
                              >
                                <option value="special">วันหยุดกรณีพิเศษ (มติ ครม.)</option>
                                <option value="royal">วันสำคัญราชวงศ์ / เฉลิมพระชนมพรรษา</option>
                                <option value="buddhist">วันสำคัญทางพระพุทธศาสนา</option>
                                <option value="national">วันหยุดราชการประจำปี</option>
                                <option value="substitute">วันหยุดชดเชย</option>
                              </select>
                            </div>
                          </div>

                          {/* Quick Preset Chips */}
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                            <span className="text-[#4B5277] font-medium">เลือกชื่อด่วน:</span>
                            {[
                              'วันหยุดราชการกรณีพิเศษ (มติ ครม.)',
                              'วันพืชมงคล',
                              'วันหยุดชดเชย',
                              'วันหยุดนักขัตฤกษ์เพิ่มเติม',
                            ].map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => setCustomHolidayName(preset)}
                                className="px-2.5 py-1 rounded-lg bg-[#F4EFE6] hover:bg-[#E6D5B7] text-[#1E223D] font-medium transition-colors"
                              >
                                + {preset}
                              </button>
                            ))}
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                            <label className="flex items-center gap-2 text-xs font-medium text-[#1E223D] cursor-pointer">
                              <input
                                type="checkbox"
                                checked={applyNewHolidayToRoster}
                                onChange={(e) => setApplyNewHolidayToRoster(e.target.checked)}
                                className="rounded text-[#F54F1B]"
                              />
                              <span>ทำเครื่องหมายสีเขียวลงในตารางเวรเดือนนี้ทันที</span>
                            </label>

                            <button
                              type="submit"
                              disabled={isSaving || !customHolidayName.trim()}
                              className="px-4 py-2 rounded-xl bg-[#F54F1B] hover:bg-[#e04514] disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
                            >
                              <Save className="w-3.5 h-3.5" />
                              <span>บันทึกวันหยุดลงฐานข้อมูล</span>
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}

                  {/* Helper Tip */}
                  <div className="text-xs text-[#4B5277] flex flex-wrap items-center justify-between gap-2 px-1">
                    <span>
                      💡 <strong>วิธีใช้งาน:</strong> คลิกที่ช่องวันที่ <strong>ช</strong> หรือ <strong>บ</strong> เพื่อจัด/ยกเลิกเวร · คลิกที่<strong>ตัวเลขวันที่ด้านบน</strong>เพื่อกำหนดวันหยุดนักขัตฤกษ์ (สีเขียว) · วันที่ที่มี <strong className="text-emerald-700">★</strong> คือวันหยุดราชการไทย
                    </span>
                  </div>

                  {/* Interactive 1..31 Schedule Matrix with Confidential Rates & Money */}
                  <div className="rounded-2xl border border-[#1E223D]/15 bg-white overflow-x-auto shadow-xs">
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#F4EFE6] text-[#1E223D] border-b border-[#1E223D]/15">
                          <th className="sticky left-0 z-20 bg-[#F4EFE6] px-3 py-2.5 text-left font-bold border-r border-[#1E223D]/15 min-w-[160px] whitespace-nowrap">
                            ชื่อ-สกุล
                          </th>
                          <th className="px-2.5 py-2.5 text-left font-bold border-r border-[#1E223D]/15 min-w-[120px] whitespace-nowrap">
                            ตำแหน่ง
                          </th>
                          <th className="px-2 py-2.5 text-right font-bold border-r border-[#1E223D]/15 min-w-[78px] whitespace-nowrap">
                            เวรละ (ลับ)
                          </th>
                          {daysArray.map((day) => {
                            const isHoliday = draftRoster.holidays.includes(day);
                            const holidayTitle = holidayNameByDay.get(day);
                            const dowLabel = THAI_DAYS_SHORT[getDayOfWeek(selectedYearAD, selectedMonth, day)];
                            return (
                              <th
                                key={day}
                                onClick={() => handleToggleHoliday(day)}
                                title={
                                  holidayTitle
                                    ? `วันที่ ${day}: ${holidayTitle} (คลิกเพื่อสลับวันหยุด)`
                                    : `คลิกเพื่อสลับวันหยุดวันที่ ${day}`
                                }
                                className={`px-0.5 py-2 text-center font-bold border-r border-[#1E223D]/10 min-w-[30px] cursor-pointer select-none transition-colors tabular-nums ${
                                  isHoliday
                                    ? 'bg-[#e2eed8] text-emerald-900 hover:bg-[#d2e5c3]'
                                    : 'hover:bg-white'
                                }`}
                              >
                                <div className="flex items-center justify-center gap-0.5">
                                  <span>{day}</span>
                                  {holidayTitle && (
                                    <span className="text-[8px] text-[#F54F1B]" aria-hidden="true">
                                      ★
                                    </span>
                                  )}
                                </div>
                                <div className="text-[9px] font-normal text-[#4B5277]">{dowLabel}</div>
                              </th>
                            );
                          })}
                          <th className="px-2.5 py-2.5 text-center font-bold border-r border-[#1E223D]/15 min-w-[64px] whitespace-nowrap">
                            จำนวน
                          </th>
                          <th className="px-3 py-2.5 text-right font-bold bg-[#1E223D] text-[#E6D5B7] min-w-[88px] whitespace-nowrap">
                            จำนวนเงิน
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {[...draftRoster.rows]
                          .sort((a, b) => a.order - b.order)
                          .map((row) => {
                            const mCount = row.morningDays.length;
                            const aCount = row.afternoonDays.length;
                            const rowPay = mCount * row.morningRate + aCount * row.afternoonRate;

                            return (
                              <React.Fragment key={row.staffId}>
                                {/* Morning Row */}
                                <tr className="border-b border-[#1E223D]/10">
                                  <td
                                    rowSpan={2}
                                    className="sticky left-0 z-10 bg-white px-3 py-2 font-semibold text-[#1E223D] border-r border-[#1E223D]/15 align-middle whitespace-nowrap"
                                  >
                                    {row.name}
                                  </td>
                                  <td
                                    rowSpan={2}
                                    className="px-2.5 py-2 text-[#4B5277] border-r border-[#1E223D]/15 align-middle text-[11px]"
                                  >
                                    {row.position}
                                  </td>
                                  <td className="px-2 py-1.5 text-right font-mono text-[11px] text-amber-800 bg-amber-50/60 border-r border-[#1E223D]/15 whitespace-nowrap tabular-nums">
                                    {row.morningRate} (ช):
                                  </td>
                                  {daysArray.map((day) => {
                                    const has = row.morningDays.includes(day);
                                    const isHol = draftRoster.holidays.includes(day);
                                    return (
                                      <td
                                        key={day}
                                        onClick={() => handleToggleShift(row.staffId, 'morning', day)}
                                        className={`p-0.5 text-center border-r border-[#1E223D]/10 cursor-pointer select-none transition-colors ${
                                          isHol ? 'bg-[#e7efe0]/80 hover:bg-[#d7e6cb]' : 'hover:bg-amber-50'
                                        }`}
                                      >
                                        <div
                                          className={`w-6 h-6 mx-auto rounded-md flex items-center justify-center text-[11px] font-bold transition-all ${
                                            has
                                              ? 'bg-amber-500 text-white shadow-2xs scale-95'
                                              : 'text-transparent hover:text-amber-400'
                                          }`}
                                        >
                                          ช
                                        </div>
                                      </td>
                                    );
                                  })}
                                  <td
                                    rowSpan={2}
                                    className="px-2 py-2 text-center border-r border-[#1E223D]/15 font-semibold tabular-nums whitespace-nowrap bg-[#F9F5EE]"
                                  >
                                    <div className="text-amber-800">ช : {mCount}</div>
                                    <div className="text-[#F54F1B] mt-0.5">บ : {aCount}</div>
                                  </td>
                                  <td
                                    rowSpan={2}
                                    className="px-3 py-2 text-right font-bold text-[#1E223D] bg-[#F4EFE6]/60 tabular-nums whitespace-nowrap"
                                  >
                                    {rowPay.toLocaleString('th-TH')}
                                  </td>
                                </tr>

                                {/* Afternoon Row */}
                                <tr className="border-b border-[#1E223D]/20">
                                  <td className="px-2 py-1.5 text-right font-mono text-[11px] text-[#F54F1B] bg-[#F54F1B]/5 border-r border-[#1E223D]/15 whitespace-nowrap tabular-nums">
                                    {row.afternoonRate} (บ):
                                  </td>
                                  {daysArray.map((day) => {
                                    const has = row.afternoonDays.includes(day);
                                    const isHol = draftRoster.holidays.includes(day);
                                    return (
                                      <td
                                        key={day}
                                        onClick={() => handleToggleShift(row.staffId, 'afternoon', day)}
                                        className={`p-0.5 text-center border-r border-[#1E223D]/10 cursor-pointer select-none transition-colors ${
                                          isHol ? 'bg-[#e7efe0]/80 hover:bg-[#d7e6cb]' : 'hover:bg-[#F54F1B]/5'
                                        }`}
                                      >
                                        <div
                                          className={`w-6 h-6 mx-auto rounded-md flex items-center justify-center text-[11px] font-bold transition-all ${
                                            has
                                              ? 'bg-[#F54F1B] text-white shadow-2xs scale-95'
                                              : 'text-transparent hover:text-[#F54F1B]/50'
                                          }`}
                                        >
                                          บ
                                        </div>
                                      </td>
                                    );
                                  })}
                                </tr>
                              </React.Fragment>
                            );
                          })}

                        {/* Daily Coverage Helper Row + Grand Total */}
                        <tr className="bg-[#F4EFE6] border-t-2 border-[#1E223D]/20 font-semibold text-[10px]">
                          <td colSpan={3} className="sticky left-0 z-10 bg-[#F4EFE6] px-3 py-2 text-[#1E223D] border-r border-[#1E223D]/15">
                            สรุปจำนวนคนขึ้นเวรแต่ละวัน (ช / บ)
                          </td>
                          {daysArray.map((day) => {
                            const cov = dailyCoverage[day] || { morning: 0, afternoon: 0 };
                            const totalDay = cov.morning + cov.afternoon;
                            return (
                              <td
                                key={day}
                                className={`text-center py-1.5 border-r border-[#1E223D]/10 tabular-nums ${
                                  totalDay === 0 ? 'bg-amber-100/70 text-amber-800' : 'text-[#1E223D]'
                                }`}
                                title={`วันที่ ${day}: เวรเช้า ${cov.morning} คน, เวรบ่าย ${cov.afternoon} คน`}
                              >
                                <div className="text-amber-700">{cov.morning || '-'}</div>
                                <div className="text-[#F54F1B]">{cov.afternoon || '-'}</div>
                              </td>
                            );
                          })}
                          <td className="px-2 py-2 text-center font-bold text-[#1E223D] border-r border-[#1E223D]/15">
                            รวมทั้งสิ้น
                          </td>
                          <td className="px-3 py-2 text-right font-bold text-sm text-[#F54F1B] bg-[#1E223D] tabular-nums whitespace-nowrap">
                            {grandTotalPay.toLocaleString('th-TH')}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Public Note & Bottom Action Buttons */}
                  <div className="p-4 rounded-2xl bg-[#F4EFE6] border border-[#1E223D]/10 space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#1E223D]">
                        หมายเหตุเพิ่มเติมสำหรับเดือนนี้ (จะแสดงบนหน้าหลักเมื่อเผยแพร่ · ห้ามใส่ยอดเงิน)
                      </label>
                      <input
                        type="text"
                        value={draftRoster.note || ''}
                        onChange={(e) => setDraftRoster({ ...draftRoster, note: e.target.value })}
                        placeholder="เช่น กรณีแลกเวรให้แจ้งหัวหน้ากลุ่มงานล่วงหน้าอย่างน้อย 1 วัน"
                        className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#1E223D]/15 text-xs text-[#1E223D] outline-none focus:border-[#F54F1B]"
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <button
                        type="button"
                        onClick={handleDeleteCurrentMonth}
                        disabled={isSaving}
                        className="px-3.5 py-2 rounded-xl text-rose-700 hover:bg-rose-100 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>ลบตารางเดือนนี้</span>
                      </button>

                      <div className="flex flex-wrap items-center gap-2.5">
                        {draftRoster.isPublished && (
                          <button
                            type="button"
                            onClick={() => handleSaveRoster(false)}
                            disabled={isSaving}
                            className="px-4 py-2.5 rounded-xl bg-white hover:bg-amber-50 text-amber-800 border border-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                          >
                            <EyeOff className="w-4 h-4" />
                            <span>ซ่อนจากหน้าหลัก (ฉบับร่าง)</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleSaveRoster(draftRoster.isPublished)}
                          disabled={isSaving}
                          className="px-4 py-2.5 rounded-xl bg-[#1E223D] hover:bg-[#2A3159] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                        >
                          <Save className="w-4 h-4 text-[#E6D5B7]" />
                          <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSaveRoster(true)}
                          disabled={isSaving}
                          className="px-5 py-2.5 rounded-xl bg-[#F54F1B] hover:bg-[#e04514] text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-md shadow-[#F54F1B]/25"
                        >
                          <Globe className="w-4 h-4" />
                          <span>
                            {draftRoster.isPublished
                              ? 'อัปเดตและเผยแพร่ขึ้นหน้าหลัก'
                              : 'เผยแพร่ขึ้นหน้าหลัก (ไม่แสดงยอดเงิน)'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* TAB 2: STAFF & CONFIDENTIAL RATES */}
          {activeTab === 'staff' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Staff Form */}
              <form
                onSubmit={handleSubmitStaff}
                className="p-5 rounded-2xl bg-[#F4EFE6] border border-[#1E223D]/10 space-y-4 h-fit"
              >
                <h3 className="text-sm font-bold text-[#1E223D] flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#F54F1B]" />
                  <span>{editingStaffId ? 'แก้ไขข้อมูลบุคลากร' : 'เพิ่มบุคลากรและอัตราค่าเวร'}</span>
                </h3>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#1E223D]">ชื่อ-สกุล *</label>
                  <input
                    type="text"
                    required
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    placeholder="เช่น นายธีรดนย์ พลค้อ"
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#1E223D]/15 text-xs outline-none focus:border-[#F54F1B]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#1E223D]">ตำแหน่ง</label>
                  <input
                    type="text"
                    value={staffPosition}
                    onChange={(e) => setStaffPosition(e.target.value)}
                    placeholder="เช่น เภสัชกร ชำนาญการ"
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#1E223D]/15 text-xs outline-none focus:border-[#F54F1B]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#1E223D]">ค่าเวร ช (บาท)</label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={staffMorningRate}
                      onChange={(e) => setStaffMorningRate(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#1E223D]/15 text-xs font-mono outline-none focus:border-[#F54F1B]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#1E223D]">ค่าเวร บ (บาท)</label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={staffAfternoonRate}
                      onChange={(e) => setStaffAfternoonRate(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#1E223D]/15 text-xs font-mono outline-none focus:border-[#F54F1B]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 items-center">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#1E223D]">ลำดับที่</label>
                    <input
                      type="number"
                      min={1}
                      value={staffOrder}
                      onChange={(e) => setStaffOrder(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#1E223D]/15 text-xs font-mono outline-none"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-xs font-semibold text-[#1E223D] pt-5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={staffActive}
                      onChange={(e) => setStaffActive(e.target.checked)}
                      className="rounded text-[#F54F1B]"
                    />
                    <span>ขึ้นเวรประจำ (Active)</span>
                  </label>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-[#F54F1B] hover:bg-[#e04514] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{editingStaffId ? 'บันทึกการแก้ไข' : 'เพิ่มบุคลากร'}</span>
                  </button>
                  {editingStaffId && (
                    <button
                      type="button"
                      onClick={handleResetStaffForm}
                      className="px-3 py-2.5 rounded-xl bg-white text-xs font-semibold text-[#4B5277]"
                    >
                      ยกเลิก
                    </button>
                  )}
                </div>
              </form>

              {/* Staff List */}
              <div className="lg:col-span-2 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#1E223D]">
                    รายชื่อบุคลากรและอัตราค่าตอบแทนลับ ({staffList.length} คน)
                  </h3>
                </div>

                <div className="space-y-2.5">
                  {[...staffList]
                    .sort((a, b) => a.order - b.order)
                    .map((s) => (
                      <div
                        key={s.id}
                        className="p-4 rounded-2xl bg-[#F4EFE6] border border-[#1E223D]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded-md bg-[#1E223D] text-[#E6D5B7] text-[10px] font-mono font-bold">
                              #{s.order}
                            </span>
                            <span className="text-sm font-bold text-[#1E223D]">{s.name}</span>
                            <span className="text-xs text-[#4B5277]">· {s.position}</span>
                            {!s.isActive && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-600">
                                พักเวร
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-[#4B5277] font-mono tabular-nums">
                            อัตราค่าตอบแทน (ลับ): เวรเช้า (ช){' '}
                            <strong className="text-[#1E223D]">{s.morningRate}</strong> บาท · เวรบ่าย (บ){' '}
                            <strong className="text-[#1E223D]">{s.afternoonRate}</strong> บาท
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            onClick={() => handleStartEditStaff(s)}
                            className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#F9F5EE] border border-[#1E223D]/10 text-xs font-semibold text-[#1E223D] flex items-center gap-1.5"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-[#F54F1B]" />
                            <span>แก้ไข</span>
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm(`ยืนยันการลบ "${s.name}" ออกจากรายชื่อ?`)) {
                                await onDeleteStaff(s.id);
                                showToast('ลบรายชื่อบุคลากรแล้ว');
                              }
                            }}
                            className="p-2 rounded-xl text-[#4B5277] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: HEADER & SIGNATORIES CONFIG */}
          {activeTab === 'config' && (
            <form onSubmit={handleSaveConfigSubmit} className="max-w-3xl space-y-5">
              <div className="p-5 rounded-2xl bg-[#F4EFE6] border border-[#1E223D]/10 space-y-4">
                <h3 className="text-sm font-bold text-[#1E223D]">
                  หัวข้อตารางและคำอธิบายเวลาปฏิบัติงาน
                </h3>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#1E223D]">ชื่อหัวเรื่องตาราง</label>
                  <input
                    type="text"
                    value={configForm.departmentTitle}
                    onChange={(e) => setConfigForm({ ...configForm, departmentTitle: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl bg-white border border-[#1E223D]/15 text-xs outline-none focus:border-[#F54F1B]"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#1E223D]">คำอธิบายเวรเช้า (ช)</label>
                    <input
                      type="text"
                      value={configForm.morningLabel}
                      onChange={(e) => setConfigForm({ ...configForm, morningLabel: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl bg-white border border-[#1E223D]/15 text-xs outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#1E223D]">คำอธิบายเวรบ่าย (บ)</label>
                    <input
                      type="text"
                      value={configForm.afternoonLabel}
                      onChange={(e) => setConfigForm({ ...configForm, afternoonLabel: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl bg-white border border-[#1E223D]/15 text-xs outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Left Signatory */}
                <div className="p-5 rounded-2xl bg-[#F4EFE6] border border-[#1E223D]/10 space-y-3">
                  <h4 className="text-xs font-bold text-[#F54F1B] uppercase">ผู้ลงนามฝั่งซ้าย (หัวหน้ากลุ่มงาน)</h4>
                  <input
                    type="text"
                    value={configForm.leftSignatoryName}
                    onChange={(e) => setConfigForm({ ...configForm, leftSignatoryName: e.target.value })}
                    placeholder="ชื่อ-สกุล"
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#1E223D]/15 text-xs outline-none"
                  />
                  <input
                    type="text"
                    value={configForm.leftSignatoryPosition}
                    onChange={(e) => setConfigForm({ ...configForm, leftSignatoryPosition: e.target.value })}
                    placeholder="ตำแหน่งทางวิชาการ/ระดับ"
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#1E223D]/15 text-xs outline-none"
                  />
                  <input
                    type="text"
                    value={configForm.leftSignatoryRole}
                    onChange={(e) => setConfigForm({ ...configForm, leftSignatoryRole: e.target.value })}
                    placeholder="ตำแหน่งบริหาร"
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#1E223D]/15 text-xs outline-none"
                  />
                </div>

                {/* Right Signatory */}
                <div className="p-5 rounded-2xl bg-[#F4EFE6] border border-[#1E223D]/10 space-y-3">
                  <h4 className="text-xs font-bold text-[#F54F1B] uppercase">ผู้ลงนามฝั่งขวา (ผู้อนุมัติ)</h4>
                  <input
                    type="text"
                    value={configForm.rightSignatoryName}
                    onChange={(e) => setConfigForm({ ...configForm, rightSignatoryName: e.target.value })}
                    placeholder="ชื่อ-สกุล"
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#1E223D]/15 text-xs outline-none"
                  />
                  <input
                    type="text"
                    value={configForm.rightSignatoryPosition}
                    onChange={(e) => setConfigForm({ ...configForm, rightSignatoryPosition: e.target.value })}
                    placeholder="ตำแหน่งทางวิชาการ/ระดับ"
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#1E223D]/15 text-xs outline-none"
                  />
                  <input
                    type="text"
                    value={configForm.rightSignatoryRole}
                    onChange={(e) => setConfigForm({ ...configForm, rightSignatoryRole: e.target.value })}
                    placeholder="ตำแหน่งบริหาร"
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#1E223D]/15 text-xs outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-[#F54F1B] hover:bg-[#e04514] text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md"
              >
                <Save className="w-4 h-4" />
                <span>บันทึกการตั้งค่าเอกสารราชการ</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
