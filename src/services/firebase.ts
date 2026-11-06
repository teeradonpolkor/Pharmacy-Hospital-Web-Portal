import { initializeApp, getApps, getApp } from 'firebase/app';
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
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { AppItem, Category, Announcement, PortalSettings } from '../types/portal';
import {
  INITIAL_APPS,
  INITIAL_CATEGORIES,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_SETTINGS,
} from '../data/initialData';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// CRITICAL: Must pass databaseId from config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
  };
  console.warn('Firestore notice:', errInfo);
}

// Test connection on app launch
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'settings', 'general'));
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'settings/general');
    return false;
  }
}

// Seed initial hospital data if database is brand new
export async function seedInitialDataIfEmpty() {
  try {
    const appsSnap = await getDocs(collection(db, 'apps'));
    if (appsSnap.empty) {
      console.log('Seeding initial hospital data into Firestore...');
      const batch = writeBatch(db);

      // Seed apps
      INITIAL_APPS.forEach((appItem) => {
        const ref = doc(db, 'apps', appItem.id);
        batch.set(ref, appItem);
      });

      // Seed categories
      INITIAL_CATEGORIES.forEach((cat) => {
        const ref = doc(db, 'categories', cat.id);
        batch.set(ref, cat);
      });

      // Seed announcements
      INITIAL_ANNOUNCEMENTS.forEach((ann) => {
        const ref = doc(db, 'announcements', ann.id);
        batch.set(ref, ann);
      });

      // Seed settings
      const settingsRef = doc(db, 'settings', 'general');
      batch.set(settingsRef, INITIAL_SETTINGS);

      await batch.commit();
      console.log('Firestore seeding completed successfully.');
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'seed');
  }
}

// Subscriptions
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

// Mutations
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

export async function resetFirestoreToDefaults() {
  const batch = writeBatch(db);

  // Clear existing
  const appsSnap = await getDocs(collection(db, 'apps'));
  appsSnap.forEach((d) => batch.delete(d.ref));

  const catsSnap = await getDocs(collection(db, 'categories'));
  catsSnap.forEach((d) => batch.delete(d.ref));

  const annSnap = await getDocs(collection(db, 'announcements'));
  annSnap.forEach((d) => batch.delete(d.ref));

  // Seed default
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
