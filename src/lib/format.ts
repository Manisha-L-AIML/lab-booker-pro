import { format, formatDistanceToNow, isToday, isTomorrow, parseISO } from "date-fns";

export function formatSlot(start: string, end: string) {
  const s = parseISO(start);
  const e = parseISO(end);
  const day = isToday(s)
    ? "Today"
    : isTomorrow(s)
      ? "Tomorrow"
      : format(s, "EEE, MMM d");
  return `${day} · ${format(s, "HH:mm")} – ${format(e, "HH:mm")}`;
}

export function formatRelative(iso: string) {
  return formatDistanceToNow(parseISO(iso), { addSuffix: true });
}

export function statusLabel(status: string) {
  const map: Record<string, string> = {
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    cancelled: "Cancelled",
    completed: "Completed",
  };
  return map[status] ?? status;
}
