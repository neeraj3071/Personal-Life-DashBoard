# Life Dashboard 📊

> Treat your life like a dataset and optimize it.

A personal analytics platform that aggregates and visualizes key aspects of your daily life in a single interface. Track sleep, workouts, finances, habits, and mood - all in one screen.

## 🎯 Features

- **Unified Dashboard**: See all your life metrics at a glance
- **Sleep Tracking**: Monitor sleep patterns, duration, and quality
- **Workout Tracking**: Log exercises, track consistency and streaks
- **Habit Tracker**: Build and maintain positive habits with streak tracking
- **Mood Tracking**: Daily emotional state logging with trend analysis
- **Financial Tracking**: Track income, expenses, and spending categories
- **Insights Engine**: Automatic insights and correlations (e.g., "You sleep better on workout days")

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **UI Components**: ShadCN UI
- **Charts**: Recharts
- **State Management**: React Context / Zustand

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Cache**: Redis
- **Authentication**: JWT + OAuth (Google)

### DevOps
- **Containerization**: Docker
- **CI/CD**: GitHub Actions
- **Frontend Hosting**: Vercel
- **Backend Hosting**: AWS EC2 / ECS
- **Database**: AWS RDS (PostgreSQL)
- **Monitoring**: Prometheus, Grafana, Sentry

## 📁 Project Structure

```
life-dashboard/
├── frontend/          # Next.js frontend application
│   ├── src/
│   │   ├── app/      # App router pages
│   │   ├── components/# React components
│   │   ├── lib/      # Utilities and configs
│   │   └── types/    # TypeScript types
│   └── public/       # Static assets
│
├── backend/          # Express backend API
│   ├── src/
│   │   ├── controllers/# Route controllers
│   │   ├── services/ # Business logic
│   │   ├── models/   # Database models
│   │   ├── middleware/# Express middleware
│   │   ├── routes/   # API routes
│   │   └── utils/    # Utilities
│   └── prisma/       # Database schema
│
└── docs/             # Documentation
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL (v14+)
- Redis (optional for caching)
- npm or yarn

### Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd life-dashboard
```

2. **Set up Frontend**
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

3. **Set up Backend**
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

4. **Set up Database**
```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

## 🔧 Development

### Frontend (http://localhost:3000)
```bash
cd frontend
npm run dev      # Start development server
npm run build    # Build for production
npm run lint     # Run ESLint
```

### Backend (http://localhost:5000)
```bash
cd backend
npm run dev      # Start development server with hot reload
npm run build    # Build TypeScript
npm run start    # Start production server
npm run test     # Run tests
```

## 📊 Database Schema

Main entities:
- **Users**: User accounts and profiles
- **Habits**: User-defined habits to track
- **HabitLogs**: Daily habit completion records
- **SleepLogs**: Sleep tracking data
- **WorkoutLogs**: Workout and exercise logs
- **MoodLogs**: Daily mood entries
- **Expenses**: Financial transaction records

## 🔐 Environment Variables

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

### Backend (.env)
```env
DATABASE_URL=postgresql://user:password@localhost:5432/lifedashboard
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
PORT=5000
NODE_ENV=development
```

## 📈 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/google` - Google OAuth login

### Habits
- `GET /api/habits` - Get all habits
- `POST /api/habits` - Create new habit
- `POST /api/habits/log` - Log habit completion

### Sleep
- `GET /api/sleep` - Get sleep logs
- `POST /api/sleep` - Create sleep log

### Workouts
- `GET /api/workouts` - Get workout logs
- `POST /api/workouts` - Create workout log

### Mood
- `GET /api/mood` - Get mood logs
- `POST /api/mood` - Create mood log

### Finance
- `GET /api/expenses` - Get expenses
- `POST /api/expenses` - Create expense

## 🎨 UI Components

Built with ShadCN UI:
- Dashboard widgets with cards
- Interactive charts (line, bar, pie, heatmap)
- Forms with validation
- Data tables
- Date pickers
- Toast notifications

## 📝 Roadmap

### Phase 1 - MVP (Current)
- ✅ Project setup
- ⏳ Authentication system
- ⏳ Core tracking features
- ⏳ Basic dashboard
- ⏳ Simple analytics

### Phase 2 - Enhanced Features
- Apple Health integration
- Google Fit integration
- Advanced analytics with ML
- Weekly/Monthly reports
- Data export

### Phase 3 - Mobile & AI
- Mobile app (React Native)
- AI-powered insights
- Calendar sync
- Daily AI journal summary
- Habit recommendations

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License

## 👤 Author

Neeraj Saini

---

**Remember**: Your life is your most important project. Track it, analyze it, optimize it. 🚀
