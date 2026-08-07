import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { addDays, format, isBefore, startOfDay } from "date-fns";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarPlus, Check, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MachineCard } from "@/components/machine-card";
import { OccupancyBar } from "@/components/occupancy-bar";
import { PageHeader } from "@/components/page-header";
import { MACHINES } from "@/data/machines";
import { createBooking, isSlotAvailable } from "@/lib/store";
import { getFlexibleSlots } from "@/lib/occupancy";
import { useLabStore } from "@/hooks/use-lab-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/book")({
  component: BookPage,
});

function BookPage() {
  const { bookings } = useLabStore();
  const navigate = useNavigate();
  const onlineMachines = MACHINES.filter((m) => m.status === "online");

  const [machineId, setMachineId] = useState<string | null>(null);
  const [dayOffset, setDayOffset] = useState(0);
  const [duration, setDuration] = useState<2 | 4>(2);
  const [slotIdx, setSlotIdx] = useState<number | null>(null);
  const [purpose, setPurpose] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const day = useMemo(
    () => addDays(startOfDay(new Date()), dayOffset),
    [dayOffset],
  );

  const slots = useMemo(
    () => getFlexibleSlots(day, duration),
    [day, duration],
  );

  const availableSlots = useMemo(() => {
    if (!machineId) return slots.map((s) => ({ ...s, available: false }));
    return slots.map((s) => ({
      ...s,
      available:
        !isBefore(s.end, new Date()) &&
        isSlotAvailable(machineId, s.start.toISOString(), s.end.toISOString()),
    }));
  }, [machineId, slots]);

  function handleSubmit() {
    if (!machineId || slotIdx === null) {
      toast.error("Select a machine and time slot");
      return;
    }
    const slot = availableSlots[slotIdx];
    if (!slot?.available) {
      toast.error("That slot is no longer available");
      return;
    }
    setSubmitting(true);
    const result = createBooking({
      machineId,
      purpose,
      start: slot.start.toISOString(),
      end: slot.end.toISOString(),
    });
    setSubmitting(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(
      result.booking.status === "approved"
        ? "Booking confirmed"
        : "Request submitted — awaiting approval",
    );
    void navigate({ to: "/bookings" });
  }

  return (
    <div className="space-y-8 pb-24 md:pb-0">
      <PageHeader
        title="Book a lab slot"
        description="Pick a machine, duration, and open window. Conflicts are blocked automatically."
      />

      {/* Step 1 */}
      <section className="space-y-4">
        <StepLabel n={1}>Select machine</StepLabel>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {onlineMachines.map((m) => (
            <MachineCard
              key={m.id}
              machine={m}
              compact
              selected={machineId === m.id}
              onSelect={() => {
                setMachineId(m.id);
                setSlotIdx(null);
              }}
            />
          ))}
        </div>

        {machineId && (
          <Card className="border-dashed">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Today’s occupancy ·{" "}
                {MACHINES.find((m) => m.id === machineId)?.name}
              </CardTitle>
              <CardDescription className="text-xs">
                Blue = approved · Amber = pending
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OccupancyBar
                machineId={machineId}
                day={day}
                bookings={bookings}
              />
            </CardContent>
          </Card>
        )}
      </section>

      {/* Step 2 */}
      <section className="space-y-4">
        <StepLabel n={2}>Day, duration & time</StepLabel>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-2">
            {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
              const d = addDays(startOfDay(new Date()), offset);
              return (
                <Button
                  key={offset}
                  variant={dayOffset === offset ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setDayOffset(offset);
                    setSlotIdx(null);
                  }}
                >
                  {offset === 0
                    ? "Today"
                    : offset === 1
                      ? "Tomorrow"
                      : format(d, "EEE d")}
                </Button>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5 rounded-lg border p-1">
            <Clock className="ml-1.5 size-3.5 text-muted-foreground" />
            {([2, 4] as const).map((h) => (
              <Button
                key={h}
                size="sm"
                variant={duration === h ? "secondary" : "ghost"}
                className="h-7 px-2.5"
                onClick={() => {
                  setDuration(h);
                  setSlotIdx(null);
                }}
              >
                {h}h
              </Button>
            ))}
          </div>
        </div>

        {!machineId ? (
          <p className="text-sm text-muted-foreground">
            Select a machine to see available slots.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {availableSlots.map((s, i) => (
              <button
                key={s.label}
                type="button"
                disabled={!s.available}
                onClick={() => setSlotIdx(i)}
                className={cn(
                  "rounded-lg border px-3 py-3 text-sm font-medium transition-all",
                  !s.available && "cursor-not-allowed opacity-40 line-through",
                  s.available &&
                    slotIdx !== i &&
                    "hover:border-primary/50 hover:bg-muted",
                  slotIdx === i &&
                    "border-primary bg-primary text-primary-foreground shadow-sm",
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Step 3 */}
      <section className="space-y-4">
        <StepLabel n={3}>Purpose</StepLabel>
        <Card className="max-w-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">What will you run?</CardTitle>
            <CardDescription>
              Helps prioritisation · minimum 8 characters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="purpose">Description</Label>
              <Textarea
                id="purpose"
                placeholder="e.g. Fine-tune Llama-3 8B on custom dataset for thesis chapter 4"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                {purpose.trim().length}/8 minimum
              </p>
            </div>
            <Button
              size="lg"
              className="w-full gap-2 sm:w-auto"
              disabled={
                !machineId ||
                slotIdx === null ||
                purpose.trim().length < 8 ||
                submitting
              }
              onClick={handleSubmit}
            >
              {submitting ? (
                "Submitting…"
              ) : (
                <>
                  <CalendarPlus className="size-4" />
                  Submit booking request
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </section>

      {machineId && slotIdx !== null && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:static md:border-0 md:bg-transparent md:backdrop-blur-none">
          <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
            <Check className="size-4 shrink-0 text-emerald-500" />
            <span className="text-sm">
              <strong>
                {MACHINES.find((m) => m.id === machineId)?.name}
              </strong>
              {" · "}
              {availableSlots[slotIdx]?.label} on {format(day, "MMM d")} ({duration}h)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function StepLabel({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
      <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
        {n}
      </span>
      {children}
    </h2>
  );
}
