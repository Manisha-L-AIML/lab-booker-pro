import { addHours, addDays, setHours, setMinutes, startOfDay } from "date-fns";
import type { Booking, CurrentUser, UserRole } from "./types";
import { MACHINES } from "@/data/machines";

const STORAGE_KEY = "lab-booker-pro-v2";

const DEMO_USERS: Record<UserRole, CurrentUser> = {
  student: {
    id: "u-student",
    name: "Alex Rivera",
    role: "student",
    email: "alex.rivera@uni.edu",
  },
  faculty: {
    id: "u-faculty",
    name: "Dr. Priya Sharma",
    role: "faculty",
    email: "priya.sharma@uni.edu",
  },
  admin: {
    id: "u-admin",
    name: "Lab In-Charge",
    role: "admin",
    email: "lab.admin@uni.edu",
  },
};

function seedBookings(): Booking[] {
  const today = startOfDay(new Date());
  const t = (dayOffset: number, hour: number) =>
    setMinutes(setHours(addDays(today, dayOffset), hour), 0).toISOString();

  return [
    {
      id: "b-1",
      machineId: "gpu-01",
      userId: "u-faculty",
      userName: "Dr. Priya Sharma",
      userRole: "faculty",
      purpose: "Fine-tune LLaMA-3 8B for NLP course",
      start: t(0, 9),
      end: t(0, 13),
      status: "approved",
      createdAt: t(-2, 10),
    },
    {
      id: "b-2",
      machineId: "gpu-03",
      userId: "u-student",
      userName: "Alex Rivera",
      userRole: "student",
      purpose: "Diffusion model experiments (thesis)",
      start: t(0, 14),
      end: t(0, 18),
      status: "pending",
      createdAt: t(-1, 16),
    },
    {
      id: "b-3",
      machineId: "gpu-05",
      userId: "u-student",
      userName: "Jordan Lee",
      userRole: "student",
      purpose: "CS472 assignment \u2014 ResNet training",
      start: t(1, 10),
      end: t(1, 14),
      status: "approved",
      createdAt: t(-1, 9),
    },
    {
      id: "b-4",
      machineId: "gpu-07",
      userId: "u-faculty",
      userName: "Prof. Chen",
      userRole: "faculty",
      purpose: "Multi-node H100 cluster test",
      start: t(2, 8),
      end: t(2, 20),
      status: "approved",
      createdAt: t(-3, 11),
    },
    {
      id: "b-5",
      machineId: "gpu-02",
      userId: "u-student",
      userName: "Sam Okonkwo",
      userRole: "student",
      purpose: "YOLOv8 fine-tuning",
      start: t(0, 10),
      end: t(0, 12),
      status: "rejected",
      createdAt: t(-1, 14),
      notes: "Overlaps with maintenance window",
    },
  ];
}

interface StoreState {
  bookings: Booking[];
  currentRole: UserRole;
}

/** Stable server snapshot \u2014 never reads localStorage (avoids hydration mismatch). */
const SERVER_STATE: StoreState = {
  bookings: seedBookings(),
  currentRole: "student",
};

function loadClient(): StoreState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoreState;
      return {
        bookings: Array.isArray(parsed.bookings)
          ? autoComplete(parsed.bookings)
          : seedBookings(),
        currentRole: parsed.currentRole ?? "student",
      };
    }
  } catch {
    // corrupt storage \u2014 fall through to seed
  }
  return { bookings: seedBookings(), currentRole: "student" };
}

/** Mark approved bookings past their end time as completed. */
function autoComplete(bookings: Booking[]): Booking[] {
  const now = Date.now();
  return bookings.map((b) => {
    if (
      (b.status === "approved" || b.status === "pending") &&
      new Date(b.end).getTime() < now
    ) {
      return { ...b, status: "completed" as const };
    }
    return b;
  });
}

function save(state: StoreState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // quota exceeded \u2014 ignore
  }
}

let state: StoreState =
  typeof window === "undefined" ? SERVER_STATE : loadClient();
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
  save(state);
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSnapshot(): StoreState {
  return state;
}

export function getServerSnapshot(): StoreState {
  return SERVER_STATE;
}

export function getCurrentUser(): CurrentUser {
  return DEMO_USERS[state.currentRole];
}

export function setRole(role: UserRole) {
  state = { ...state, currentRole: role };
  notify();
}

export function getBookings(): Booking[] {
  return state.bookings;
}

export function getMachine(id: string) {
  return MACHINES.find((m) => m.id === id);
}

export function isSlotAvailable(
  machineId: string,
  start: string,
  end: string,
  excludeId?: string,
): boolean {
  const machine = getMachine(machineId);
  if (!machine || machine.status !== "online") return false;

  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (e <= s) return false;

  return !state.bookings.some((b) => {
    if (b.machineId !== machineId) return false;
    if (b.id === excludeId) return false;
    if (
      b.status === "rejected" ||
      b.status === "cancelled" ||
      b.status === "completed"
    )
      return false;
    const bs = new Date(b.start).getTime();
    const be = new Date(b.end).getTime();
    return s < be && e > bs;
  });
}

export function createBooking(input: {
  machineId: string;
  purpose: string;
  start: string;
  end: string;
}): { ok: true; booking: Booking } | { ok: false; error: string } {
  const user = getCurrentUser();
  const purpose = input.purpose.trim();

  if (purpose.length < 8) {
    return {
      ok: false,
      error: "Please describe your work in at least 8 characters.",
    };
  }
  if (!isSlotAvailable(input.machineId, input.start, input.end)) {
    return { ok: false, error: "This slot is no longer available." };
  }

  const booking: Booking = {
    id: `b-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    machineId: input.machineId,
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    purpose,
    start: input.start,
    end: input.end,
    status: user.role === "admin" ? "approved" : "pending",
    createdAt: new Date().toISOString(),
  };

  state = { ...state, bookings: [booking, ...state.bookings] };
  notify();
  return { ok: true, booking };
}

export function updateBookingStatus(
  id: string,
  status: Booking["status"],
  notes?: string,
): boolean {
  const idx = state.bookings.findIndex((b) => b.id === id);
  if (idx === -1) return false;
  const next = [...state.bookings];
  const existing = next[idx]!;
  next[idx] = {
    ...existing,
    status,
    ...(notes !== undefined ? { notes } : {}),
  };
  state = { ...state, bookings: next };
  notify();
  return true;
}

export function cancelBooking(id: string): boolean {
  return updateBookingStatus(id, "cancelled");
}

export function resetDemoData() {
  state = { bookings: seedBookings(), currentRole: state.currentRole };
  notify();
}

export function getUtilization() {
  const now = new Date();
  const active = state.bookings.filter(
    (b) => b.status === "approved" || b.status === "pending",
  );
  const online = MACHINES.filter((m) => m.status === "online").length;
  return {
    totalMachines: MACHINES.length,
    onlineMachines: online,
    pending: state.bookings.filter((b) => b.status === "pending").length,
    approvedToday: active.filter((b) => {
      const d = new Date(b.start);
      return (
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    }).length,
  };
}

/** Standard lab slots: 09:00\u201321:00 in 2-hour blocks. */
export function getDaySlots(day: Date) {
  const base = startOfDay(day);
  const slots = [];
  for (let h = 9; h < 21; h += 2) {
    const start = setMinutes(setHours(base, h), 0);
    const end = addHours(start, 2);
    slots.push({
      start,
      end,
      label: `${String(h).padStart(2, "0")}:00 \u2013 ${String(h + 2).padStart(2, "0")}:00`,
    });
  }
  return slots;
}
