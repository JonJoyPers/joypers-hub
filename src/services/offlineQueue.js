import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { supabase, isSupabaseConfigured } from "./supabase";

const QUEUE_KEY = "@joypers_hub:offline_queue";

/**
 * Offline queue for punch operations.
 * Queues actions when offline and syncs them when connectivity returns.
 */

let isProcessing = false;
let unsubscribeNetInfo = null;

/**
 * Add an action to the offline queue.
 */
export async function enqueue(action) {
  const queue = await getQueue();
  queue.push({
    ...action,
    id: `oq_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    queuedAt: new Date().toISOString(),
  });
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

/**
 * Get the current queue.
 */
export async function getQueue() {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  return raw ? JSON.parse(raw) : [];
}

/**
 * Get the count of pending items.
 */
export async function getPendingCount() {
  const queue = await getQueue();
  return queue.length;
}

/**
 * Process the queue — attempt to sync all pending actions.
 * Returns { synced: number, failed: number }.
 */
export async function processQueue() {
  if (isProcessing || !isSupabaseConfigured()) return { synced: 0, failed: 0 };

  isProcessing = true;
  const queue = await getQueue();
  const remaining = [];
  let synced = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      if (item.type === "punch") {
        const row = {
          employee_id: item.employeeId,
          type: item.punchType,
          timestamp: item.timestamp,
          photo_url: item.photoUri || null,
          note: item.note || null,
        };

        if (item.location?.latitude && item.location?.longitude) {
          row.location = `(${item.location.longitude},${item.location.latitude})`;
        }

        const { error } = await supabase.from("punches").insert(row);

        if (error) {
          throw error;
        }
        synced++;
      }
    } catch (err) {
      console.warn("Offline sync failed for item:", item.id, err.message);
      remaining.push(item);
      failed++;
    }
  }

  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
  isProcessing = false;

  return { synced, failed };
}

/**
 * Start listening for network changes and auto-sync.
 */
export function startOfflineSync() {
  if (unsubscribeNetInfo) return; // Already listening

  unsubscribeNetInfo = NetInfo.addEventListener(async (state) => {
    if (state.isConnected && state.isInternetReachable !== false) {
      const queue = await getQueue();
      if (queue.length > 0) {
        const result = await processQueue();
        if (result.synced > 0) {
          console.log(`Synced ${result.synced} offline actions`);
        }
      }
    }
  });
}

/**
 * Stop listening for network changes.
 */
export function stopOfflineSync() {
  if (unsubscribeNetInfo) {
    unsubscribeNetInfo();
    unsubscribeNetInfo = null;
  }
}

/**
 * Check if device is currently online.
 */
export async function isOnline() {
  const state = await NetInfo.fetch();
  return state.isConnected && state.isInternetReachable !== false;
}
