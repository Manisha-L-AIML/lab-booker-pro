import { createFileRoute } from "@tanstack/react-router";
import { useSyncExternalStore } from "react";
import { toast } from "sonner";
import { Ban } from "lucide-react";
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
  cancelBooking,
  getBookings,
  getCurrentUser,
  getMachine,
  getSnapshot,
  subscribe,
} from "@/lib/store";
import { formatSlot, formatRelative } from "@/lib/format";

export const Route = createFileRoute("/bookings")({
  component: BookingsPage,
});

function useStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

function BookingsPage() {
  useStore();
  const user = getCurrentUser();
  const mine = getBookings()
    .filter((b) => b.userId === user.id)
    .sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

  function handleCancel(id: string) {
    if (cancelBooking(id)) {
      toast.success("Booking cancelled");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          My bookings
        </h1>
        <p className="mt-1 text-muted-foreground">
          Track requests, approved slots, and history
        </p>
      </div>

      {mine.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-muted-foreground">You have no bookings yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {mine.map((b) => {
            const machine = getMachine(b.machineId);
            const canCancel =
              b.status === "pending" || b.status === "approved";
            return (
              <Card key={b.id}>
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">
                        {machine?.name ?? b.machineId}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {formatSlot(b.start, b.end)}
                      </CardDescription>
                    </div>
                    <BookingStatusBadge status={b.status} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm">{b.purpose}</p>
                  {b.notes && (
                    <p className="text-xs text-muted-foreground italic">
                      Note: {b.notes}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
                    <span className="text-xs text-muted-foreground">
                      Requested {formatRelative(b.createdAt)}
                    </span>
                    {canCancel && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-destructive hover:text-destructive"
                        onClick={() => handleCancel(b.id)}
                      >
                        <Ban className="size-3.5" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
