import { Link, useRouterState } from "@tanstack/react-router";
import {
  CalendarPlus,
  ClipboardList,
  LayoutDashboard,
  Moon,
  Server,
  Shield,
  Sun,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { setRole } from "@/lib/store";
import { useLabStore } from "@/hooks/use-lab-store";
import type { UserRole } from "@/lib/types";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/book", label: "Book Slot", icon: CalendarPlus },
  { to: "/bookings", label: "My Bookings", icon: ClipboardList },
  { to: "/machines", label: "Machines", icon: Server },
  { to: "/admin", label: "Admin", icon: Shield, adminOnly: true },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { currentRole, user } = useLabStore();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("lab-booker-theme", next ? "dark" : "light");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className="flex items-center gap-2.5 font-semibold tracking-tight"
            >
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Server className="size-4" />
              </div>
              <span className="hidden sm:inline">Lab Booker Pro</span>
            </Link>

            <nav className="hidden items-center gap-1 md:flex">
              {nav.map((item) => {
                if (
                  "adminOnly" in item &&
                  item.adminOnly &&
                  user.role !== "admin"
                )
                  return null;
                const active =
                  item.to === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <item.icon className="size-3.5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <User className="size-3.5" />
                  <span className="hidden max-w-[120px] truncate sm:inline">
                    {user.name}
                  </span>
                  <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-secondary-foreground">
                    {user.role === "admin" ? "admin" : user.role}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="font-medium">{user.name}</div>
                  <div className="text-xs font-normal text-muted-foreground">
                    {user.email}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Switch demo role
                </DropdownMenuLabel>
                {(["student", "faculty", "admin"] as UserRole[]).map((role) => (
                  <DropdownMenuItem
                    key={role}
                    onClick={() => setRole(role)}
                    className={cn(
                      "capitalize",
                      currentRole === role && "bg-accent",
                    )}
                  >
                    {role === "admin" ? "Lab In-Charge" : role}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto border-t px-4 py-2 md:hidden">
          {nav.map((item) => {
            if ("adminOnly" in item && item.adminOnly && user.role !== "admin")
              return null;
            const active =
              item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground",
                )}
              >
                <item.icon className="size-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
