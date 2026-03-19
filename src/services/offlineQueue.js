import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { supabase, isSupabaseConfigured } from "./supabase";

const QUEUE_KEY = "@joypers_hub:offline_queue";
const MAX_RETRIES = 5;

/**
 * Offline queue for punch operations.
 * Queues actions when offline and syncs them when connectivity returns.
 */

let isProcessing = false;
let unsubscribeNetInfo = null;
let _onSyncComplete = null;

/**
 * Register a callback invoked after a successful sync pass.
 * Used by timeclockStore to refresh punches from DB after offline items are synced.
 */
export function onSyncComplete(callback) {
  _onSyncComplete = callback;
}

/**
 * Add an action to the offline queue.
 */
export async function enqueue(action) {
  const queue = await getQueue();
  queue.push({
    ...action,
    id: `oq_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    queuedAt: new Date().toISOString(),
    retryCount: 0,
  });
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

/**
 * Get the current queue.
 */
export async function getQueue() {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn("Failed to read offline queue:", err.message);
    return [];
  }
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
 * Returns { synced: number, failed: number, dropped: number }.
 */
export async function processQueue() {
  if (isProcessing || !isSupabaseConfigured()) return { synced: 0, failed: 0, dropped: 0 };

  isProcessing = true;
  const queue = await getQueue();
  const remaining = [];
  let synced = 0;
  let failed = 0;
  let dropped = 0;

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
      const retryCount = (item.retryCount || 0) + 1;
      if (retryCount >= MAX_RETRIES) {
        console.warn(
          "Dropping offline item after max retries:",
          item.id,
          err.message
        );
        dropped++;
      } else {
        console.warn(
          `Offline sync failed for item: ${item.id} (attempt ${retryCount}/${MAX_RETRIES})`,
          err.message
        );
        remaining.push({ ...item, retryCount });
        failed++;
      }
    }
  }

  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
  isProcessing = false;

  // Notify listeners so local state can be refreshed after sync
  if (synced > 0 && _onSyncComplete) {
    try {
      await _onSyncComplete({ synced, failed, dropped });
    } catch (err) {
      console.warn("onSyncComplete callback failed:", err.message);
    }
  }

  return { synced, failed, dropped };
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
          console.log(
            `Synced ${result.synced} offline actions` +
              (result.dropped > 0 ? `, dropped ${result.dropped}` : "")
          );
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
