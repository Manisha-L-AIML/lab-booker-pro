import { useSyncExternalStore } from "react";
import {
  getCurrentUser,
  getSnapshot,
  getServerSnapshot,
  subscribe,
} from "@/lib/store";

/** Hydration-safe subscription to the lab booking store. */
export function useLabStore() {
  const snapshot = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  return {
    ...snapshot,
    user: getCurrentUser(),
  };
}
