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

## Deploy Daily Orbit (Vercel)

This repository has:
- `frontend` (Next.js) → deploy on Vercel
- `backend` (Express + Prisma + cron reminders) → deploy on a long-running backend host (Render/Railway/Fly/VM)

### 1) Deploy backend first

Required backend environment variables (from `backend/.env.example`):
- `DATABASE_URL`
- `JWT_SECRET`
- `FRONTEND_URL` (set to your Vercel frontend URL, for CORS)
- `APP_BASE_URL` (same Vercel URL, used in reminder email dashboard links)
- `CORS_ALLOW_VERCEL_PREVIEWS=true` (optional, allows all `*.vercel.app` preview URLs)
- reminder and Gmail keys if reminders are enabled

Run Prisma migrations in production using:

```bash
npx prisma migrate deploy
```

### 2) Deploy frontend on Vercel

When creating/importing the Vercel project:
- Framework preset: Next.js
- Root Directory: `frontend`

Set Vercel environment variables:
- `NEXT_PUBLIC_API_URL=https://<your-backend-domain>/api`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID=<your_google_client_id>`

### 3) Post-deploy checks

1. Open frontend and register/login.
2. Confirm browser requests hit your backend domain (not localhost).
3. Verify backend health endpoint responds:

```bash
curl https://<your-backend-domain>/api/health
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
