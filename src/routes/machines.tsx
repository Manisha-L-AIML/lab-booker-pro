import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { MachineCard } from "@/components/machine-card";
import { MACHINES } from "@/data/machines";
import type { MachineStatus } from "@/lib/types";

export const Route = createFileRoute("/machines")({
  component: MachinesPage,
});

const STATUS_FILTERS: { id: "all" | MachineStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "online", label: "Online" },
  { id: "maintenance", label: "Maintenance" },
  { id: "offline", label: "Offline" },
];

function MachinesPage() {
  const [status, setStatus] = useState<"all" | MachineStatus>("all");

  const filtered = useMemo(
    () =>
      status === "all"
        ? MACHINES
        : MACHINES.filter((m) => m.status === status),
    [status],
  );

  const online = MACHINES.filter((m) => m.status === "online").length;
  const maintenance = MACHINES.filter((m) => m.status === "maintenance").length;
  const offline = MACHINES.filter((m) => m.status === "offline").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Machine inventory
        </h1>
        <p className="mt-1 text-muted-foreground">
          {online} online \u00b7 {maintenance} maintenance \u00b7 {offline} offline \u00b7{" "}
          {MACHINES.length} total
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <Button
            key={f.id}
            size="sm"
            variant={status === f.id ? "default" : "outline"}
            onClick={() => setStatus(f.id)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No machines match this filter.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((m) => (
            <MachineCard key={m.id} machine={m} />
          ))}
        </div>
      )}
    </div>
  );
}
