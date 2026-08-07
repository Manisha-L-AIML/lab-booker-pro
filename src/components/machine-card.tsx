import { Cpu, HardDrive, MapPin, Microchip } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MachineStatusBadge } from "@/components/status-badge";
import type { Machine } from "@/lib/types";
import { cn } from "@/lib/utils";

export function MachineCard({
  machine,
  selected,
  onSelect,
  compact,
}: {
  machine: Machine;
  selected?: boolean;
  onSelect?: () => void;
  compact?: boolean;
}) {
  const interactive = Boolean(onSelect);

  return (
    <Card
      className={cn(
        "transition-all duration-200",
        interactive &&
          "cursor-pointer hover:border-primary/50 hover:shadow-md",
        selected && "border-primary ring-2 ring-primary/20 shadow-md",
        machine.status !== "online" && "opacity-70",
      )}
      onClick={interactive ? onSelect : undefined}
    >
      <CardHeader className={cn("pb-3", compact && "p-4 pb-2")}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base font-semibold tracking-tight">
              {machine.name}
            </CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="size-3" />
              {machine.location}
            </p>
          </div>
          <MachineStatusBadge status={machine.status} />
        </div>
      </CardHeader>
      <CardContent className={cn("space-y-2.5", compact && "p-4 pt-0")}>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Microchip className="size-3.5 shrink-0" />
            <span className="truncate">{machine.gpu}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <HardDrive className="size-3.5 shrink-0" />
            <span>{machine.vram} VRAM</span>
          </div>
          {!compact && (
            <>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Cpu className="size-3.5 shrink-0" />
                <span className="truncate">{machine.cpu}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <HardDrive className="size-3.5 shrink-0" />
                <span>{machine.ram} RAM</span>
              </div>
            </>
          )}
        </div>
        {!compact && machine.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {machine.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
