import React, { useState } from 'react';
import {
  X,
  Plus,
  Edit2,
  Trash2,
  Save,
  RotateCcw,
  Download,
  Upload,
  Lock,
  Layers,
  CheckCircle2,
  FolderPlus,
  ExternalLink,
  Sliders,
  Settings,
  Info,
} from 'lucide-react';
import { AppItem, Category, Announcement, PortalSettings, AppStatus } from '../types/portal';
import { DynamicIcon, AVAILABLE_ICONS } from './DynamicIcon';

interface AdminManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  apps: AppItem[];
  categories: Category[];
  announcements: Announcement[];
  settings: PortalSettings;
  onSaveApp: (app: AppItem) => void;
  onDeleteApp: (id: string) => void;
  onAddCategory: (category: Category) => void;
  onSaveSettings: (settings: PortalSettings) => void;
  onSaveAnnouncement: (announcement: Announcement) => void;
  onDeleteAnnouncement: (id: string) => void;
  onResetToDefaults: () => void;
  onImportData: (data: { apps?: AppItem[]; categories?: Category[]; announcements?: Announcement[]; settings?: PortalSettings }) => void;
  initialEditingApp?: AppItem | null;
}

export const AdminManageModal: React.FC<AdminManageModalProps> = ({
  isOpen,
  onClose,
  apps,
  categories,
  announcements,
  settings,
  onSaveApp,
  onDeleteApp,
  onAddCategory,
  onSaveSettings,
  onSaveAnnouncement,
  onDeleteAnnouncement,
  onResetToDefaults,
  onImportData,
  initialEditingApp,
}) => {
  const [activeTab, setActiveTab] = useState<'apps' | 'app_form' | 'announcements' | 'settings'>('apps');
  
  // App Form State
  const [editingAppId, setEditingAppId] = useState<string | null>(null);
  const [appTitle, setAppTitle] = useState('');
  const [appDescription, setAppDescription] = useState('');
  const [appUrl, setAppUrl] = useState('');
  const [appCategoryId, setAppCategoryId] = useState('');
  const [appIconName, setAppIconName] = useState('Package');
  const [appTag, setAppTag] = useState('');
  const [appStatus, setAppStatus] = useState<AppStatus>('online');

  // Announcement Form State
  const [newAnnTitle, setNewAnnTitle] = useState('');
  const [newAnnContent, setNewAnnContent] = useState('');
  const [newAnnType, setNewAnnType] = useState<Announcement['type']>('info');

  // Settings State
  const [newPin, setNewPin] = useState(settings.pin);
  const [hospitalName, setHospitalName] = useState(settings.hospitalName);
  const [subtitle, setSubtitle] = useState(settings.subtitle);
  const [successMsg, setSuccessMsg] = useState('');

  // New Category State
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [showAddCat, setShowAddCat] = useState(false);

  // If initialEditingApp is passed, populate and switch tab
  React.useEffect(() => {
    if (initialEditingApp) {
      setEditingAppId(initialEditingApp.id);
      setAppTitle(initialEditingApp.title);
      setAppDescription(initialEditingApp.description);
      setAppUrl(initialEditingApp.url);
      setAppCategoryId(initialEditingApp.categoryId);
      setAppIconName(initialEditingApp.iconName || 'Package');
      setAppTag(initialEditingApp.tag || '');
      setAppStatus(initialEditingApp.status || 'online');
      setActiveTab('app_form');
    }
  }, [initialEditingApp]);

  if (!isOpen) return null;

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleStartAddApp = () => {
    setEditingAppId(null);
    setAppTitle('');
    setAppDescription('');
    setAppUrl('');
    setAppCategoryId(categories[0]?.id || 'cat-inventory');
    setAppIconName('Package');
    setAppTag('ระบบงานใหม่');
    setAppStatus('online');
    setActiveTab('app_form');
  };

  const handleEditApp = (app: AppItem) => {
    setEditingAppId(app.id);
    setAppTitle(app.title);
    setAppDescription(app.description);
    setAppUrl(app.url);
    setAppCategoryId(app.categoryId);
    setAppIconName(app.iconName);
    setAppTag(app.tag);
    setAppStatus(app.status);
    setActiveTab('app_form');
  };

  const handleSaveAppForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appTitle.trim() || !appUrl.trim()) {
      alert('กรุณากรอกชื่อระบบและ URL ให้ครบถ้วน');
      return;
    }

    const appToSave: AppItem = {
      id: editingAppId || `app-${Date.now()}`,
      title: appTitle.trim(),
      description: appDescription.trim(),
      url: appUrl.trim(),
      categoryId: appCategoryId || categories[0]?.id || 'cat-inventory',
      iconName: appIconName,
      tag: appTag.trim() || 'ทั่วไป',
      status: appStatus,
      isFavorite: editingAppId ? apps.find((a) => a.id === editingAppId)?.isFavorite : false,
      updatedAt: new Date().toISOString(),
    };

    onSaveApp(appToSave);
    showNotification(editingAppId ? 'บันทึกการแก้ไขเรียบร้อยแล้ว' : 'เพิ่มระบบงานใหม่เรียบร้อยแล้ว');
    setActiveTab('apps');
  };

  const handleSaveAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnTitle.trim() || !newAnnContent.trim()) return;

    const newAnn: Announcement = {
      id: `ann-${Date.now()}`,
      title: newAnnTitle.trim(),
      content: newAnnContent.trim(),
      date: new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }),
      type: newAnnType,
      isPinned: false,
    };

    onSaveAnnouncement(newAnn);
    setNewAnnTitle('');
    setNewAnnContent('');
    showNotification('เพิ่มประกาศเรียบร้อยแล้ว');
  };

  const handleSaveSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPin || newPin.length < 4) {
      alert('รหัส PIN ต้องมีความยาวอย่างน้อย 4 หลัก');
      return;
    }

    onSaveSettings({
      pin: newPin,
      hospitalName: hospitalName.trim(),
      departmentName: settings.departmentName,
      subtitle: subtitle.trim(),
    });
    showNotification('บันทึกการตั้งค่าระบบและรหัส PIN สำเร็จ');
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const newCategory: Category = {
      id: `cat-${Date.now()}`,
      name: newCatName.trim(),
      description: newCatDesc.trim() || 'หมวดหมู่เพิ่มเติม',
      iconName: 'FolderKanban',
      accentColor: '#F54F1B',
    };

    onAddCategory(newCategory);
    setAppCategoryId(newCategory.id);
    setNewCatName('');
    setNewCatDesc('');
    setShowAddCat(false);
    showNotification(`เพิ่มหมวดหมู่ "${newCategory.name}" สำเร็จ`);
  };

  const handleExportJson = () => {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      apps,
      categories,
      announcements,
      settings,
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `pharmacy_portal_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.apps) {
          onImportData(parsed);
          showNotification('นำเข้าข้อมูลสำเร็จ');
        } else {
          alert('รูปแบบไฟล์ JSON ไม่ถูกต้อง');
        }
      } catch (err) {
        alert('เกิดข้อผิดพลาดในการอ่านไฟล์ JSON');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#1E223D]/50 backdrop-blur-md">
      <div
        className="relative w-full max-w-4xl h-[90vh] max-h-[850px] rounded-3xl bg-white/95 backdrop-blur-2xl flex flex-col overflow-hidden border border-[#1E223D]/15 shadow-2xl text-[#1E223D]"
      >
        {/* Modal Top Header */}
        <div className="px-6 py-5 border-b border-[#1E223D]/10 flex items-center justify-between gap-4 shrink-0 bg-[#F4EFE6]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1E223D] flex items-center justify-center text-[#E6D5B7] shadow-xs">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1E223D] tracking-tight">
                ศูนย์จัดการระบบ (Admin Console)
              </h2>
              <p className="text-xs text-[#4B5277]">
                เพิ่ม ลบ แก้ไข ลิงก์ระบบงาน ประกาศ และตั้งค่ารหัสผ่าน PIN
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-[#4B5277] hover:text-[#1E223D] hover:bg-[#1E223D]/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Toast */}
        {successMsg && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2 text-xs text-emerald-800 font-semibold flex items-center gap-2 animate-fade-in shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="px-6 pt-3 pb-2 border-b border-[#1E223D]/10 flex items-center gap-2 overflow-x-auto shrink-0 bg-[#F9F5EE]">
          <button
            onClick={() => setActiveTab('apps')}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'apps'
                ? 'bg-[#F54F1B] text-white shadow-xs'
                : 'text-[#4B5277] hover:text-[#1E223D] hover:bg-white/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>รายการแอป ({apps.length})</span>
          </button>

          <button
            onClick={handleStartAddApp}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'app_form'
                ? 'bg-[#F54F1B] text-white shadow-xs'
                : 'text-[#4B5277] hover:text-[#1E223D] hover:bg-white/60'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>{editingAppId ? 'แก้ไขข้อมูลแอป' : 'เพิ่มแอปใหม่'}</span>
          </button>

          <button
            onClick={() => setActiveTab('announcements')}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'announcements'
                ? 'bg-[#F54F1B] text-white shadow-xs'
                : 'text-[#4B5277] hover:text-[#1E223D] hover:bg-white/60'
            }`}
          >
            <Info className="w-4 h-4" />
            <span>จัดการประกาศ ({announcements.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'settings'
                ? 'bg-[#F54F1B] text-white shadow-xs'
                : 'text-[#4B5277] hover:text-[#1E223D] hover:bg-white/60'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>ตั้งค่า & รหัส PIN</span>
          </button>
        </div>

        {/* Tab Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: LIST APPS */}
          {activeTab === 'apps' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2">
                <div>
                  <h3 className="text-base font-bold text-[#1E223D]">
                    ระบบงานและแอปพลิเคชันทั้งหมด ({apps.length})
                  </h3>
                  <p className="text-xs text-[#4B5277]">
                    คลิกปุ่ม &quot;แก้ไข&quot; เพื่อปรับเปลี่ยนข้อมูล URL, ไอคอน หรือสถานะการใช้งาน
                  </p>
                </div>
                <button
                  onClick={handleStartAddApp}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#F54F1B] hover:bg-[#e04514] text-white flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>เพิ่มแอปใหม่</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {apps.map((app) => {
                  const cat = categories.find((c) => c.id === app.categoryId);
                  return (
                    <div
                      key={app.id}
                      className="p-4 rounded-2xl bg-[#F4EFE6] hover:bg-white border border-[#1E223D]/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors shadow-2xs"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[#1E223D] flex items-center justify-center text-[#E6D5B7] shrink-0 shadow-xs">
                          <DynamicIcon name={app.iconName} className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-xs font-bold text-[#1E223D] truncate">
                              {app.title}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#E6D5B7] text-[#1E223D]">
                              {cat?.name || 'ทั่วไป'}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                app.status === 'online'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {app.status === 'online' ? 'Active' : 'ปิดปรับปรุง'}
                            </span>
                          </div>
                          <p className="text-xs text-[#4B5277] font-mono truncate max-w-md">
                            {app.url}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <a
                          href={app.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl text-[#4B5277] hover:text-[#1E223D] hover:bg-[#1E223D]/5 transition-colors"
                          title="ทดสอบเปิดลิงก์"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => handleEditApp(app)}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-[#F9F5EE] text-[#1E223D] border border-[#1E223D]/10 flex items-center gap-1.5 transition-colors shadow-xs"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-[#F54F1B]" />
                          <span>แก้ไข</span>
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`ยืนยันการลบระบบ "${app.title}" หรือไม่?`)) {
                              onDeleteApp(app.id);
                              showNotification('ลบระบบงานเรียบร้อยแล้ว');
                            }
                          }}
                          className="p-2 rounded-xl text-[#4B5277] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="ลบแอปนี้"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: APP FORM (ADD/EDIT) */}
          {activeTab === 'app_form' && (
            <form onSubmit={handleSaveAppForm} className="space-y-5 max-w-2xl">
              <div>
                <h3 className="text-base font-bold text-[#1E223D]">
                  {editingAppId ? 'แก้ไขข้อมูลระบบงาน' : 'เพิ่มระบบงานและแอปพลิเคชันใหม่'}
                </h3>
                <p className="text-xs text-[#4B5277]">
                  กรอกข้อมูลเพื่อเชื่อมโยง Google Apps Script, AppSheet หรือระบบสารสนเทศของโรงพยาบาล
                </p>
              </div>

              {/* Title Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#1E223D]">
                  ชื่อระบบงาน (App Title) <span className="text-[#F54F1B]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={appTitle}
                  onChange={(e) => setAppTitle(e.target.value)}
                  placeholder="เช่น ระบบเบิกจ่ายเวชภัณฑ์ยาผู้ป่วยใน"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F4EFE6] border border-[#1E223D]/15 focus:border-[#F54F1B] focus:bg-white text-[#1E223D] placeholder-[#6E7395] text-sm outline-none"
                />
              </div>

              {/* URL Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#1E223D]">
                  ลิงก์เป้าหมาย URL (Google Apps Script / Web App) <span className="text-[#F54F1B]">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={appUrl}
                  onChange={(e) => setAppUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F4EFE6] border border-[#1E223D]/15 focus:border-[#F54F1B] focus:bg-white font-mono text-xs text-[#1E223D] placeholder-[#6E7395] outline-none"
                />
              </div>

              {/* Category Selection */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#1E223D]">
                    หมวดหมู่ของระบบงาน (Category)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddCat(!showAddCat)}
                    className="text-xs text-[#F54F1B] font-semibold hover:underline flex items-center gap-1"
                  >
                    <FolderPlus className="w-3 h-3" />
                    <span>{showAddCat ? 'ซ่อนการเพิ่มหมวด' : '+ เพิ่มหมวดหมู่ใหม่'}</span>
                  </button>
                </div>

                {showAddCat && (
                  <div className="p-3 rounded-xl bg-[#F4EFE6] border border-[#1E223D]/15 space-y-2 mb-2">
                    <input
                      type="text"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      placeholder="ชื่อหมวดหมู่ใหม่ เช่น งานบริการจ่ายยาผู้ป่วยนอก"
                      className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#1E223D]/15 text-xs text-[#1E223D]"
                    />
                    <button
                      type="button"
                      onClick={handleCreateCategory}
                      className="px-3 py-1 rounded-lg text-xs bg-[#1E223D] text-white font-semibold hover:bg-[#2A3159]"
                    >
                      สร้างหมวดหมู่
                    </button>
                  </div>
                )}

                <select
                  value={appCategoryId}
                  onChange={(e) => setAppCategoryId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F4EFE6] border border-[#1E223D]/15 focus:border-[#F54F1B] text-[#1E223D] text-sm outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#1E223D]">
                  คำอธิบายการทำงาน (Description)
                </label>
                <textarea
                  rows={2}
                  value={appDescription}
                  onChange={(e) => setAppDescription(e.target.value)}
                  placeholder="อธิบายสรุปสั้นๆ เกี่ยวกับวัตถุประสงค์และการทำงานของระบบ"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F4EFE6] border border-[#1E223D]/15 focus:border-[#F54F1B] focus:bg-white text-[#1E223D] placeholder-[#6E7395] text-sm outline-none"
                />
              </div>

              {/* Tag & Status Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#1E223D]">
                    ป้ายกำกับย่อย (Tag/Badge)
                  </label>
                  <input
                    type="text"
                    value={appTag}
                    onChange={(e) => setAppTag(e.target.value)}
                    placeholder="เช่น คลังยาหลัก, LINE Bot, Ward Round"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F4EFE6] border border-[#1E223D]/15 text-[#1E223D] text-sm outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#1E223D]">
                    สถานะการทำงาน (Live Status)
                  </label>
                  <select
                    value={appStatus}
                    onChange={(e) => setAppStatus(e.target.value as AppStatus)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F4EFE6] border border-[#1E223D]/15 text-[#1E223D] text-sm outline-none"
                  >
                    <option value="online">Active (พร้อมใช้งานปกติ)</option>
                    <option value="maintenance">ปิดปรับปรุงชั่วคราว (Maintenance)</option>
                    <option value="updated">อัปเดตระบบเวอร์ชันใหม่ (Updated)</option>
                  </select>
                </div>
              </div>

              {/* Icon Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#1E223D]">
                  เลือกไอคอนประจำแอป ({appIconName})
                </label>
                <div className="grid grid-cols-6 sm:grid-cols-9 gap-2">
                  {AVAILABLE_ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setAppIconName(icon)}
                      className={`p-3 rounded-xl border flex items-center justify-center transition-all ${
                        appIconName === icon
                          ? 'bg-[#F54F1B] border-[#F54F1B] text-white shadow-xs'
                          : 'bg-[#F4EFE6] border-[#1E223D]/10 text-[#4B5277] hover:text-[#1E223D] hover:bg-white'
                      }`}
                      title={icon}
                    >
                      <DynamicIcon name={icon} className="w-5 h-5" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center gap-3 pt-3">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#F54F1B] hover:bg-[#e04514] text-white text-sm font-bold shadow-md shadow-[#F54F1B]/20 flex items-center gap-2 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingAppId ? 'บันทึกการแก้ไข' : 'บันทึกและเพิ่มแอป'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('apps')}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#4B5277] hover:text-[#1E223D] transition-colors"
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: ANNOUNCEMENTS */}
          {activeTab === 'announcements' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-[#F4EFE6] border border-[#1E223D]/10 space-y-3 shadow-xs">
                <h4 className="text-sm font-bold text-[#1E223D] flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#F54F1B]" />
                  <span>เพิ่มข้อความประกาศ / บันทึกด่วน</span>
                </h4>
                <form onSubmit={handleSaveAnnouncement} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        required
                        value={newAnnTitle}
                        onChange={(e) => setNewAnnTitle(e.target.value)}
                        placeholder="หัวข้อประกาศ เช่น ปรับเปลี่ยนเวลาเบิกยา"
                        className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#1E223D]/15 text-[#1E223D] text-xs outline-none focus:border-[#F54F1B]"
                      />
                    </div>
                    <div>
                      <select
                        value={newAnnType}
                        onChange={(e) => setNewAnnType(e.target.value as Announcement['type'])}
                        className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#1E223D]/15 text-[#1E223D] text-xs outline-none"
                      >
                        <option value="info">ประกาศทั่วไป (Info)</option>
                        <option value="urgent">แจ้งเตือนเร่งด่วน (Urgent)</option>
                        <option value="update">อัปเดตระบบ (Update)</option>
                      </select>
                    </div>
                  </div>
                  <textarea
                    rows={2}
                    required
                    value={newAnnContent}
                    onChange={(e) => setNewAnnContent(e.target.value)}
                    placeholder="รายละเอียดประกาศหรือข้อความแจ้งทีมงาน..."
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#1E223D]/15 text-[#1E223D] text-xs outline-none focus:border-[#F54F1B]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#F54F1B] hover:bg-[#e04514] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>เผยแพร่ประกาศ</span>
                  </button>
                </form>
              </div>

              {/* Existing Announcements */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-[#F54F1B] uppercase tracking-wider">
                  ประกาศที่กำลังแสดงอยู่ในปัจจุบัน ({announcements.length})
                </h4>
                {announcements.map((ann) => (
                  <div
                    key={ann.id}
                    className="p-3.5 rounded-xl bg-[#F4EFE6] border border-[#1E223D]/10 flex items-start justify-between gap-3 shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-[#1E223D]">{ann.title}</span>
                        <span className="text-[10px] text-[#4B5277]">· {ann.date}</span>
                      </div>
                      <p className="text-xs text-[#4B5277] leading-relaxed">{ann.content}</p>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm('ยืนยันลบประกาศนี้?')) {
                          onDeleteAnnouncement(ann.id);
                          showNotification('ลบประกาศสำเร็จ');
                        }
                      }}
                      className="p-1.5 rounded-lg text-[#4B5277] hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: SETTINGS & PIN MANAGEMENT */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-2xl">
              <form onSubmit={handleSaveSettingsSubmit} className="space-y-4">
                <div className="p-5 rounded-2xl bg-[#F4EFE6] border border-[#1E223D]/10 space-y-4 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#1E223D] flex items-center justify-center text-[#E6D5B7] shadow-xs">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#1E223D]">
                        ความปลอดภัยและรหัสผ่าน PIN ผู้ดูแล
                      </h4>
                      <p className="text-xs text-[#4B5277]">
                        กำหนดรหัสผ่าน PIN สำหรับเข้าสู่โหมดแก้ไขลิงก์และจัดการระบบ (ค่าปัจจุบัน: <span className="font-mono font-bold text-[#F54F1B]">{settings.pin}</span>)
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#1E223D]">
                      รหัสผ่าน PIN ใหม่ (ตัวเลข 4 หลักขึ้นไป)
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                      className="w-44 px-4 py-2.5 rounded-xl bg-white border border-[#1E223D]/20 text-[#1E223D] font-mono font-bold text-center tracking-widest text-lg outline-none focus:border-[#F54F1B] shadow-xs"
                    />
                  </div>
                </div>

                {/* Hospital Titles */}
                <div className="p-5 rounded-2xl bg-[#F4EFE6] border border-[#1E223D]/10 space-y-3 shadow-xs">
                  <h4 className="text-sm font-bold text-[#1E223D]">
                    ข้อมูลส่วนหัวและชื่อหน่วยงาน
                  </h4>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#1E223D]">
                      ชื่อกลุ่มงาน / แผนก
                    </label>
                    <input
                      type="text"
                      value={hospitalName}
                      onChange={(e) => setHospitalName(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl bg-white border border-[#1E223D]/15 text-[#1E223D] text-xs outline-none focus:border-[#F54F1B]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#1E223D]">
                      คำโปรย / คำอธิบายพอร์ทัล
                    </label>
                    <input
                      type="text"
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl bg-white border border-[#1E223D]/15 text-[#1E223D] text-xs outline-none focus:border-[#F54F1B]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#F54F1B] hover:bg-[#e04514] text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-md shadow-[#F54F1B]/20"
                >
                  <Save className="w-4 h-4" />
                  <span>บันทึกการตั้งค่า</span>
                </button>
              </form>

              {/* Data Backup & Reset */}
              <div className="p-5 rounded-2xl bg-[#F4EFE6] border border-[#1E223D]/10 space-y-4 pt-4 shadow-xs">
                <h4 className="text-xs font-bold text-[#F54F1B] uppercase tracking-wider">
                  สำรองข้อมูลและรีเซ็ตระบบ (Backup & Reset)
                </h4>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleExportJson}
                    className="px-4 py-2 rounded-xl bg-white hover:bg-[#F9F5EE] text-[#1E223D] border border-[#1E223D]/15 text-xs font-semibold flex items-center gap-2 transition-colors shadow-xs"
                  >
                    <Download className="w-4 h-4 text-[#F54F1B]" />
                    <span>ดาวน์โหลดไฟล์สำรอง (JSON)</span>
                  </button>

                  <label className="px-4 py-2 rounded-xl bg-white hover:bg-[#F9F5EE] text-[#1E223D] border border-[#1E223D]/15 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors shadow-xs">
                    <Upload className="w-4 h-4 text-emerald-600" />
                    <span>นำเข้าไฟล์สำรอง (Restore)</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportJson}
                      className="hidden"
                    />
                  </label>

                  <button
                    onClick={() => {
                      if (confirm('คุณแน่ใจหรือไม่ว่าต้องการรีเซ็ตข้อมูลทั้งหมดกลับสู่ค่าเริ่มต้นจากโรงพยาบาล?')) {
                        onResetToDefaults();
                        showNotification('รีเซ็ตข้อมูลกลับสู่ค่าเริ่มต้นเรียบร้อยแล้ว');
                      }
                    }}
                    className="px-4 py-2 rounded-xl text-rose-700 hover:bg-rose-100 text-xs font-semibold flex items-center gap-2 transition-colors ml-auto"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>คืนค่าเริ่มต้น (Reset Default)</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
