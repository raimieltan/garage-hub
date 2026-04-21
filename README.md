# garage-hub

Social platform for car enthusiasts — builds, meets, clubs, marketplace, DMs.

## Stack

- **Next.js 16** (App Router) with React 19
- **Prisma 7** ORM against PostgreSQL (`@prisma/adapter-pg`)
- JWT auth — `bcryptjs`, `jsonwebtoken`, httpOnly cookies
- shadcn/ui + Base UI + Tailwind 4
- `react-dropzone` for uploads, `react-markdown` + `remark-gfm` for post bodies

## Domain model

17 Prisma models covering five product surfaces:

- **Profiles & graph** — `User`, `Follow`
- **Cars & mods** — `Car`, `BuildUpdate`, `CarMod`
- **Social feed** — `Post` (general / build update / dyno result / photo), `Comment`, `Like`
- **Events & clubs** — `Event`, `RSVP`, `CarClub`, `ClubMembership`, `ClubPost`
- **Marketplace & DMs** — `MarketplaceListing`, `Conversation`, `Message`, `Notification`

Seed script (`prisma/seed.ts`) includes realistic demo data across every model.

## API surface

REST route handlers in `src/app/api/`, grouped by resource:

```
auth  cars  clubs  conversations  events  marketplace
notifications  posts  search  upload  users
```

## Local dev

```bash
# .env
DATABASE_URL=postgresql://user:pass@localhost:5432/garage_hub
JWT_SECRET=change-me

npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```
