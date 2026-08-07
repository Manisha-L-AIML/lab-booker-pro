import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CalendarPlus,
  CheckCircle2,
  Clock,
  Server,
  UserRound,
  ArrowRight,
} from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookingStatusBadge } from "@/components/status-badge";
import { PageHeader } from "@/components/page-header";
import { MACHINES } from "@/data/machines";
import { getMachine, getUtilization } from "@/lib/store";
import { getUtilizationPercent } from "@/lib/occupancy";
import { useLabStore } from "@/hooks/use-lab-store";
import { formatSlot, formatRelative } from "@/lib/format";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

function Dashboard() {
  const { bookings, user } = useLabStore();
  const stats = getUtilization();
  const today = useMemo(() => new Date(), []);

  const myUpcoming = useMemo(
    () =>
      bookings
        .filter(
          (b) =>
            b.userId === user.id &&
            (b.status === "approved" || b.status === "pending") &&
            new Date(b.end) > new Date(),
        )
        .sort(
          (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
        )
        .slice(0, 5),
    [bookings, user.id],
  );

  const recent = useMemo(() => bookings.slice(0, 6), [bookings]);

  const fleetUtil = useMemo(() => {
    const online = MACHINES.filter((m) => m.status === "online");
    if (online.length === 0) return 0;
    const sum = online.reduce(
      (acc, m) => acc + getUtilizationPercent(m.id, today, bookings),
      0,
    );
    return Math.round(sum / online.length);
  }, [bookings, today]);

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome back, ${user.name.split(" ")[0]}`}
        description="AI/ML Lab · Fair access, zero double-booking"
        actions={
          <Button asChild size="lg" className="gap-2">
            <Link to="/book">
              <CalendarPlus className="size-4" />
              Book a slot
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Online machines"
          value={`${stats.onlineMachines}/${stats.totalMachines}`}
          icon={Server}
          hint="Ready for booking"
        />
        <StatCard
          title="Pending requests"
          value={String(stats.pending)}
          icon={Clock}
          hint="Awaiting approval"
          accent={stats.pending > 0 ? "amber" : undefined}
        />
        <StatCard
          title="Active today"
          value={String(stats.approvedToday)}
          icon={CheckCircle2}
          hint="Approved slots"
        />
        <StatCard
          title="Fleet load"
          value={`${fleetUtil}%`}
          icon={UserRound}
          hint="Avg utilization today"
        />
      </div>

      {/* Fleet utilization strip */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 via-transparent to-transparent p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                Lab capacity today
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Average booking load across online machines (09:00–21:00)
              </p>
            </div>
            <div className="text-3xl font-bold tracking-tight tabular-nums">
              {fleetUtil}%
            </div>
          </div>
          <Progress value={fleetUtil} className="mt-4 h-2" />
          <div className="mt-4 flex justify-end">
            <Button asChild variant="ghost" size="sm" className="gap-1">
              <Link to="/machines">
                View fleet detail
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-lg">Your upcoming slots</CardTitle>
            <CardDescription>
              Approved and pending bookings for the next few days
            </CardDescription>
          </CardHeader>
          <CardContent>
            {myUpcoming.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <CalendarPlus className="size-10 text-muted-foreground/40" />
                <p className="mt-3 text-sm text-muted-foreground">
                  No upcoming bookings
                </p>
                <Button asChild variant="outline" size="sm" className="mt-4">
                  <Link to="/book">Book your first slot</Link>
                </Button>
              </div>
            ) : (
              <ul className="space-y-3">
                {myUpcoming.map((b) => {
                  const machine = getMachine(b.machineId);
                  return (
                    <li
                      key={b.id}
                      className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/30"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {machine?.name ?? b.machineId}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatSlot(b.start, b.end)}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {b.purpose}
                        </p>
                      </div>
                      <BookingStatusBadge status={b.status} />
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Fleet status</CardTitle>
            <CardDescription>Machine availability at a glance</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5">
              {MACHINES.map((m) => {
                const pct = getUtilizationPercent(m.id, today, bookings);
                return (
                  <li key={m.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 font-medium">
                        <span
                          className={`size-1.5 rounded-full ${
                            m.status === "online"
                              ? "bg-emerald-500"
                              : m.status === "maintenance"
                                ? "bg-amber-500"
                                : "bg-red-500"
                          }`}
                        />
                        {m.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {m.status === "online" ? `${pct}%` : m.status}
                      </span>
                    </div>
                    {m.status === "online" && (
                      <Progress value={pct} className="h-1" />
                    )}
                  </li>
                );
              })}
            </ul>
            <Button asChild variant="ghost" size="sm" className="mt-4 w-full">
              <Link to="/machines">View all machines</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent activity</CardTitle>
          <CardDescription>
            Latest booking requests across the lab
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 font-medium">User</th>
                  <th className="pb-3 font-medium">Machine</th>
                  <th className="hidden pb-3 font-medium sm:table-cell">Slot</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="hidden pb-3 font-medium md:table-cell">When</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((b) => (
                  <tr
                    key={b.id}
                    className="border-b last:border-0 transition-colors hover:bg-muted/20"
                  >
                    <td className="py-3">
                      <div className="font-medium">{b.userName}</div>
                      <div className="text-xs capitalize text-muted-foreground">
                        {b.userRole}
                      </div>
                    </td>
                    <td className="py-3">
                      {getMachine(b.machineId)?.name ?? b.machineId}
                    </td>
                    <td className="hidden py-3 text-muted-foreground sm:table-cell">
                      {formatSlot(b.start, b.end)}
                    </td>
                    <td className="py-3">
                      <BookingStatusBadge status={b.status} />
                    </td>
                    <td className="hidden py-3 text-muted-foreground md:table-cell">
                      {formatRelative(b.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  hint,
  accent,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  hint: string;
  accent?: "amber";
}) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p
              className={`mt-1 text-2xl font-bold tracking-tight tabular-nums capitalize ${
                accent === "amber" ? "text-amber-600 dark:text-amber-400" : ""
              }`}
            >
              {value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
          </div>
          <div className="rounded-lg bg-primary/10 p-2.5">
            <Icon className="size-4 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
