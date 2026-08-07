# Routes

TanStack Start uses **file-based routing**. Every `.tsx` file in this directory defines a route.

| File | URL |
| --- | --- |
| `index.tsx` | `/` |
| `book.tsx` | `/book` |
| `bookings.tsx` | `/bookings` |
| `machines.tsx` | `/machines` |
| `admin.tsx` | `/admin` |
| `__root.tsx` | App shell |

`routeTree.gen.ts` is auto-generated on dev/build. Don't edit it by hand unless regenerating is unavailable.
