import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";

// ── Types ──────────────────────────────────────────────────────────────────
interface QueuedOp {
  id: string;
  table: string;
  type: "insert" | "update";
  payload: Record<string, unknown>;
  rowId?: string;
  timestamp: number;
}

const QUEUE_KEY = "fitty_offline_queue_v1";

// ── Persist queue to localStorage ─────────────────────────────────────────
function loadQueue(): QueuedOp[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]") as QueuedOp[];
  } catch {
    return [];
  }
}
function saveQueue(q: QueuedOp[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
}

// ── Main hook ──────────────────────────────────────────────────────────────
export function useOfflineSync() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [queue, setQueue] = useState<QueuedOp[]>(loadQueue);
  const syncingRef = useRef(false);

  // Listen for online/offline events
  useEffect(() => {
    const goOnline = () => setIsOffline(false);
    const goOffline = () => setIsOffline(true);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  // Sync queue when coming back online
  const syncQueue = useCallback(async () => {
    if (syncingRef.current) return;
    const q = loadQueue();
    if (!q.length) return;
    syncingRef.current = true;
    const remaining: QueuedOp[] = [];
    for (const op of q) {
      try {
        if (op.type === "insert") {
          await supabase.from(op.table).insert(op.payload);
        } else if (op.type === "update" && op.rowId) {
          await supabase.from(op.table).update(op.payload).eq("id", op.rowId);
        }
      } catch {
        remaining.push(op); // keep failed ops
      }
    }
    saveQueue(remaining);
    setQueue(remaining);
    syncingRef.current = false;
  }, []);

  useEffect(() => {
    if (!isOffline && queue.length > 0) {
      syncQueue();
    }
  }, [isOffline, queue.length, syncQueue]);

  // Auto-sync periodically when online
  useEffect(() => {
    const iv = setInterval(() => {
      if (!isOffline && loadQueue().length > 0) syncQueue();
    }, 30_000);
    return () => clearInterval(iv);
  }, [isOffline, syncQueue]);

  // Enqueue an operation for offline use
  const enqueue = useCallback((op: Omit<QueuedOp, "id" | "timestamp">) => {
    const full: QueuedOp = { ...op, id: crypto.randomUUID(), timestamp: Date.now() };
    const q = [...loadQueue(), full];
    saveQueue(q);
    setQueue(q);
    return full.id;
  }, []);

  // Write to Supabase or queue if offline
  const safeInsert = useCallback(async (table: string, payload: Record<string, unknown>): Promise<boolean> => {
    if (!isOffline) {
      const { error } = await supabase.from(table).insert(payload);
      if (!error) return true;
    }
    enqueue({ table, type: "insert", payload });
    return false; // queued
  }, [isOffline, enqueue]);

  return { isOffline, queueLength: queue.length, safeInsert, syncQueue };
}
