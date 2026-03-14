const base = 'https://personal-life-dashboard.onrender.com/api'
const email = `sweep${Date.now()}@example.com`
const password = 'Demo@123'
const today = new Date().toISOString().slice(0, 10)

const results = []

function pushResult(name, response, allowedStatuses = [200, 201]) {
  const ok = allowedStatuses.includes(response.status)
  results.push({ name, status: response.status, ok, body: response.body })
  return ok
}

async function request(method, path, { token, body, query } = {}) {
  const url = new URL(`${base}${path}`)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value))
      }
    }
  }

  const headers = { 'Content-Type': 'application/json' }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    })

    const text = await response.text()
    let parsed = text
    try {
      parsed = JSON.parse(text)
    } catch {}

    return { status: response.status, body: parsed }
  } catch (error) {
    return { status: 0, body: { error: error instanceof Error ? error.message : String(error) } }
  }
}

async function run() {
  const registerRes = await request('POST', '/auth/register', {
    body: { name: 'Sweep User', email, password }
  })
  pushResult('POST /auth/register', registerRes, [200, 201])

  const loginRes = await request('POST', '/auth/login', {
    body: { email, password }
  })
  pushResult('POST /auth/login', loginRes, [200])

  const token = loginRes.body?.data?.token
  if (!token) {
    console.log('❌ Token not returned, stopping sweep.')
    printSummary()
    process.exit(1)
  }

  const habitsGet = await request('GET', '/habits', { token })
  pushResult('GET /habits', habitsGet, [200])

  const habitCreate = await request('POST', '/habits', {
    token,
    body: { name: `Sweep Habit ${Date.now()}`, description: 'Endpoint sweep habit' }
  })
  pushResult('POST /habits', habitCreate, [200, 201])
  const habitId = habitCreate.body?.data?.id

  if (habitId) {
    const habitLog = await request('POST', '/habits/log', {
      token,
      body: { habitId, date: today, completed: true }
    })
    pushResult('POST /habits/log', habitLog, [200])

    const habitLogs = await request('GET', `/habits/${habitId}/logs`, { token })
    pushResult('GET /habits/:habitId/logs', habitLogs, [200])

    const habitDelete = await request('DELETE', `/habits/${habitId}`, { token })
    pushResult('DELETE /habits/:habitId', habitDelete, [200])
  } else {
    results.push({ name: 'POST /habits/log', status: 0, ok: false, body: { error: 'habitId missing' } })
    results.push({ name: 'GET /habits/:habitId/logs', status: 0, ok: false, body: { error: 'habitId missing' } })
    results.push({ name: 'DELETE /habits/:habitId', status: 0, ok: false, body: { error: 'habitId missing' } })
  }

  const sleepGet = await request('GET', '/sleep', { token })
  pushResult('GET /sleep', sleepGet, [200])

  const sleepCreate = await request('POST', '/sleep', {
    token,
    body: {
      sleepTime: `${today}T00:00:00.000Z`,
      wakeTime: `${today}T08:00:00.000Z`,
      quality: 4,
      date: today,
      notes: 'Endpoint sweep sleep log'
    }
  })
  pushResult('POST /sleep', sleepCreate, [200, 201])

  const workoutsGet = await request('GET', '/workouts', { token })
  pushResult('GET /workouts', workoutsGet, [200])

  const workoutCreate = await request('POST', '/workouts', {
    token,
    body: {
      type: 'Running',
      duration: 30,
      date: today,
      calories: 280,
      notes: 'Endpoint sweep workout'
    }
  })
  pushResult('POST /workouts', workoutCreate, [200, 201])

  const moodGet = await request('GET', '/mood', { token })
  pushResult('GET /mood', moodGet, [200])

  const moodCreate = await request('POST', '/mood', {
    token,
    body: {
      mood: 4,
      date: today,
      notes: 'Endpoint sweep mood log'
    }
  })
  pushResult('POST /mood', moodCreate, [200, 201])

  const expensesGet = await request('GET', '/expenses', { token })
  pushResult('GET /expenses', expensesGet, [200])

  const expenseCreate = await request('POST', '/expenses', {
    token,
    body: {
      amount: 12.5,
      category: 'Food',
      date: today,
      description: 'Endpoint sweep expense'
    }
  })
  pushResult('POST /expenses', expenseCreate, [200, 201])

  const categoryTotals = await request('GET', '/expenses/category-totals', { token })
  pushResult('GET /expenses/category-totals', categoryTotals, [200])

  const dashboardStats = await request('GET', '/dashboard/stats', { token })
  pushResult('GET /dashboard/stats', dashboardStats, [200])

  const dashboardInsights = await request('GET', '/dashboard/insights', { token })
  pushResult('GET /dashboard/insights', dashboardInsights, [200])

  const dashboardSettingsGet = await request('GET', '/dashboard/settings', { token })
  pushResult('GET /dashboard/settings', dashboardSettingsGet, [200])

  const dashboardSettingsPut = await request('PUT', '/dashboard/settings', {
    token,
    body: {
      sleepHours: 7,
      workoutSessions: 4,
      workoutMinutes: 45,
      weeklySpending: 250,
      habitCompletion: 80,
      mood: 4
    }
  })
  pushResult('PUT /dashboard/settings', dashboardSettingsPut, [200])

  const dashboardPerformance = await request('GET', '/dashboard/performance', { token })
  pushResult('GET /dashboard/performance', dashboardPerformance, [200])

  const dashboardTimeline = await request('GET', '/dashboard/timeline', {
    token,
    query: { range: 'week', date: today }
  })
  pushResult('GET /dashboard/timeline', dashboardTimeline, [200])

  printSummary()

  const failed = results.filter((item) => !item.ok)
  process.exit(failed.length > 0 ? 1 : 0)
}

function printSummary() {
  console.log('\n=== ENDPOINT SWEEP RESULTS ===')
  for (const item of results) {
    console.log(`${item.ok ? '✅' : '❌'} ${item.name} -> ${item.status}`)
    if (!item.ok) {
      const preview = typeof item.body === 'string' ? item.body : JSON.stringify(item.body)
      console.log(`   ${preview?.slice(0, 220)}`)
    }
  }

  const passed = results.filter((item) => item.ok).length
  const failed = results.length - passed
  console.log(`\nPassed: ${passed}`)
  console.log(`Failed: ${failed}`)
}

run()
