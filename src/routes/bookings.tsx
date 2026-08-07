import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Ban, CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { BookingStatusBadge } from "@/components/status-badge";
import { cancelBooking, getMachine } from "@/lib/store";
import { useLabStore } from "@/hooks/use-lab-store";
import { formatSlot, formatRelative } from "@/lib/format";
import type { BookingStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/bookings")({
  component: BookingsPage,
});

const FILTERS: { id: "all" | BookingStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "completed", label: "Completed" },
  { id: "rejected", label: "Rejected" },
  { id: "cancelled", label: "Cancelled" },
];

function BookingsPage() {
  const { bookings, user } = useLabStore();
  const [filter, setFilter] = useState<"all" | BookingStatus>("all");

  const mine = useMemo(() => {
    return bookings
      .filter((b) => b.userId === user.id)
      .filter((b) => (filter === "all" ? true : b.status === filter))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [bookings, user.id, filter]);

  function handleCancel(id: string) {
    if (cancelBooking(id)) {
      toast.success("Booking cancelled");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            My bookings
          </h1>
          <p className="mt-1 text-muted-foreground">
            Track requests, approved slots, and history
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="gap-1.5">
          <Link to="/book">
            <CalendarPlus className="size-3.5" />
            New booking
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f.id}
            size="sm"
            variant={filter === f.id ? "default" : "outline"}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {mine.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <CalendarPlus className="size-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">
              {filter === "all"
                ? "You have no bookings yet."
                : `No ${filter} bookings.`}
            </p>
            {filter === "all" && (
              <Button asChild variant="outline" size="sm" className="mt-4">
                <Link to="/book">Book a slot</Link>
              </Button>
            )}
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
                    <p className="text-xs italic text-muted-foreground">
                      Note: {b.notes}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
                    <span className="text-xs text-muted-foreground">
                      Requested {formatRelative(b.createdAt)}
                    </span>
                    {canCancel && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                              "gap-1.5 text-destructive hover:text-destructive",
                            )}
                          >
                            <Ban className="size-3.5" />
                            Cancel
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
                            <AlertDialogDescription>
                              {machine?.name} \u00b7 {formatSlot(b.start, b.end)}. This
                              cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Keep booking</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleCancel(b.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Yes, cancel
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
