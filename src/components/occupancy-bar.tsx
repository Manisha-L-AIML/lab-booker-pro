import { cn } from "@/lib/utils";
import {
  getHourTicks,
  getMachineOccupancy,
  type OccupancyBlock,
} from "@/lib/occupancy";
import type { Booking } from "@/lib/types";

function blockColor(status: OccupancyBlock["status"]) {
  if (status === "pending") return "bg-amber-500/70";
  return "bg-primary/70";
}

export function OccupancyBar({
  machineId,
  day,
  bookings,
  className,
  showTicks = true,
}: {
  machineId: string;
  day: Date;
  bookings: Booking[];
  className?: string;
  showTicks?: boolean;
}) {
  const blocks = getMachineOccupancy(machineId, day, bookings);
  const ticks = getHourTicks();

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="relative h-7 w-full overflow-hidden rounded-md border bg-muted/40">
        {blocks.map((b) => (
          <div
            key={b.id}
            title={`${b.userName} · ${b.startLabel}–${b.endLabel} (${b.status})`}
            className={cn(
              "absolute top-0.5 bottom-0.5 rounded-sm transition-opacity hover:opacity-100",
              blockColor(b.status),
              b.status === "pending" ? "opacity-80" : "opacity-90",
            )}
            style={{ left: `${b.left}%`, width: `${b.width}%` }}
          />
        ))}
        {blocks.length === 0 && (
          <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
            Free all day
          </div>
        )}
      </div>
      {showTicks && (
        <div className="relative h-3 text-[10px] text-muted-foreground">
          {ticks.map((t) => (
            <span
              key={t.label}
              className="absolute -translate-x-1/2"
              style={{ left: `${t.pct}%` }}
            >
              {t.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
