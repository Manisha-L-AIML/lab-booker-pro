import { createFileRoute, redirect } from "@tanstack/react-router";
import { useSyncExternalStore } from "react";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BookingStatusBadge } from "@/components/status-badge";
import {
  getBookings,
  getCurrentUser,
  getMachine,
  getSnapshot,
  subscribe,
  updateBookingStatus,
} from "@/lib/store";
import { formatSlot, formatRelative } from "@/lib/format";

export const Route = createFileRoute("/admin")({
  beforeLoad: () => {
    // Soft guard: page still renders a message if not admin
  },
  component: AdminPage,
});

function useStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

function AdminPage() {
  useStore();
  const user = getCurrentUser();

  if (user.role !== "admin") {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
        <h1 className="text-xl font-semibold">Admin access required</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Switch to the <strong>Lab In-Charge</strong> role using the profile
          menu to manage booking requests.
        </p>
      </div>
    );
  }

  const bookings = getBookings().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const pending = bookings.filter((b) => b.status === "pending");
  const others = bookings.filter((b) => b.status !== "pending");

  function approve(id: string) {
    updateBookingStatus(id, "approved");
    toast.success("Booking approved");
  }

  function reject(id: string) {
    updateBookingStatus(id, "rejected", "Rejected by lab in-charge");
    toast.message("Booking rejected");
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Lab administration
        </h1>
        <p className="mt-1 text-muted-foreground">
          Review and act on booking requests
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Pending approval ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No pending requests. All clear.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {pending.map((b) => (
              <Card key={b.id} className="border-amber-500/30">
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">
                        {getMachine(b.machineId)?.name ?? b.machineId}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {b.userName} · {b.userRole} ·{" "}
                        {formatSlot(b.start, b.end)}
                      </CardDescription>
                    </div>
                    <BookingStatusBadge status={b.status} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm">{b.purpose}</p>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
                    <span className="text-xs text-muted-foreground">
                      Requested {formatRelative(b.createdAt)}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        onClick={() => reject(b.id)}
                      >
                        <X className="size-3.5" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        className="gap-1.5"
                        onClick={() => approve(b.id)}
                      >
                        <Check className="size-3.5" />
                        Approve
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          All bookings
        </h2>
        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 font-medium">User</th>
                    <th className="pb-3 font-medium">Machine</th>
                    <th className="pb-3 font-medium hidden sm:table-cell">Slot</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium hidden md:table-cell">Requested</th>
                  </tr>
                </thead>
                <tbody>
                  {others.map((b) => (
                    <tr key={b.id} className="border-b last:border-0">
                      <td className="py-3">
                        <div className="font-medium">{b.userName}</div>
                        <div className="text-xs capitalize text-muted-foreground">
                          {b.userRole}
                        </div>
                      </td>
                      <td className="py-3">
                        {getMachine(b.machineId)?.name ?? b.machineId}
                      </td>
                      <td className="py-3 hidden sm:table-cell text-muted-foreground">
                        {formatSlot(b.start, b.end)}
                      </td>
                      <td className="py-3">
                        <BookingStatusBadge status={b.status} />
                      </td>
                      <td className="py-3 hidden md:table-cell text-muted-foreground">
                        {formatRelative(b.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
