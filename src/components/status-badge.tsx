import { cn } from "@/lib/utils";
import type { BookingStatus, MachineStatus } from "@/lib/types";

const bookingStyles: Record<BookingStatus, string> = {
  pending:
    "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  approved:
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  rejected: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
  cancelled:
    "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30",
  completed:
    "bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/30",
};

const machineStyles: Record<MachineStatus, string> = {
  online:
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  maintenance:
    "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  offline: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
};

export function BookingStatusBadge({
  status,
  className,
}: {
  status: BookingStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
        bookingStyles[status],
        className,
      )}
    >
      {status}
    </span>
  );
}

export function MachineStatusBadge({
  status,
  className,
}: {
  status: MachineStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
        machineStyles[status],
        className,
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          status === "online" && "bg-emerald-500",
          status === "maintenance" && "bg-amber-500",
          status === "offline" && "bg-red-500",
        )}
      />
      {status}
    </span>
  );
}
