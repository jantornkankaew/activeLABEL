import {useEffect,useState,useCallback,useRef} from 'react';
import type {LabelDocument} from './core';

export const OFFLINE_SYNC_KEY = 'labelcraft-offline-sync-v1';
export const LAST_SYNC_KEY = 'labelcraft-last-sync-time';
export const OFFLINE_SINCE_KEY = 'labelcraft-offline-since-time';

export interface PendingSyncItem {
  userId?: string;
  documents: LabelDocument[];
  activeId: string;
  timestamp: number;
  status: 'pending' | 'syncing' | 'failed';
  retryCount: number;
  lastError?: string;
}

export type SyncState = 'online' | 'offline' | 'syncing' | 'synced' | 'pending' | 'error';

export function isOnline(): boolean {
  if (typeof navigator === 'undefined') return true;
  return typeof navigator.onLine === 'boolean' ? navigator.onLine : true;
}

export function subscribeNetwork(onChange: (online: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handleOnline = () => onChange(true);
  const handleOffline = () => onChange(false);
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

export function getPendingSync(): PendingSyncItem | null {
  try {
    const raw = localStorage.getItem(OFFLINE_SYNC_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.documents)) return parsed;
    return null;
  } catch {
    return null;
  }
}

export function savePendingSync(data: {
  userId?: string;
  documents: LabelDocument[];
  activeId: string;
  lastError?: string;
}): void {
  try {
    const existing = getPendingSync();
    const item: PendingSyncItem = {
      userId: data.userId ?? existing?.userId,
      documents: data.documents,
      activeId: data.activeId,
      timestamp: Date.now(),
      status: 'pending',
      retryCount: (existing?.retryCount ?? 0) + 1,
      lastError: data.lastError,
    };
    localStorage.setItem(OFFLINE_SYNC_KEY, JSON.stringify(item));
  } catch (e) {
    console.warn('Could not save pending offline sync:', e);
  }
}

export function clearPendingSync(): void {
  try {
    localStorage.removeItem(OFFLINE_SYNC_KEY);
  } catch {
    // ignore
  }
}

export function getLastSyncTime(): number | null {
  try {
    const val = localStorage.getItem(LAST_SYNC_KEY);
    return val ? Number(val) : null;
  } catch {
    return null;
  }
}

export function setLastSyncTime(time: number): void {
  try {
    localStorage.setItem(LAST_SYNC_KEY, String(time));
  } catch {
    // ignore
  }
}

export function getOfflineSinceTime(): number | null {
  try {
    const val = localStorage.getItem(OFFLINE_SINCE_KEY);
    return val ? Number(val) : null;
  } catch {
    return null;
  }
}

export function setOfflineSinceTime(time: number | null): void {
  try {
    if (time === null) {
      localStorage.removeItem(OFFLINE_SINCE_KEY);
    } else {
      localStorage.setItem(OFFLINE_SINCE_KEY, String(time));
    }
  } catch {
    // ignore
  }
}

export async function flushPendingSync(
  cloudSaver: (userId: string, docs: LabelDocument[], activeId: string) => Promise<void>,
  currentUserId?: string
): Promise<{ success: boolean; syncedCount: number; error?: string }> {
  const pending = getPendingSync();
  if (!pending) {
    return { success: true, syncedCount: 0 };
  }

  const targetUserId = currentUserId || pending.userId;
  if (!targetUserId) {
    // No user id to sync to (local mode without cloud session)
    return { success: true, syncedCount: 0 };
  }

  if (!isOnline()) {
    return { success: false, syncedCount: 0, error: 'Offline' };
  }

  try {
    await cloudSaver(targetUserId, pending.documents, pending.activeId);
    clearPendingSync();
    setLastSyncTime(Date.now());
    return { success: true, syncedCount: pending.documents.length };
  } catch (error) {
    const msg = (error as Error).message;
    savePendingSync({
      userId: targetUserId,
      documents: pending.documents,
      activeId: pending.activeId,
      lastError: msg,
    });
    return { success: false, syncedCount: 0, error: msg };
  }
}

export function useSyncEngine({
  userId,
  cloudSaver,
  onNotice,
}: {
  userId?: string;
  cloudSaver?: (userId: string, docs: LabelDocument[], activeId: string) => Promise<void>;
  onNotice?: (msg: string) => void;
}) {
  const [online, setOnline] = useState<boolean>(() => isOnline());
  const [syncState, setSyncState] = useState<SyncState>(() =>
    !isOnline() ? 'offline' : getPendingSync() ? 'pending' : 'online'
  );
  const [pendingCount, setPendingCount] = useState<number>(() => {
    const p = getPendingSync();
    return p ? p.documents.length : 0;
  });
  const [lastSyncTime, setLastSyncTimeState] = useState<number | null>(() => {
    const saved = getLastSyncTime();
    if (saved) return saved;
    const now = Date.now();
    setLastSyncTime(now);
    return now;
  });
  const [offlineSince, setOfflineSinceState] = useState<number | null>(() => {
    if (!isOnline()) {
      const saved = getOfflineSinceTime();
      if (saved) return saved;
      const now = Date.now();
      setOfflineSinceTime(now);
      return now;
    }
    return null;
  });

  const cloudSaverRef = useRef(cloudSaver);
  cloudSaverRef.current = cloudSaver;
  const userIdRef = useRef(userId);
  userIdRef.current = userId;
  const onNoticeRef = useRef(onNotice);
  onNoticeRef.current = onNotice;

  const triggerSync = useCallback(async (): Promise<boolean> => {
    if (!cloudSaverRef.current || !userIdRef.current) {
      if (getPendingSync()) clearPendingSync();
      setPendingCount(0);
      setSyncState(isOnline() ? 'online' : 'offline');
      const now = Date.now();
      setLastSyncTime(now);
      setLastSyncTimeState(now);
      return true;
    }

    if (!isOnline()) {
      setSyncState('offline');
      return false;
    }

    setSyncState('syncing');
    const result = await flushPendingSync(cloudSaverRef.current, userIdRef.current);
    if (result.success) {
      setSyncState('synced');
      setPendingCount(0);
      const now = Date.now();
      setLastSyncTimeState(now);
      setTimeout(() => {
        setSyncState(s => (s === 'synced' ? 'online' : s));
      }, 3000);
      return true;
    } else {
      setSyncState('error');
      return false;
    }
  }, []);

  // Listen to network status changes
  useEffect(() => {
    const unsubscribe = subscribeNetwork(async isNowOnline => {
      setOnline(isNowOnline);
      if (isNowOnline) {
        setOfflineSinceState(null);
        setOfflineSinceTime(null);
        onNoticeRef.current?.('กลับมาออนไลน์แล้ว — กำลังตรวจสอบข้อมูล');
        const pending = getPendingSync();
        if (pending && cloudSaverRef.current && userIdRef.current) {
          setSyncState('syncing');
          const res = await flushPendingSync(cloudSaverRef.current, userIdRef.current);
          if (res.success) {
            setSyncState('synced');
            setPendingCount(0);
            setLastSyncTimeState(Date.now());
            onNoticeRef.current?.('ซิงค์ข้อมูลล่าสุดกับคลาวด์เรียบร้อยแล้ว');
            setTimeout(() => {
              setSyncState(s => (s === 'synced' ? 'online' : s));
            }, 3000);
          } else {
            setSyncState('error');
            onNoticeRef.current?.(`ซิงค์ข้อมูลไม่สำเร็จ: ${res.error}`);
          }
        } else {
          setSyncState('online');
        }
      } else {
        const now = Date.now();
        setOfflineSinceState(now);
        setOfflineSinceTime(now);
        setSyncState('offline');
        onNoticeRef.current?.('คุณกำลังใช้งานแบบออฟไลน์ — ข้อมูลจะถูกบันทึกในเครื่องอัตโนมัติ');
      }
    });

    return unsubscribe;
  }, []);

  // Auto-sync pending data on mount if online
  useEffect(() => {
    if (online && getPendingSync() && cloudSaver && userId) {
      void triggerSync();
    }
  }, [online, cloudSaver, userId, triggerSync]);

  const queueSave = useCallback(
    (documents: LabelDocument[], activeId: string) => {
      if (!isOnline() || !cloudSaverRef.current || !userIdRef.current) {
        savePendingSync({
          userId: userIdRef.current,
          documents,
          activeId,
        });
        setPendingCount(documents.length);
        if (!isOnline()) setSyncState('offline');
        else setSyncState('pending');
        return;
      }

      setSyncState('syncing');
      cloudSaverRef
        .current(userIdRef.current, documents, activeId)
        .then(() => {
          clearPendingSync();
          setPendingCount(0);
          setSyncState('synced');
          const now = Date.now();
          setLastSyncTime(now);
          setLastSyncTimeState(now);
          setTimeout(() => {
            setSyncState(s => (s === 'synced' ? 'online' : s));
          }, 3000);
        })
        .catch(error => {
          savePendingSync({
            userId: userIdRef.current,
            documents,
            activeId,
            lastError: (error as Error).message,
          });
          setPendingCount(documents.length);
          if (!isOnline()) {
            setSyncState('offline');
          } else {
            setSyncState('error');
          }
        });
    },
    []
  );

  return {
    online,
    syncState,
    pendingCount,
    lastSyncTime,
    offlineSince,
    triggerSync,
    queueSave,
  };
}
