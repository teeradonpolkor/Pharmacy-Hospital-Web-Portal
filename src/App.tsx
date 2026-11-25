import React, { useState, useEffect, useMemo } from 'react';
import {
  INITIAL_APPS,
  INITIAL_CATEGORIES,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_SETTINGS,
  DATA_VERSION,
} from './data/initialData';
import {
  INITIAL_ROSTER_PUBLIC_OCT_2026,
  INITIAL_ROSTER_PUBLIC_NOV_2026,
  INITIAL_ROSTER_CONFIG,
  formatThaiMonthYear,
} from './data/rosterData';
import {
  AppItem,
  Category,
  Announcement,
  PortalSettings,
  RosterStaff,
  RosterPublicMonth,
  RosterAdminMonth,
  RosterConfig,
} from './types/portal';
import { Header } from './components/Header';
import { SearchBarAndFilters } from './components/SearchBarAndFilters';
import { AnnouncementsBanner } from './components/AnnouncementsBanner';
import { AppCard } from './components/AppCard';
import { PinModal } from './components/PinModal';
import { AdminManageModal } from './components/AdminManageModal';
import { AppDetailModal } from './components/AppDetailModal';
import { PublicRosterView } from './components/PublicRosterView';
import { AdminRosterModal } from './components/AdminRosterModal';
import { DynamicIcon } from './components/DynamicIcon';
import {
  Layers,
  Lock,
  Unlock,
  PlusCircle,
  CheckCircle,
  LayoutGrid,
  CalendarDays,
  Clock,
  Sun,
  Sunset,
  ArrowRight,
} from 'lucide-react';

import {
  testFirestoreConnection,
  seedInitialDataIfEmpty,
  seedAdminRosterDataIfEmpty,
  subscribeToApps,
  subscribeToCategories,
  subscribeToAnnouncements,
  subscribeToSettings,
  subscribeToPublicRosters,
  subscribeToRosterStaff,
  subscribeToAdminRosters,
  subscribeToRosterConfig,
  saveAppToFirestore,
  deleteAppFromFirestore,
  saveCategoryToFirestore,
  saveAnnouncementToFirestore,
  deleteAnnouncementFromFirestore,
  saveSettingsToFirestore,
  saveRosterStaffToFirestore,
  deleteRosterStaffFromFirestore,
  saveRosterConfigToFirestore,
  saveAdminRosterToFirestore,
  deleteAdminRosterFromFirestore,
  resetFirestoreToDefaults,
} from './services/firebase';

export default function App() {
  // Local storage state with initial fallbacks
  const [apps, setApps] = useState<AppItem[]>(() => {
    try {
      const savedVersion = localStorage.getItem('hospital_portal_version');
      if (savedVersion !== DATA_VERSION) {
        return INITIAL_APPS;
      }
      const saved = localStorage.getItem('hospital_portal_apps');
      return saved ? JSON.parse(saved) : INITIAL_APPS;
    } catch {
      return INITIAL_APPS;
    }
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const savedVersion = localStorage.getItem('hospital_portal_version');
      if (savedVersion !== DATA_VERSION) {
        return INITIAL_CATEGORIES;
      }
      const saved = localStorage.getItem('hospital_portal_categories');
      return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
    } catch {
      return INITIAL_CATEGORIES;
    }
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    try {
      const savedVersion = localStorage.getItem('hospital_portal_version');
      if (savedVersion !== DATA_VERSION) {
        return INITIAL_ANNOUNCEMENTS;
      }
      const saved = localStorage.getItem('hospital_portal_announcements');
      return saved ? JSON.parse(saved) : INITIAL_ANNOUNCEMENTS;
    } catch {
      return INITIAL_ANNOUNCEMENTS;
    }
  });

  const [settings, setSettings] = useState<PortalSettings>(() => {
    try {
      const savedVersion = localStorage.getItem('hospital_portal_version');
      if (savedVersion !== DATA_VERSION) {
        return INITIAL_SETTINGS;
      }
      const saved = localStorage.getItem('hospital_portal_settings');
      return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  });

  // Public monthly rosters (Strictly NO confidential pay rates or monetary amounts)
  const [publicRosters, setPublicRosters] = useState<RosterPublicMonth[]>(() => {
    try {
      const saved = localStorage.getItem('hospital_portal_public_rosters');
      return saved
        ? JSON.parse(saved)
        : [INITIAL_ROSTER_PUBLIC_OCT_2026, INITIAL_ROSTER_PUBLIC_NOV_2026];
    } catch {
      return [INITIAL_ROSTER_PUBLIC_OCT_2026, INITIAL_ROSTER_PUBLIC_NOV_2026];
    }
  });

  // Admin-only roster states (NEVER persisted in public localStorage, populated ONLY after PIN unlock)
  const [staffList, setStaffList] = useState<RosterStaff[]>([]);
  const [adminRosters, setAdminRosters] = useState<RosterAdminMonth[]>([]);
  const [rosterConfig, setRosterConfig] = useState<RosterConfig>(INITIAL_ROSTER_CONFIG);

  // UI & Navigation state
  const [activeSection, setActiveSection] = useState<'apps' | 'roster'>('apps');
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [pendingPinTarget, setPendingPinTarget] = useState<'manage' | 'roster' | null>(null);
  const [isManageModalOpen, setIsManageModalOpen] = useState<boolean>(false);
  const [isRosterAdminOpen, setIsRosterAdminOpen] = useState<boolean>(false);
  const [selectedAppForDetail, setSelectedAppForDetail] = useState<AppItem | null>(null);
  const [editingApp, setEditingApp] = useState<AppItem | null>(null);

  // Filter & Search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(false);

  // Connect Firebase Firestore Real-time Central Database (Public Data)
  useEffect(() => {
    testFirestoreConnection();
    seedInitialDataIfEmpty();

    const unsubApps = subscribeToApps((remoteApps) => {
      if (remoteApps && remoteApps.length > 0) {
        setApps(remoteApps);
        localStorage.setItem('hospital_portal_apps', JSON.stringify(remoteApps));
      }
    });

    const unsubCats = subscribeToCategories((remoteCats) => {
      if (remoteCats && remoteCats.length > 0) {
        setCategories(remoteCats);
        localStorage.setItem('hospital_portal_categories', JSON.stringify(remoteCats));
      }
    });

    const unsubAnn = subscribeToAnnouncements((remoteAnn) => {
      if (remoteAnn) {
        setAnnouncements(remoteAnn);
        localStorage.setItem('hospital_portal_announcements', JSON.stringify(remoteAnn));
      }
    });

    const unsubSettings = subscribeToSettings((remoteSettings) => {
      if (remoteSettings) {
        setSettings(remoteSettings);
        localStorage.setItem('hospital_portal_settings', JSON.stringify(remoteSettings));
      }
    });

    const unsubPublicRosters = subscribeToPublicRosters((remoteRosters) => {
      setPublicRosters(remoteRosters);
      localStorage.setItem('hospital_portal_public_rosters', JSON.stringify(remoteRosters));
    });

    return () => {
      unsubApps();
      unsubCats();
      unsubAnn();
      unsubSettings();
      unsubPublicRosters();
    };
  }, []);

  // Connect Confidential Admin Roster Data ONLY when PIN is unlocked
  useEffect(() => {
    if (!isAdminUnlocked) {
      setStaffList([]);
      setAdminRosters([]);
      setRosterConfig(INITIAL_ROSTER_CONFIG);
      setIsRosterAdminOpen(false);
      return;
    }

    seedAdminRosterDataIfEmpty();

    const unsubStaff = subscribeToRosterStaff((remoteStaff) => {
      setStaffList(remoteStaff);
    });

    const unsubAdminRosters = subscribeToAdminRosters((remoteAdminRosters) => {
      setAdminRosters(remoteAdminRosters);
    });

    const unsubRosterConfig = subscribeToRosterConfig((remoteConfig) => {
      setRosterConfig(remoteConfig);
    });

    return () => {
      unsubStaff();
      unsubAdminRosters();
      unsubRosterConfig();
    };
  }, [isAdminUnlocked]);

  // Sync public state to localStorage
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

  useEffect(() => {
    localStorage.setItem('hospital_portal_public_rosters', JSON.stringify(publicRosters));
  }, [publicRosters]);

  // App handlers with Firestore Cloud Persistence
  const handleToggleFavorite = async (id: string) => {
    const target = apps.find((a) => a.id === id);
    if (!target) return;
    const updated = { ...target, isFavorite: !target.isFavorite };
    setApps((prev) => prev.map((a) => (a.id === id ? updated : a)));
    await saveAppToFirestore(updated);
  };

  const handleSaveApp = async (savedApp: AppItem) => {
    setApps((prev) => {
      const exists = prev.some((a) => a.id === savedApp.id);
      if (exists) {
        return prev.map((a) => (a.id === savedApp.id ? savedApp : a));
      } else {
        return [savedApp, ...prev];
      }
    });
    await saveAppToFirestore(savedApp);
  };

  const handleDeleteApp = async (id: string) => {
    setApps((prev) => prev.filter((a) => a.id !== id));
    await deleteAppFromFirestore(id);
  };

  const handleAddCategory = async (newCat: Category) => {
    setCategories((prev) => [...prev, newCat]);
    await saveCategoryToFirestore(newCat);
  };

  const handleSaveAnnouncement = async (newAnn: Announcement) => {
    setAnnouncements((prev) => [newAnn, ...prev]);
    await saveAnnouncementToFirestore(newAnn);
  };

  const handleDeleteAnnouncement = async (id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    await deleteAnnouncementFromFirestore(id);
  };

  const handleSaveSettings = async (newSettings: PortalSettings) => {
    setSettings(newSettings);
    await saveSettingsToFirestore(newSettings);
  };

  const handleResetToDefaults = async () => {
    setApps(INITIAL_APPS);
    setCategories(INITIAL_CATEGORIES);
    setAnnouncements(INITIAL_ANNOUNCEMENTS);
    setSettings(INITIAL_SETTINGS);
    await resetFirestoreToDefaults();
  };

  const handleImportData = async (data: {
    apps?: AppItem[];
    categories?: Category[];
    announcements?: Announcement[];
    settings?: PortalSettings;
  }) => {
    if (data.apps) {
      setApps(data.apps);
      for (const item of data.apps) {
        await saveAppToFirestore(item);
      }
    }
    if (data.categories) {
      setCategories(data.categories);
      for (const cat of data.categories) {
        await saveCategoryToFirestore(cat);
      }
    }
    if (data.announcements) {
      setAnnouncements(data.announcements);
      for (const ann of data.announcements) {
        await saveAnnouncementToFirestore(ann);
      }
    }
    if (data.settings) {
      setSettings(data.settings);
      await saveSettingsToFirestore(data.settings);
    }
  };

  const handleEditAppTrigger = (app: AppItem) => {
    setEditingApp(app);
    setIsManageModalOpen(true);
  };

  const handleOpenAddNewApp = () => {
    setEditingApp(null);
    setIsManageModalOpen(true);
  };

  const handleLockAdmin = () => {
    setIsAdminUnlocked(false);
    setIsManageModalOpen(false);
    setIsRosterAdminOpen(false);
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

  // Today's duty quick summary (from published publicRosters, NO money)
  const todaySummary = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    const currentMonthRoster = publicRosters.find(
      (r) => r.isPublished && r.monthKey === monthKey
    );

    if (!currentMonthRoster) return null;

    const morningNames = currentMonthRoster.rows
      .filter((r) => r.morningDays.includes(day))
      .map((r) => r.name);
    const afternoonNames = currentMonthRoster.rows
      .filter((r) => r.afternoonDays.includes(day))
      .map((r) => r.name);

    return {
      dateLabel: `${day} ${formatThaiMonthYear(year, month)}`,
      morningNames,
      afternoonNames,
    };
  }, [publicRosters]);

  return (
    <>
      <div
        className={`min-h-screen bg-[#E6D5B7] text-[#1E223D] flex flex-col relative selection:bg-[#F54F1B] selection:text-white ${
          isAdminUnlocked && isRosterAdminOpen ? 'no-print' : ''
        }`}
      >
        {/* Background Decorative Ambient Gradients for Warm Sand (#E6D5B7) */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 no-print">
          <div className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-white/40 blur-3xl opacity-60" />
          <div className="absolute top-[25%] -right-[15%] w-[45vw] h-[45vw] rounded-full bg-[#F54F1B]/10 blur-3xl opacity-40" />
          <div className="absolute -bottom-[20%] left-[20%] w-[60vw] h-[60vw] rounded-full bg-white/30 blur-3xl opacity-50" />
        </div>

        {/* Header Bar */}
        <div className="no-print">
          <Header
            settings={settings}
            isAdminUnlocked={isAdminUnlocked}
            onOpenPinModal={() => {
              setPendingPinTarget('manage');
              setIsPinModalOpen(true);
            }}
            onLockAdmin={handleLockAdmin}
            onOpenManageModal={() => {
              setEditingApp(null);
              setIsManageModalOpen(true);
            }}
            onOpenAddNewApp={handleOpenAddNewApp}
            onOpenRosterBackend={() => setIsRosterAdminOpen(true)}
            totalApps={apps.length}
            onlineApps={onlineCount}
            favoriteCount={favoriteCount}
            showFavoritesOnly={showFavoritesOnly}
            onToggleFavoritesOnly={() => {
              setActiveSection('apps');
              setShowFavoritesOnly(!showFavoritesOnly);
            }}
            onFocusSearch={() => setActiveSection('apps')}
          />
        </div>

        {/* Main Content Area */}
        <main className="print-reset-container relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8 sm:space-y-10">
          {/* Hero Section + Segmented Navigation */}
          <section className="text-center max-w-3xl mx-auto space-y-4 pt-1 sm:pt-3 no-print">
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
              ศูนย์กลางการเข้าถึงระบบบริหารเวชภัณฑ์ยา งานบริบาลทางเภสัชกรรม และตารางเวรปฏิบัติงานนอกเวลาราชการ
            </p>

            {/* Primary Apple-style Segmented Switcher */}
            <div className="pt-2 flex justify-center">
              <div className="inline-flex p-1.5 rounded-2xl bg-white/75 backdrop-blur-md border border-[#1E223D]/12 shadow-sm">
                <button
                  onClick={() => setActiveSection('apps')}
                  className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all ${
                    activeSection === 'apps'
                      ? 'bg-[#1E223D] text-white shadow-sm'
                      : 'text-[#4B5277] hover:text-[#1E223D]'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span>ศูนย์รวมระบบงาน ({apps.length})</span>
                </button>
                <button
                  onClick={() => setActiveSection('roster')}
                  className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all ${
                    activeSection === 'roster'
                      ? 'bg-[#F54F1B] text-white shadow-sm'
                      : 'text-[#4B5277] hover:text-[#1E223D]'
                  }`}
                >
                  <CalendarDays className="w-4 h-4" />
                  <span>ตารางเวรปฏิบัติงาน (เดือนต่อเดือน)</span>
                </button>
              </div>
            </div>

            {/* Search Bar & Category Navigation (Apps mode) */}
            {activeSection === 'apps' && (
              <div className="pt-3">
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
            )}
          </section>

          {/* Admin Mode Alert Bar when Unlocked */}
          {isAdminUnlocked && (
            <div className="no-print p-4 rounded-2xl bg-[#1E223D] text-white flex flex-col sm:flex-row items-center justify-between gap-3 backdrop-blur-md animate-fade-in shadow-lg shadow-[#1E223D]/15 border border-[#1E223D]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#F54F1B] flex items-center justify-center text-white shrink-0 shadow-xs">
                  <Unlock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    เปิดใช้งานโหมดผู้ดูแลระบบ (Admin Mode Active)
                  </h4>
                  <p className="text-xs text-[#E6D5B7]">
                    สามารถจัดการระบบงานและเปิดหลังบ้านจัดตารางเวร (พร้อมคำนวณค่าตอบแทน) ได้ทันที
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setIsRosterAdminOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#E6D5B7] text-[#1E223D] hover:bg-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <CalendarDays className="w-4 h-4 text-[#F54F1B]" />
                  <span>จัดตารางเวร (หลังบ้าน)</span>
                </button>
                <button
                  onClick={handleOpenAddNewApp}
                  className="px-3.5 py-1.5 rounded-xl bg-[#F54F1B] text-white hover:bg-[#e04514] text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ เพิ่มระบบงาน</span>
                </button>
                <button
                  onClick={handleLockAdmin}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-medium text-slate-200 hover:text-white transition-colors"
                >
                  ล็อกโหมดผู้ดูแล
                </button>
              </div>
            </div>
          )}

          {activeSection === 'apps' ? (
            <>
              {/* Today's Duty Quick Banner (Public, strictly NO money) */}
              {todaySummary && (
                <section className="no-print">
                  <div className="p-4 sm:p-5 rounded-3xl bg-white/80 backdrop-blur-md border border-[#1E223D]/10 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-[#1E223D] text-[#E6D5B7] flex items-center justify-center shrink-0 shadow-sm">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-[#F54F1B]">
                          เวรนอกเวลาราชการวันนี้ ({todaySummary.dateLabel})
                        </p>
                        <h3 className="text-sm sm:text-base font-bold text-[#1E223D]">
                          ผู้ปฏิบัติงานประจำวัน กลุ่มงานเภสัชกรรมฯ
                        </h3>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      <div className="px-3 py-2 rounded-2xl bg-[#F4EFE6] border border-[#1E223D]/10 flex items-center gap-2 text-xs">
                        <Sun className="w-4 h-4 text-amber-600 shrink-0" />
                        <span className="font-semibold text-[#1E223D]">เช้า (ช):</span>
                        <span className="text-[#4B5277] font-medium">
                          {todaySummary.morningNames.length > 0
                            ? todaySummary.morningNames.join(', ')
                            : 'วันทำการปกติ'}
                        </span>
                      </div>

                      <div className="px-3 py-2 rounded-2xl bg-[#F4EFE6] border border-[#1E223D]/10 flex items-center gap-2 text-xs">
                        <Sunset className="w-4 h-4 text-[#F54F1B] shrink-0" />
                        <span className="font-semibold text-[#1E223D]">บ่าย (บ):</span>
                        <span className="text-[#4B5277] font-medium">
                          {todaySummary.afternoonNames.length > 0
                            ? todaySummary.afternoonNames.join(', ')
                            : '-'}
                        </span>
                      </div>

                      <button
                        onClick={() => setActiveSection('roster')}
                        className="px-3.5 py-2 rounded-2xl bg-[#1E223D] hover:bg-[#2A3159] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                      >
                        <span>ดูตารางเวรรายเดือน</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#E6D5B7]" />
                      </button>
                    </div>
                  </div>
                </section>
              )}

              {/* Announcements Banner Section */}
              <section className="no-print">
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

              {/* Apps Presentation */}
              {categorizedDisplay ? (
                /* Structured Categorized View (Default) */
                <div className="space-y-12 no-print">
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
                <section className="space-y-6 no-print">
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
            </>
          ) : (
            /* Public Month-by-Month Roster View (Strictly NO pay rates or money) */
            <section>
              <PublicRosterView
                publicRosters={publicRosters}
                isAdminUnlocked={isAdminUnlocked}
                onOpenAdminRoster={() => setIsRosterAdminOpen(true)}
                onRequestAdminPin={() => {
                  setPendingPinTarget('roster');
                  setIsPinModalOpen(true);
                }}
              />
            </section>
          )}
        </main>

        {/* Footer: Minimalist Apple-inspired information */}
        <footer className="no-print relative z-10 border-t border-[#1E223D]/10 bg-[#DAC6A5]/80 backdrop-blur-xl mt-16 text-xs text-[#4B5277] py-8">
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
                  onClick={() => {
                    setPendingPinTarget('manage');
                    setIsPinModalOpen(true);
                  }}
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
          onClose={() => {
            setIsPinModalOpen(false);
            setPendingPinTarget(null);
          }}
          onSuccess={() => {
            setIsAdminUnlocked(true);
            if (pendingPinTarget === 'roster') {
              setIsRosterAdminOpen(true);
            }
            setPendingPinTarget(null);
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

      {/* 4. PIN-Protected Admin Roster Workspace (Rendered ONLY when PIN unlocked) */}
      {isAdminUnlocked && isRosterAdminOpen && (
        <AdminRosterModal
          isOpen={isRosterAdminOpen}
          onClose={() => setIsRosterAdminOpen(false)}
          staffList={staffList}
          adminRosters={adminRosters}
          rosterConfig={rosterConfig}
          onSaveAdminRoster={saveAdminRosterToFirestore}
          onDeleteAdminRoster={deleteAdminRosterFromFirestore}
          onSaveStaff={saveRosterStaffToFirestore}
          onDeleteStaff={deleteRosterStaffFromFirestore}
          onSaveConfig={saveRosterConfigToFirestore}
        />
      )}
    </>
  );
}
