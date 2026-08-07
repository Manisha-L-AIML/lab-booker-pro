# Lab Booker Pro

**Elite AI/ML Lab Slot Booking System**

Fair, transparent, zero-WhatsApp coordination for department GPU & compute resources.

Students and faculty book lab machines and GPU time with live availability, conflict-free scheduling, and lab-in-charge approval workflows.

## Features

- **Live availability** — see free machines and open slots instantly
- **Conflict-free booking** — impossible to double-book a machine
- **Role-based access** — Student, Faculty, Lab In-Charge
- **Approval workflow** — lab-in-charge can approve, reject, or cancel
- **Machine inventory** — GPU models, VRAM, CPU, status at a glance
- **Dashboard analytics** — utilization, pending requests, your upcoming slots
- **Dark mode** — full theme support
- **Local persistence** — bookings survive refresh (demo mode)

## Tech Stack

- **TanStack Start** (React + TypeScript)
- **TanStack Router** + **React Query**
- **Tailwind CSS v4** + **shadcn/ui**
- **date-fns** + **Zod** + **React Hook Form**
- **Vite** + **Nitro**

## Quick Start

```bash
git clone https://github.com/Manisha-L-AIML/lab-booker-pro.git
cd lab-booker-pro
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Demo Roles

Use the role switcher in the header:

| Role            | Capabilities                                      |
| --------------- | ------------------------------------------------- |
| Student         | Book slots, view own bookings, cancel own requests |
| Faculty         | Same as student + higher priority context          |
| Lab In-Charge   | Approve / reject / cancel any booking, full view   |

## Project Structure

```
src/
├─ components/     # UI + domain components
├─ data/           # Mock machines + seed data
├─ lib/            # Utils, store, types
├─ routes/         # File-based routes
└─ styles.css      # Design tokens
```

## Scripts

| Command         | Description              |
| --------------- | ------------------------ |
| `npm run dev`   | Start development server |
| `npm run build` | Production build         |
| `npm run preview` | Preview production build |
| `npm run lint`  | ESLint                   |
| `npm run format`| Prettier                 |

## License

MIT
