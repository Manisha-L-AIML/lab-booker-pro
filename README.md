# Lab Booker Pro

**Elite AI/ML Lab Slot Booking System**

Fair, transparent, zero-WhatsApp coordination for department GPU & compute resources.

## Features

- **Live occupancy timelines** — see who’s on each machine, hour by hour
- **Conflict-free booking** — impossible to double-book
- **2h / 4h durations** — flexible slot lengths
- **Role-based access** — Student, Faculty, Lab In-Charge
- **Approval workflow** — approve, reject, cancel with confirmations
- **Fleet utilization** — dashboard + per-machine load bars
- **Search & filters** — machines by status/GPU/tag; bookings by status
- **Dark mode** — flash-free theme switching
- **Demo persistence** — localStorage with reset

## Quick Start

```bash
git clone https://github.com/Manisha-L-AIML/lab-booker-pro.git
cd lab-booker-pro
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Demo roles

Use the profile menu (top right):

| Role | Capabilities |
| --- | --- |
| Student | Book, view own, cancel own |
| Faculty | Same as student |
| Lab In-Charge | Approve / reject / cancel any + reset demo data |

## Stack

TanStack Start · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui · date-fns · Zod

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview build |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

## License

MIT
