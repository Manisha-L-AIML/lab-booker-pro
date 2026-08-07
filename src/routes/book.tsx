import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { addDays, format, isBefore, startOfDay } from "date-fns";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarPlus, Check } from "lucide-react";
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
import { MACHINES } from "@/data/machines";
import { createBooking, getDaySlots, isSlotAvailable } from "@/lib/store";
import { useLabStore } from "@/hooks/use-lab-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/book")({
  component: BookPage,
});

function BookPage() {
  useLabStore(); // re-render when bookings change (availability)
  const navigate = useNavigate();
  const onlineMachines = MACHINES.filter((m) => m.status === "online");
  const [machineId, setMachineId] = useState<string | null>(null);
  const [dayOffset, setDayOffset] = useState(0);
  const [slotIdx, setSlotIdx] = useState<number | null>(null);
  const [purpose, setPurpose] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const day = useMemo(
    () => addDays(startOfDay(new Date()), dayOffset),
    [dayOffset],
  );
  const slots = useMemo(() => getDaySlots(day), [day]);

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
        : "Request submitted \u2014 awaiting approval",
    );
    void navigate({ to: "/bookings" });
  }

  return (
    <div className="space-y-8 pb-24 md:pb-0">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Book a lab slot
        </h1>
        <p className="mt-1 text-muted-foreground">
          Choose a machine, pick an open 2-hour window, and describe your work.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          1 \u00b7 Select machine
        </h2>
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
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          2 \u00b7 Choose day & time
        </h2>
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

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          3 \u00b7 Purpose
        </h2>
        <Card className="max-w-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">What will you run?</CardTitle>
            <CardDescription>
              Help the lab in-charge prioritise and plan capacity (min 8
              characters).
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
                "Submitting\u2026"
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
        <div className="fixed bottom-0 inset-x-0 z-30 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:static md:border-0 md:bg-transparent md:backdrop-blur-none">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-2 text-sm">
              <Check className="size-4 shrink-0 text-emerald-500" />
              <span>
                <strong>
                  {MACHINES.find((m) => m.id === machineId)?.name}
                </strong>
                {" \u00b7 "}
                {availableSlots[slotIdx]?.label} on {format(day, "MMM d")}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
