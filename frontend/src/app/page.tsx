import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="flex flex-col items-center justify-center gap-8 text-center px-6 py-12 max-w-4xl">
        <div className="space-y-4">
          <h1 className="text-6xl font-bold text-gray-900">
            Life Dashboard 📊
          </h1>
          <p className="text-2xl text-gray-600 font-medium">
            Treat your life like a dataset and optimize it
          </p>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            A personal analytics platform that aggregates and visualizes key aspects of your daily life. 
            Track sleep, workouts, finances, habits, and mood - all in one screen.
          </p>
        </div>

        <div className="flex gap-4 flex-wrap justify-center">
          <Link
            href="/dashboard"
            className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
          >
            View Dashboard
          </Link>
          <Link
            href="/auth/login"
            className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-50 transition-colors shadow-lg border-2 border-blue-600"
          >
            Login
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-12 max-w-2xl">
          <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="text-4xl mb-2">😴</div>
            <div className="font-semibold">Sleep Tracking</div>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="text-4xl mb-2">💪</div>
            <div className="font-semibold">Workouts</div>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="text-4xl mb-2">✅</div>
            <div className="font-semibold">Habits</div>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="text-4xl mb-2">😊</div>
            <div className="font-semibold">Mood</div>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="text-4xl mb-2">💰</div>
            <div className="font-semibold">Finance</div>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="text-4xl mb-2">📈</div>
            <div className="font-semibold">Analytics</div>
          </div>
        </div>
      </main>
    </div>
  )
}
            Deploy Now
          </a>
          <a
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
        </div>
      </main>
    </div>
  );
}
