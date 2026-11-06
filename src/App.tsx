import React, { useState, useEffect, useMemo } from 'react';
import {
  INITIAL_APPS,
  INITIAL_CATEGORIES,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_SETTINGS,
} from './data/initialData';
import { AppItem, Category, Announcement, PortalSettings } from './types/portal';
import { Header } from './components/Header';
import { SearchBarAndFilters } from './components/SearchBarAndFilters';
import { AnnouncementsBanner } from './components/AnnouncementsBanner';
import { AppCard } from './components/AppCard';
import { PinModal } from './components/PinModal';
import { AdminManageModal } from './components/AdminManageModal';
import { AppDetailModal } from './components/AppDetailModal';
import { DynamicIcon } from './components/DynamicIcon';
import {
  Layers,
  Lock,
  Unlock,
  PlusCircle,
  CheckCircle,
} from 'lucide-react';

export default function App() {
  // Local storage state with initial fallbacks
  const [apps, setApps] = useState<AppItem[]>(() => {
    try {
      const saved = localStorage.getItem('hospital_portal_apps');
      return saved ? JSON.parse(saved) : INITIAL_APPS;
    } catch {
      return INITIAL_APPS;
    }
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem('hospital_portal_categories');
      return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
    } catch {
      return INITIAL_CATEGORIES;
    }
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    try {
      const saved = localStorage.getItem('hospital_portal_announcements');
      return saved ? JSON.parse(saved) : INITIAL_ANNOUNCEMENTS;
    } catch {
      return INITIAL_ANNOUNCEMENTS;
    }
  });

  const [settings, setSettings] = useState<PortalSettings>(() => {
    try {
      const saved = localStorage.getItem('hospital_portal_settings');
      return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  });

  // UI state
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState<boolean>(false);
  const [selectedAppForDetail, setSelectedAppForDetail] = useState<AppItem | null>(null);
  const [editingApp, setEditingApp] = useState<AppItem | null>(null);

  // Filter & Search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(false);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('hospital_portal_apps', JSON.stringify(apps));
  }, [apps]);

  useEffect(() => {
    localStorage.setItem('hospital_portal_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('hospital_portal_announcements', JSON.stringify(announcements));
  }, [announcements]);

  useEffect(() => {
    localStorage.setItem('hospital_portal_settings', JSON.stringify(settings));
  }, [settings]);

  // App handlers
  const handleToggleFavorite = (id: string) => {
    setApps((prev) =>
      prev.map((app) =>
        app.id === id ? { ...app, isFavorite: !app.isFavorite } : app
      )
    );
  };

  const handleSaveApp = (savedApp: AppItem) => {
    setApps((prev) => {
      const exists = prev.some((a) => a.id === savedApp.id);
      if (exists) {
        return prev.map((a) => (a.id === savedApp.id ? savedApp : a));
      } else {
        return [savedApp, ...prev];
      }
    });
  };

  const handleDeleteApp = (id: string) => {
    setApps((prev) => prev.filter((a) => a.id !== id));
  };

  const handleAddCategory = (newCat: Category) => {
    setCategories((prev) => [...prev, newCat]);
  };

  const handleSaveAnnouncement = (newAnn: Announcement) => {
    setAnnouncements((prev) => [newAnn, ...prev]);
  };

  const handleDeleteAnnouncement = (id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSaveSettings = (newSettings: PortalSettings) => {
    setSettings(newSettings);
  };

  const handleResetToDefaults = () => {
    setApps(INITIAL_APPS);
    setCategories(INITIAL_CATEGORIES);
    setAnnouncements(INITIAL_ANNOUNCEMENTS);
    setSettings(INITIAL_SETTINGS);
  };

  const handleImportData = (data: {
    apps?: AppItem[];
    categories?: Category[];
    announcements?: Announcement[];
    settings?: PortalSettings;
  }) => {
    if (data.apps) setApps(data.apps);
    if (data.categories) setCategories(data.categories);
    if (data.announcements) setAnnouncements(data.announcements);
    if (data.settings) setSettings(data.settings);
  };

  const handleEditAppTrigger = (app: AppItem) => {
    setEditingApp(app);
    setIsManageModalOpen(true);
  };

  const handleOpenAddNewApp = () => {
    setEditingApp(null);
    setIsManageModalOpen(true);
  };

  // Calculations & Filtering
  const favoriteCount = useMemo(() => apps.filter((a) => a.isFavorite).length, [apps]);
  const onlineCount = useMemo(() => apps.filter((a) => a.status === 'online').length, [apps]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    categories.forEach((c) => {
      counts[c.id] = apps.filter((a) => a.categoryId === c.id).length;
    });
    return counts;
  }, [categories, apps]);

  const filteredApps = useMemo(() => {
    return apps.filter((app) => {
      if (showFavoritesOnly && !app.isFavorite) return false;

      if (selectedCategory !== 'all' && app.categoryId !== selectedCategory) {
        return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const cat = categories.find((c) => c.id === app.categoryId);
        const matchTitle = app.title.toLowerCase().includes(query);
        const matchDesc = app.description.toLowerCase().includes(query);
        const matchTag = app.tag.toLowerCase().includes(query);
        const matchCat = cat?.name.toLowerCase().includes(query) ?? false;
        const matchUrl = app.url.toLowerCase().includes(query);
        return matchTitle || matchDesc || matchTag || matchCat || matchUrl;
      }

      return true;
    });
  }, [apps, showFavoritesOnly, selectedCategory, searchQuery, categories]);

  // Group apps by category for structured layout
  const categorizedDisplay = useMemo(() => {
    if (selectedCategory !== 'all' || searchQuery.trim() || showFavoritesOnly) {
      return null;
    }

    return categories.map((cat) => ({
      category: cat,
      items: apps.filter((a) => a.categoryId === cat.id),
    }));
  }, [categories, apps, selectedCategory, searchQuery, showFavoritesOnly]);

  return (
    <div className="min-h-screen bg-[#E6D5B7] text-[#1E223D] flex flex-col relative selection:bg-[#F54F1B] selection:text-white">
      {/* Background Decorative Ambient Gradients for Warm Sand (#E6D5B7) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-white/40 blur-3xl opacity-60" />
        <div className="absolute top-[25%] -right-[15%] w-[45vw] h-[45vw] rounded-full bg-[#F54F1B]/10 blur-3xl opacity-40" />
        <div className="absolute -bottom-[20%] left-[20%] w-[60vw] h-[60vw] rounded-full bg-white/30 blur-3xl opacity-50" />
      </div>

      {/* Header Bar */}
      <Header
        settings={settings}
        isAdminUnlocked={isAdminUnlocked}
        onOpenPinModal={() => setIsPinModalOpen(true)}
        onLockAdmin={() => setIsAdminUnlocked(false)}
        onOpenManageModal={() => {
          setEditingApp(null);
          setIsManageModalOpen(true);
        }}
        onOpenAddNewApp={handleOpenAddNewApp}
        totalApps={apps.length}
        onlineApps={onlineCount}
        favoriteCount={favoriteCount}
        showFavoritesOnly={showFavoritesOnly}
        onToggleFavoritesOnly={() => setShowFavoritesOnly(!showFavoritesOnly)}
        onFocusSearch={() => {}}
      />

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10 sm:space-y-12">
        {/* Hero Section: Apple minimalist warm presentation */}
        <section className="text-center max-w-3xl mx-auto space-y-4 pt-2 sm:pt-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 border border-[#1E223D]/10 text-[#1E223D] text-xs font-semibold backdrop-blur-md shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#F54F1B] animate-pulse" />
            <span>Digital Pharmacy & Clinical Excellence Portal</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#1E223D] leading-[1.15]">
            ระบบสารสนเทศ{' '}
            <span className="bg-gradient-to-r from-[#1E223D] via-[#F54F1B] to-[#1E223D] bg-clip-text text-transparent">
              กลุ่มงานเภสัชกรรม
            </span>
          </h2>

          <p className="text-sm sm:text-base text-[#4B5277] leading-relaxed max-w-2xl mx-auto font-normal">
            ศูนย์กลางการเข้าถึงระบบบริหารเวชภัณฑ์ยา งานบริบาลทางเภสัชกรรม และงานผลิตยาสมุนไพร 
            เชื่อมต่อ Google Apps Script, AppSheet และฐานข้อมูลเพื่อการดูแลผู้ป่วยอย่างครบวงจร
          </p>

          {/* Search Bar & Category Navigation */}
          <div className="pt-4">
            <SearchBarAndFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              categories={categories}
              categoryCounts={categoryCounts}
              totalCount={apps.length}
            />
          </div>
        </section>

        {/* Announcements Banner Section */}
        <section>
          <AnnouncementsBanner
            announcements={announcements}
            isAdminUnlocked={isAdminUnlocked}
            onAddAnnouncement={() => {
              setEditingApp(null);
              setIsManageModalOpen(true);
            }}
            onDeleteAnnouncement={handleDeleteAnnouncement}
          />
        </section>

        {/* Admin Mode Alert Bar when Unlocked */}
        {isAdminUnlocked && (
          <div className="p-4 rounded-2xl bg-[#1E223D] text-white flex flex-col sm:flex-row items-center justify-between gap-3 backdrop-blur-md animate-fade-in shadow-lg shadow-[#1E223D]/15 border border-[#1E223D]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#F54F1B] flex items-center justify-center text-white shrink-0 shadow-xs">
                <Unlock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  เปิดใช้งานโหมดผู้ดูแลระบบ (Admin Mode Active)
                </h4>
                <p className="text-xs text-[#E6D5B7]">
                  คุณสามารถคลิกปุ่ม &quot;แก้ไข&quot; บนการ์ดใดก็ได้ หรือเพิ่มระบบงานใหม่ได้ทันที
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenAddNewApp}
                className="px-3.5 py-1.5 rounded-xl bg-[#F54F1B] text-white hover:bg-[#e04514] text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ เพิ่มระบบงาน</span>
              </button>
              <button
                onClick={() => setIsAdminUnlocked(false)}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-medium text-slate-200 hover:text-white transition-colors"
              >
                ล็อกโหมดผู้ดูแล
              </button>
            </div>
          </div>
        )}

        {/* Apps Presentation */}
        {categorizedDisplay ? (
          /* Structured Categorized View (Default) */
          <div className="space-y-12">
            {categorizedDisplay.map(({ category, items }) => {
              if (items.length === 0) return null;
              return (
                <section key={category.id} className="space-y-5">
                  {/* Category Section Header */}
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-3 border-b border-[#1E223D]/15">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#1E223D] border border-[#1E223D]/20 flex items-center justify-center text-[#E6D5B7] shadow-sm">
                        <DynamicIcon name={category.iconName} className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-xl sm:text-2xl font-bold text-[#1E223D] tracking-tight">
                          {category.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-[#4B5277]">
                          {category.description}
                        </p>
                      </div>
                    </div>

                    <div className="text-xs text-[#F54F1B] font-bold self-end sm:self-auto bg-white/70 px-2.5 py-1 rounded-lg border border-[#1E223D]/10">
                      {items.length} ระบบงาน
                    </div>
                  </div>

                  {/* App Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                    {items.map((app) => (
                      <AppCard
                        key={app.id}
                        app={app}
                        category={category}
                        isAdminUnlocked={isAdminUnlocked}
                        onEdit={handleEditAppTrigger}
                        onToggleFavorite={handleToggleFavorite}
                        onSelectDetail={setSelectedAppForDetail}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          /* Filtered or Searched Results View */
          <section className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E223D]/15">
              <div>
                <h3 className="text-xl font-bold text-[#1E223D] tracking-tight">
                  {showFavoritesOnly
                    ? 'ระบบงานที่ติดดาว (Favorite Apps)'
                    : searchQuery
                    ? `ผลการค้นหา "${searchQuery}"`
                    : 'รายการระบบงาน'}
                </h3>
                <p className="text-xs text-[#4B5277]">
                  พบ {filteredApps.length} ระบบงานที่ตรงกับเงื่อนไข
                </p>
              </div>

              {(searchQuery || selectedCategory !== 'all' || showFavoritesOnly) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setShowFavoritesOnly(false);
                  }}
                  className="text-xs font-bold text-[#F54F1B] hover:underline"
                >
                  ล้างตัวกรองทั้งหมด
                </button>
              )}
            </div>

            {filteredApps.length === 0 ? (
              <div className="py-16 text-center rounded-3xl bg-white/80 border border-[#1E223D]/10 space-y-3 shadow-xs">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-[#1E223D]/5 border border-[#1E223D]/10 flex items-center justify-center text-[#4B5277]">
                  <Layers className="w-7 h-7" />
                </div>
                <h4 className="text-base font-bold text-[#1E223D]">
                  ไม่พบระบบงานที่ค้นหา
                </h4>
                <p className="text-xs text-[#4B5277] max-w-sm mx-auto">
                  ลองค้นหาด้วยคำอื่น หรือตรวจสอบตัวกรองหมวดหมู่และรายการที่ติดดาว
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setShowFavoritesOnly(false);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#1E223D] hover:bg-[#2A3159] text-white transition-colors"
                >
                  แสดงระบบงานทั้งหมด
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                {filteredApps.map((app) => {
                  const cat = categories.find((c) => c.id === app.categoryId);
                  return (
                    <AppCard
                      key={app.id}
                      app={app}
                      category={cat}
                      isAdminUnlocked={isAdminUnlocked}
                      onEdit={handleEditAppTrigger}
                      onToggleFavorite={handleToggleFavorite}
                      onSelectDetail={setSelectedAppForDetail}
                    />
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>

      {/* Footer: Minimalist Apple-inspired information */}
      <footer className="relative z-10 border-t border-[#1E223D]/10 bg-[#DAC6A5]/80 backdrop-blur-xl mt-16 text-xs text-[#4B5277] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#1E223D] flex items-center justify-center text-[#E6D5B7] font-bold text-xs shadow-xs">
              ℞
            </div>
            <div>
              <p className="text-[#1E223D] font-bold">
                {settings.hospitalName}
              </p>
              <p className="text-[11px] text-[#4B5277]">
                ระบบพอร์ทัลบริการสุขภาพและเภสัชกรรมดิจิทัล ปลอดภัย รวดเร็ว และแม่นยำ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 flex-wrap text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
              <span className="text-[#1E223D] font-medium">ทุกระบบพร้อมให้บริการ (100% Online)</span>
            </span>
            <span className="text-[#1E223D]/30">·</span>
            <span className="text-[#4B5277]">
              กด <kbd className="px-1.5 py-0.5 rounded bg-white/60 font-mono text-[10px] text-[#1E223D]">⌘K</kbd> หรือ <kbd className="px-1.5 py-0.5 rounded bg-white/60 font-mono text-[10px] text-[#1E223D]">/</kbd> เพื่อค้นหา
            </span>
            <span className="text-[#1E223D]/30">·</span>
            {!isAdminUnlocked ? (
              <button
                onClick={() => setIsPinModalOpen(true)}
                className="text-[#F54F1B] font-semibold hover:underline flex items-center gap-1"
              >
                <Lock className="w-3 h-3" />
                <span>เข้าสู่โหมดจัดการ (PIN)</span>
              </button>
            ) : (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-emerald-600" />
                <span>โหมดผู้ดูแลระบบทำงานอยู่</span>
              </span>
            )}
          </div>
        </div>
      </footer>

      {/* Modals */}
      {/* 1. PIN Modal */}
      <PinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={() => {
          setIsAdminUnlocked(true);
        }}
        currentPin={settings.pin}
      />

      {/* 2. Admin Manage Modal */}
      <AdminManageModal
        isOpen={isManageModalOpen}
        onClose={() => {
          setIsManageModalOpen(false);
          setEditingApp(null);
        }}
        apps={apps}
        categories={categories}
        announcements={announcements}
        settings={settings}
        onSaveApp={handleSaveApp}
        onDeleteApp={handleDeleteApp}
        onAddCategory={handleAddCategory}
        onSaveSettings={handleSaveSettings}
        onSaveAnnouncement={handleSaveAnnouncement}
        onDeleteAnnouncement={handleDeleteAnnouncement}
        onResetToDefaults={handleResetToDefaults}
        onImportData={handleImportData}
        initialEditingApp={editingApp}
      />

      {/* 3. App Detail Modal */}
      <AppDetailModal
        app={selectedAppForDetail}
        category={categories.find((c) => c.id === selectedAppForDetail?.categoryId)}
        onClose={() => setSelectedAppForDetail(null)}
        onEdit={handleEditAppTrigger}
        isAdminUnlocked={isAdminUnlocked}
      />
    </div>
  );
}
