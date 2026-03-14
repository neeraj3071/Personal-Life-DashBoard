# Daily Orbit — Personal Performance Cockpit

> A full-stack personal analytics dashboard to track sleep, workouts, habits, mood, and spending in one immersive view — with AI-powered insights, daily life scoring, and automated email reminders.

**Live App → [daily-orbit-six.vercel.app](https://daily-orbit-six.vercel.app)**  
**API → [personal-life-dashboard.onrender.com](https://personal-life-dashboard.onrender.com/api/health)**

---

## Features

- **Life Score Engine** — Weighted daily score (0–100) across sleep, workout, habits, mood, and spending discipline — with a letter grade (A+→F). Shows a clean no-data state for new users.
- **Sleep Tracking** — Log hours and quality; weekly averages and trend charts.
- **Workout Tracking** — Minutes per session; weekly session count and productivity score.
- **Habit Engine** — Create habits, mark daily completions, track streaks and weekly completion rate.
- **Mood Mapping** — 1–5 daily mood log with emoji scale and weekly averages.
- **Finance Tracker** — Daily/weekly expense logging by category with spending discipline score.
- **Dashboard Analytics** — Stats, insights, performance, forecast, timeline, and missions — all computed server-side.
- **AI Forecast (Gemini)** — Tomorrow readiness score and narrative powered by Google Gemini 2.0 Flash with a rules-based fallback.
- **Automated Reminders** — Scheduled Gmail email reminders via node-cron (configurable cron list, topics, and timezone).
- **JWT Authentication** — Secure register/login with bcrypt password hashing and 7-day tokens.
- **CORS** — Multi-origin support with Vercel preview URL allowlist.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v4 |
| UI Components | Radix UI, shadcn/ui, Recharts, Lucide Icons |
| Backend | Express 5, TypeScript, Node.js |
| ORM / DB | Prisma 6, PostgreSQL |
| Auth | JWT (jsonwebtoken), bcryptjs |
| AI | Google Gemini 2.0 Flash (with rules-based fallback) |
| Email | Nodemailer (Gmail SMTP, port 587, IPv4) |
| Scheduler | node-cron |
| Validation | Zod |
| Frontend Deploy | Vercel |
| Backend Deploy | Render |

---

## Project Structure

```
.
├── frontend/          # Next.js app (Vercel)
│   └── src/
│       ├── app/       # Route pages: dashboard, habits, sleep, workout, mood, finance, auth
│       ├── components/
│       ├── contexts/  # AuthContext (JWT state)
│       └── lib/       # API constants, utilities
│
└── backend/           # Express API (Render)
    └── src/
        ├── controllers/
        ├── routes/
        ├── services/  # Business logic: auth, habits, sleep, workout, mood, expense, dashboard, email, reminders, prediction
        ├── schedulers/ # node-cron reminder scheduler
        ├── middleware/ # Error handler, auth guard
        └── index.ts   # Express app entry
```

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | — | Health check |
| POST | `/api/auth/register` | — | Create account |
| POST | `/api/auth/login` | — | Login, returns JWT |
| GET | `/api/habits` | ✓ | List habits |
| POST | `/api/habits` | ✓ | Create habit |
| POST | `/api/habits/:id/log` | ✓ | Log habit completion |
| GET | `/api/sleep` | ✓ | Sleep logs |
| POST | `/api/sleep` | ✓ | Add sleep log |
| GET | `/api/workouts` | ✓ | Workout logs |
| POST | `/api/workouts` | ✓ | Add workout |
| GET | `/api/mood` | ✓ | Mood logs |
| POST | `/api/mood` | ✓ | Add mood entry |
| GET | `/api/expenses` | ✓ | Expense logs |
| POST | `/api/expenses` | ✓ | Add expense |
| GET | `/api/dashboard/stats` | ✓ | Weekly summary stats |
| GET | `/api/dashboard/insights` | ✓ | AI correlation insights |
| GET | `/api/dashboard/performance` | ✓ | Life score + missions + forecast |
| GET | `/api/dashboard/settings` | ✓ | Goal targets |
| PUT | `/api/dashboard/settings` | ✓ | Update goal targets |
| GET | `/api/dashboard/timeline` | ✓ | Activity timeline events |
| GET | `/api/reminders/status` | ✓ | Reminder scheduler status |
| POST | `/api/reminders/test` | ✓ | Send test reminder email |

---

## Local Development

### Prerequisites

- Node.js 18+
- PostgreSQL running locally
- (Optional) Google Gemini API key for AI insights
- (Optional) Gmail App Password for email reminders

### 1. Clone

```bash
git clone https://github.com/neeraj3071/Personal-Life-DashBoard.git
cd Personal-Life-DashBoard
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your DATABASE_URL, JWT_SECRET, etc.

npm install
npx prisma migrate dev
npm run dev
# → http://localhost:3001
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:3001/api

npm install
npm run dev
# → http://localhost:3000
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✓ | PostgreSQL connection string |
| `JWT_SECRET` | ✓ | Secret for signing JWT tokens |
| `PORT` | — | Server port (default `3001`) |
| `FRONTEND_URL` | — | Comma-separated allowed CORS origins |
| `CORS_ALLOW_VERCEL_PREVIEWS` | — | `true` to allow `*.vercel.app` |
| `APP_BASE_URL` | — | Frontend URL used in reminder email links |
| `GEMINI_API_KEY` | — | Google Gemini API key for AI insights |
| `GEMINI_MODEL` | — | Model name (default `gemini-2.0-flash`) |
| `EMAIL_PROVIDER` | — | `resend` or `smtp` (auto mode defaults to `resend` if key exists) |
| `EMAIL_FROM` | — | Optional global sender address (`Name <email@domain>`) |
| `RESEND_API_KEY` | — | Resend API key (recommended for Render/production) |
| `RESEND_FROM` | — | Sender address for Resend |
| `GMAIL_USER` | — | Gmail address for SMTP fallback |
| `GMAIL_APP_PASSWORD` | — | Gmail App Password for SMTP fallback |
| `GMAIL_FROM` | — | Sender address when using Gmail SMTP |
| `REMINDER_ENABLED` | — | `true` to activate the cron scheduler |
| `REMINDER_CRON_LIST` | — | Semicolon-separated cron expressions |
| `REMINDER_TOPICS` | — | Comma-separated topic rotation list |
| `REMINDER_TIMEZONE` | — | Timezone for cron (e.g. `Asia/Kolkata`) |
| `REMINDER_ADMIN_KEY` | — | Secret key for the manual send-now endpoint |

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | ✓ (prod) | Full API base URL including `/api` |

---

## Deployment

### Backend → Render

1. Create a new **Web Service** on Render, connect your GitHub repo.
2. Set **Root Directory** to `backend`.
3. Set **Build Command**: `npm install && npm run build && npx prisma generate`
4. Set **Start Command**: `node dist/index.js`
5. Add all environment variables from the table above.
    - For reliable reminder delivery on Render, prefer `EMAIL_PROVIDER=resend` with `RESEND_API_KEY` + `RESEND_FROM`.
6. Run migrations once from your local machine:
   ```bash
   DATABASE_URL="<render-external-db-url>?sslmode=require" npx prisma migrate deploy
   ```

### Frontend → Vercel

1. Import the GitHub repo on Vercel.
2. Set **Root Directory** to `frontend`.
3. Set **Framework Preset** to `Next.js`.
4. Add environment variable: `NEXT_PUBLIC_API_URL=https://<your-render-service>.onrender.com/api`
5. Deploy.

---

## Database Schema

8 tables managed by Prisma migrations:

- `users` — Auth accounts
- `analytics_settings` — Per-user goal targets
- `habits` — Habit definitions
- `habit_logs` — Daily habit completion records
- `sleep_logs` — Nightly sleep entries
- `workout_logs` — Workout sessions
- `mood_logs` — Daily mood entries
- `expenses` — Expense records

---

## License

MIT © 2026 Neeraj Saini
