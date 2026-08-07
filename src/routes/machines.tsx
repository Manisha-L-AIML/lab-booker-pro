import { createFileRoute } from "@tanstack/react-router";
import { MachineCard } from "@/components/machine-card";
import { MACHINES } from "@/data/machines";

export const Route = createFileRoute("/machines")({
  component: MachinesPage,
});

function MachinesPage() {
  const online = MACHINES.filter((m) => m.status === "online").length;
  const maintenance = MACHINES.filter((m) => m.status === "maintenance").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Machine inventory
        </h1>
        <p className="mt-1 text-muted-foreground">
          {online} online · {maintenance} under maintenance · {MACHINES.length}{" "}
          total
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {MACHINES.map((m) => (
          <MachineCard key={m.id} machine={m} />
        ))}
      </div>
    </div>
  );
}
