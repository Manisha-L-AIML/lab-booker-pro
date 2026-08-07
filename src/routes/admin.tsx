import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { toast } from "sonner";
import { Check, RotateCcw, X } from "lucide-react";
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
import { PageHeader } from "@/components/page-header";
import { getMachine, resetDemoData, updateBookingStatus } from "@/lib/store";
import { useLabStore } from "@/hooks/use-lab-store";
import { formatSlot, formatRelative } from "@/lib/format";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

function AdminPage() {
  const { bookings, user } = useLabStore();

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

  const sorted = useMemo(
    () =>
      [...bookings].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [bookings],
  );
  const pending = sorted.filter((b) => b.status === "pending");
  const others = sorted.filter((b) => b.status !== "pending");

  function approve(id: string) {
    updateBookingStatus(id, "approved");
    toast.success("Booking approved");
  }

  function reject(id: string) {
    updateBookingStatus(id, "rejected", "Rejected by lab in-charge");
    toast.message("Booking rejected");
  }

  function handleReset() {
    resetDemoData();
    toast.success("Demo data reset");
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Lab administration"
        description="Review and act on booking requests"
        actions={
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <RotateCcw className="size-3.5" />
                Reset demo data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset all bookings?</AlertDialogTitle>
                <AlertDialogDescription>
                  This restores the original seed bookings and clears anything
                  you created. Your role selection is kept.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleReset}>
                  Reset
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        }
      />

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
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline" className="gap-1.5">
                            <X className="size-3.5" />
                            Reject
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Reject this request?</AlertDialogTitle>
                            <AlertDialogDescription>
                              {b.userName}&apos;s request for{" "}
                              {getMachine(b.machineId)?.name} will be rejected.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Keep pending</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => reject(b.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Reject
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
          All other bookings
        </h2>
        <Card>
          <CardContent className="pt-6">
            {others.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No other bookings yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-3 font-medium">User</th>
                      <th className="pb-3 font-medium">Machine</th>
                      <th className="hidden pb-3 font-medium sm:table-cell">
                        Slot
                      </th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="hidden pb-3 font-medium md:table-cell">
                        Requested
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {others.map((b) => (
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
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
