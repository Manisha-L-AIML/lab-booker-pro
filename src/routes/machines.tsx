import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MachineCard } from "@/components/machine-card";
import { OccupancyBar } from "@/components/occupancy-bar";
import { PageHeader } from "@/components/page-header";
import { Progress } from "@/components/ui/progress";
import { MACHINES } from "@/data/machines";
import { getUtilizationPercent } from "@/lib/occupancy";
import { useLabStore } from "@/hooks/use-lab-store";
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
  const { bookings } = useLabStore();
  const [status, setStatus] = useState<"all" | MachineStatus>("all");
  const [query, setQuery] = useState("");
  const today = useMemo(() => new Date(), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MACHINES.filter((m) => {
      if (status !== "all" && m.status !== status) return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.gpu.toLowerCase().includes(q) ||
        m.location.toLowerCase().includes(q) ||
        m.tags.some((t) => t.includes(q))
      );
    });
  }, [status, query]);

  const online = MACHINES.filter((m) => m.status === "online").length;
  const maintenance = MACHINES.filter((m) => m.status === "maintenance").length;
  const offline = MACHINES.filter((m) => m.status === "offline").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Machine inventory"
        description={`${online} online · ${maintenance} maintenance · ${offline} offline · ${MACHINES.length} total`}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search GPU, name, tag…"
            className="pl-8"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Utilization overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Today’s utilization</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {MACHINES.filter((m) => m.status === "online").map((m) => {
            const pct = getUtilizationPercent(m.id, today, bookings);
            return (
              <div key={m.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{m.name}</span>
                  <span className="text-muted-foreground">{pct}%</span>
                </div>
                <Progress value={pct} className="h-1.5" />
                <OccupancyBar
                  machineId={m.id}
                  day={today}
                  bookings={bookings}
                  showTicks={false}
                  className="pt-0.5"
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

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
