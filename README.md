This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Database setup (PostgreSQL + Prisma)

You need a PostgreSQL database and a `DATABASE_URL` in `.env`. For local development you can run a local Postgres instance (for example with a locally installed Postgres service), then use a connection string like:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/humperia?schema=public"
```

Initialize Prisma, run migrations, seed data, and start the app:

```bash
npm install
npx prisma generate
npm run db:migrate
npm run db:seed
npm run dev
```

Other useful commands:

```bash
npm run db:studio
```

## Test credentials

Seeded users for local/dev:

- ADMIN: `admin@humperia.app` / `Admin!ChangeMe123`
- TEAM_LEAD: `lead@humperia.app` / `Lead!ChangeMe123`
- WORKER: `worker1@humperia.app` / `Worker!ChangeMe123`
- WORKER: `worker2@humperia.app` / `Worker!ChangeMe123`

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
