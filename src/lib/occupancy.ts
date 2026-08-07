import { startOfDay, endOfDay, setHours, setMinutes } from "date-fns";
import type { Booking } from "./types";

const DAY_START_H = 9;
const DAY_END_H = 21;
const DAY_MINUTES = (DAY_END_H - DAY_START_H) * 60;

export interface OccupancyBlock {
  id: string;
  userName: string;
  status: Booking["status"];
  /** 0–100 left position */
  left: number;
  /** 0–100 width */
  width: number;
  startLabel: string;
  endLabel: string;
}

function minutesFromDayStart(d: Date): number {
  return d.getHours() * 60 + d.getMinutes() - DAY_START_H * 60;
}

/** Active bookings for a machine on a given day, mapped to timeline positions. */
export function getMachineOccupancy(
  machineId: string,
  day: Date,
  bookings: Booking[],
): OccupancyBlock[] {
  const dayStart = startOfDay(day).getTime();
  const dayEnd = endOfDay(day).getTime();

  return bookings
    .filter((b) => {
      if (b.machineId !== machineId) return false;
      if (
        b.status === "rejected" ||
        b.status === "cancelled" ||
        b.status === "completed"
      )
        return false;
      const s = new Date(b.start).getTime();
      const e = new Date(b.end).getTime();
      return s < dayEnd && e > dayStart;
    })
    .map((b) => {
      const s = new Date(b.start);
      const e = new Date(b.end);
      const startMin = Math.max(0, minutesFromDayStart(s));
      const endMin = Math.min(DAY_MINUTES, minutesFromDayStart(e));
      const left = (startMin / DAY_MINUTES) * 100;
      const width = Math.max(2, ((endMin - startMin) / DAY_MINUTES) * 100);
      return {
        id: b.id,
        userName: b.userName,
        status: b.status,
        left,
        width,
        startLabel: `${String(s.getHours()).padStart(2, "0")}:${String(s.getMinutes()).padStart(2, "0")}`,
        endLabel: `${String(e.getHours()).padStart(2, "0")}:${String(e.getMinutes()).padStart(2, "0")}`,
      };
    });
}

/** % of the lab day (09–21) that is booked for a machine. */
export function getUtilizationPercent(
  machineId: string,
  day: Date,
  bookings: Booking[],
): number {
  const blocks = getMachineOccupancy(machineId, day, bookings);
  if (blocks.length === 0) return 0;
  // Approximate by summing widths (overlaps rare due to conflict rules)
  const total = blocks.reduce((sum, b) => sum + b.width, 0);
  return Math.min(100, Math.round(total));
}

export function labHoursLabel() {
  return "09:00 – 21:00";
}

export function getHourTicks(): { label: string; pct: number }[] {
  const ticks = [];
  for (let h = DAY_START_H; h <= DAY_END_H; h += 3) {
    ticks.push({
      label: `${String(h).padStart(2, "0")}:00`,
      pct: ((h - DAY_START_H) / (DAY_END_H - DAY_START_H)) * 100,
    });
  }
  return ticks;
}

/** Generate slots with configurable duration (hours). */
export function getFlexibleSlots(day: Date, durationHours: 2 | 4) {
  const base = startOfDay(day);
  const slots = [];
  for (let h = DAY_START_H; h + durationHours <= DAY_END_H; h += 2) {
    const start = setMinutes(setHours(base, h), 0);
    const end = setMinutes(setHours(base, h + durationHours), 0);
    slots.push({
      start,
      end,
      label: `${String(h).padStart(2, "0")}:00 – ${String(h + durationHours).padStart(2, "0")}:00`,
    });
  }
  return slots;
}
