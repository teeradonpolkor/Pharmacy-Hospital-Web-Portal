import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  getDocFromServer,
  writeBatch,
  query,
  where,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  AppItem,
  Category,
  Announcement,
  PortalSettings,
  RosterStaff,
  RosterPublicMonth,
  RosterAdminMonth,
  RosterConfig,
  CustomThaiHoliday,
} from '../types/portal';
import {
  INITIAL_APPS,
  INITIAL_CATEGORIES,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_SETTINGS,
} from '../data/initialData';
import {
  INITIAL_ROSTER_STAFF,
  INITIAL_ROSTER_ADMIN_OCT_2026,
  INITIAL_ROSTER_ADMIN_NOV_2026,
  INITIAL_ROSTER_PUBLIC_OCT_2026,
  INITIAL_ROSTER_PUBLIC_NOV_2026,
  INITIAL_ROSTER_CONFIG,
  stripSecretRatesToPublic,
} from '../data/rosterData';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// CRITICAL: Must pass databaseId from config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid ?? null,
      email: auth.currentUser?.email ?? null,
      emailVerified: auth.currentUser?.emailVerified ?? null,
      isAnonymous: auth.currentUser?.isAnonymous ?? null,
      tenantId: auth.currentUser?.tenantId ?? null,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  if (
    errInfo.error.includes('Missing or insufficient permissions') ||
    errInfo.error.includes('PERMISSION_DENIED')
  ) {
    throw new Error(JSON.stringify(errInfo));
  }
}

// Test connection on app launch
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
    return false;
  }
}

// Seed initial hospital portal data if database is brand new
export async function seedInitialDataIfEmpty() {
  try {
    const appsSnap = await getDocs(collection(db, 'apps'));
    if (appsSnap.empty) {
      const batch = writeBatch(db);

      INITIAL_APPS.forEach((appItem) => {
        batch.set(doc(db, 'apps', appItem.id), appItem);
      });
      INITIAL_CATEGORIES.forEach((cat) => {
        batch.set(doc(db, 'categories', cat.id), cat);
      });
      INITIAL_ANNOUNCEMENTS.forEach((ann) => {
        batch.set(doc(db, 'announcements', ann.id), ann);
      });
      batch.set(doc(db, 'settings', 'general'), INITIAL_SETTINGS);

      await batch.commit();
    }

    // Seed public published rosters if empty (NO pay rates or money stored in rosters_public)
    const publicRostersQuery = query(
      collection(db, 'rosters_public'),
      where('isPublished', '==', true)
    );
    const publicRostersSnap = await getDocs(publicRostersQuery);
    if (publicRostersSnap.empty) {
      const rosterBatch = writeBatch(db);
      rosterBatch.set(
        doc(db, 'rosters_public', INITIAL_ROSTER_PUBLIC_OCT_2026.monthKey),
        INITIAL_ROSTER_PUBLIC_OCT_2026
      );
      rosterBatch.set(
        doc(db, 'rosters_public', INITIAL_ROSTER_PUBLIC_NOV_2026.monthKey),
        INITIAL_ROSTER_PUBLIC_NOV_2026
      );
      await rosterBatch.commit();
    }

    // Seed public roster header & signatories config if missing (contains NO money/rates)
    const configSnap = await getDocs(collection(db, 'roster_config'));
    if (configSnap.empty) {
      await setDoc(doc(db, 'roster_config', 'default'), INITIAL_ROSTER_CONFIG);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'seed');
  }
}

// Seed Admin Roster Data ONLY when Admin Mode is unlocked with PIN
export async function seedAdminRosterDataIfEmpty() {
  try {
    const staffSnap = await getDocs(collection(db, 'roster_staff'));
    const adminRosterSnap = await getDocs(collection(db, 'rosters_admin'));
    const configSnap = await getDocs(collection(db, 'roster_config'));

    const batch = writeBatch(db);
    let hasWrites = false;

    if (staffSnap.empty) {
      INITIAL_ROSTER_STAFF.forEach((s) => {
        batch.set(doc(db, 'roster_staff', s.id), s);
      });
      hasWrites = true;
    }

    if (adminRosterSnap.empty) {
      batch.set(
        doc(db, 'rosters_admin', INITIAL_ROSTER_ADMIN_OCT_2026.monthKey),
        INITIAL_ROSTER_ADMIN_OCT_2026
      );
      batch.set(
        doc(db, 'rosters_admin', INITIAL_ROSTER_ADMIN_NOV_2026.monthKey),
        INITIAL_ROSTER_ADMIN_NOV_2026
      );
      hasWrites = true;
    }

    if (configSnap.empty) {
      batch.set(doc(db, 'roster_config', 'default'), INITIAL_ROSTER_CONFIG);
      hasWrites = true;
    }

    if (hasWrites) {
      await batch.commit();
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'seed_admin_roster');
  }
}

// --- Portal Subscriptions ---
export function subscribeToApps(callback: (apps: AppItem[]) => void) {
  return onSnapshot(
    collection(db, 'apps'),
    (snapshot) => {
      const items: AppItem[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as AppItem);
      });
      callback(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'apps');
    }
  );
}

export function subscribeToCategories(callback: (categories: Category[]) => void) {
  return onSnapshot(
    collection(db, 'categories'),
    (snapshot) => {
      const items: Category[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as Category);
      });
      callback(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'categories');
    }
  );
}

export function subscribeToAnnouncements(callback: (announcements: Announcement[]) => void) {
  return onSnapshot(
    collection(db, 'announcements'),
    (snapshot) => {
      const items: Announcement[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as Announcement);
      });
      callback(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'announcements');
    }
  );
}

export function subscribeToSettings(callback: (settings: PortalSettings) => void) {
  return onSnapshot(
    doc(db, 'settings', 'general'),
    (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as PortalSettings);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/general');
    }
  );
}

// --- Public Roster Subscription (NO money or rates) ---
export function subscribeToPublicRosters(
  callback: (rosters: RosterPublicMonth[]) => void
) {
  const q = query(
    collection(db, 'rosters_public'),
    where('isPublished', '==', true)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const items: RosterPublicMonth[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as RosterPublicMonth);
      });
      items.sort((a, b) => a.monthKey.localeCompare(b.monthKey));
      callback(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'rosters_public');
    }
  );
}

// --- Admin-only Roster Subscriptions (called ONLY when PIN unlocked) ---
export function subscribeToRosterStaff(
  callback: (staff: RosterStaff[]) => void
) {
  return onSnapshot(
    collection(db, 'roster_staff'),
    (snapshot) => {
      const items: RosterStaff[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as RosterStaff);
      });
      items.sort((a, b) => a.order - b.order);
      callback(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'roster_staff');
    }
  );
}

export function subscribeToAdminRosters(
  callback: (rosters: RosterAdminMonth[]) => void
) {
  return onSnapshot(
    collection(db, 'rosters_admin'),
    (snapshot) => {
      const items: RosterAdminMonth[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as RosterAdminMonth);
      });
      items.sort((a, b) => a.monthKey.localeCompare(b.monthKey));
      callback(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'rosters_admin');
    }
  );
}

export function subscribeToRosterConfig(
  callback: (config: RosterConfig) => void
) {
  return onSnapshot(
    doc(db, 'roster_config', 'default'),
    (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as RosterConfig);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'roster_config/default');
    }
  );
}

export function subscribeToThaiHolidays(
  callback: (holidays: CustomThaiHoliday[]) => void
) {
  return onSnapshot(
    collection(db, 'thai_holidays'),
    (snapshot) => {
      const items: CustomThaiHoliday[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as CustomThaiHoliday);
      });
      items.sort((a, b) => a.dateKey.localeCompare(b.dateKey));
      callback(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'thai_holidays');
    }
  );
}

// --- Portal Mutations ---
export async function saveAppToFirestore(appItem: AppItem) {
  try {
    await setDoc(doc(db, 'apps', appItem.id), appItem, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `apps/${appItem.id}`);
    throw err;
  }
}

export async function deleteAppFromFirestore(appId: string) {
  try {
    await deleteDoc(doc(db, 'apps', appId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `apps/${appId}`);
    throw err;
  }
}

export async function saveCategoryToFirestore(category: Category) {
  try {
    await setDoc(doc(db, 'categories', category.id), category, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `categories/${category.id}`);
    throw err;
  }
}

export async function saveAnnouncementToFirestore(announcement: Announcement) {
  try {
    await setDoc(doc(db, 'announcements', announcement.id), announcement, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `announcements/${announcement.id}`);
    throw err;
  }
}

export async function deleteAnnouncementFromFirestore(announcementId: string) {
  try {
    await deleteDoc(doc(db, 'announcements', announcementId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `announcements/${announcementId}`);
    throw err;
  }
}

export async function saveSettingsToFirestore(settings: PortalSettings) {
  try {
    await setDoc(doc(db, 'settings', 'general'), settings, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'settings/general');
    throw err;
  }
}

// --- Roster Mutations (Admin Only) ---
export async function saveRosterStaffToFirestore(staff: RosterStaff) {
  try {
    await setDoc(doc(db, 'roster_staff', staff.id), staff, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `roster_staff/${staff.id}`);
    throw err;
  }
}

export async function deleteRosterStaffFromFirestore(staffId: string) {
  try {
    await deleteDoc(doc(db, 'roster_staff', staffId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `roster_staff/${staffId}`);
    throw err;
  }
}

export async function saveRosterConfigToFirestore(config: RosterConfig) {
  try {
    await setDoc(doc(db, 'roster_config', config.id), config, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `roster_config/${config.id}`);
    throw err;
  }
}

export async function saveAdminRosterToFirestore(adminMonth: RosterAdminMonth) {
  try {
    await setDoc(doc(db, 'rosters_admin', adminMonth.monthKey), adminMonth);

    // Sync to public collection strictly WITHOUT confidential pay rates/amounts
    if (adminMonth.isPublished) {
      const publicPayload = stripSecretRatesToPublic(adminMonth);
      await setDoc(doc(db, 'rosters_public', adminMonth.monthKey), publicPayload);
    } else {
      // Remove from public view if unpublished / draft
      await deleteDoc(doc(db, 'rosters_public', adminMonth.monthKey));
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `rosters_admin/${adminMonth.monthKey}`);
    throw err;
  }
}

export async function deleteAdminRosterFromFirestore(monthKey: string) {
  try {
    await deleteDoc(doc(db, 'rosters_admin', monthKey));
    await deleteDoc(doc(db, 'rosters_public', monthKey));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `rosters_admin/${monthKey}`);
    throw err;
  }
}

export async function saveThaiHolidayToFirestore(holiday: CustomThaiHoliday) {
  try {
    await setDoc(doc(db, 'thai_holidays', holiday.id), holiday, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `thai_holidays/${holiday.id}`);
    throw err;
  }
}

export async function deleteThaiHolidayFromFirestore(holidayId: string) {
  try {
    await deleteDoc(doc(db, 'thai_holidays', holidayId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `thai_holidays/${holidayId}`);
    throw err;
  }
}

export async function resetFirestoreToDefaults() {
  const batch = writeBatch(db);

  const appsSnap = await getDocs(collection(db, 'apps'));
  appsSnap.forEach((d) => batch.delete(d.ref));

  const catsSnap = await getDocs(collection(db, 'categories'));
  catsSnap.forEach((d) => batch.delete(d.ref));

  const annSnap = await getDocs(collection(db, 'announcements'));
  annSnap.forEach((d) => batch.delete(d.ref));

  INITIAL_APPS.forEach((item) => {
    batch.set(doc(db, 'apps', item.id), item);
  });
  INITIAL_CATEGORIES.forEach((cat) => {
    batch.set(doc(db, 'categories', cat.id), cat);
  });
  INITIAL_ANNOUNCEMENTS.forEach((ann) => {
    batch.set(doc(db, 'announcements', ann.id), ann);
  });
  batch.set(doc(db, 'settings', 'general'), INITIAL_SETTINGS);

  await batch.commit();
}
