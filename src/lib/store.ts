import { addHours, addDays, setHours, setMinutes, startOfDay } from "date-fns";
import type { Booking, CurrentUser, UserRole } from "./types";
import { MACHINES } from "@/data/machines";

const STORAGE_KEY = "lab-booker-pro-v1";

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
      purpose: "CS472 assignment — ResNet training",
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

function load(): StoreState {
  if (typeof window === "undefined") {
    return { bookings: seedBookings(), currentRole: "student" };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoreState;
      return {
        bookings: parsed.bookings ?? seedBookings(),
        currentRole: parsed.currentRole ?? "student",
      };
    }
  } catch {
    // ignore
  }
  return { bookings: seedBookings(), currentRole: "student" };
}

function save(state: StoreState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = load();
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
  save(state);
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot(): StoreState {
  return state;
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
    if (b.status === "rejected" || b.status === "cancelled") return false;
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
  if (!isSlotAvailable(input.machineId, input.start, input.end)) {
    return { ok: false, error: "This slot is no longer available." };
  }
  if (!input.purpose.trim()) {
    return { ok: false, error: "Please describe the purpose of your booking." };
  }

  const booking: Booking = {
    id: `b-${Date.now()}`,
    machineId: input.machineId,
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    purpose: input.purpose.trim(),
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

export function getUtilization() {
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
      const now = new Date();
      return (
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    }).length,
  };
}

/** Generate standard lab slots for a given day (09:00–21:00, 2h blocks) */
export function getDaySlots(day: Date) {
  const base = startOfDay(day);
  const slots = [];
  for (let h = 9; h < 21; h += 2) {
    const start = setMinutes(setHours(base, h), 0);
    const end = addHours(start, 2);
    slots.push({
      start,
      end,
      label: `${String(h).padStart(2, "0")}:00 – ${String(h + 2).padStart(2, "0")}:00`,
    });
  }
  return slots;
}
