const base = 'https://personal-life-dashboard.onrender.com/api'
const email = `remindersweep${Date.now()}@example.com`
const password = 'Demo@123'
const adminKey = process.env.REMINDER_ADMIN_KEY

const results = []

function addResult(name, response, allowedStatuses = [200]) {
  const ok = allowedStatuses.includes(response.status)
  results.push({ name, status: response.status, ok, body: response.body })
  return ok
}

async function request(method, path, { token, headers = {}, body, query } = {}) {
  const url = new URL(`${base}${path}`)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value))
      }
    }
  }

  const requestHeaders = {
    'Content-Type': 'application/json',
    ...headers
  }

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`
  }

  try {
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
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

function printSummary() {
  console.log('\n=== REMINDER ENDPOINT SWEEP RESULTS ===')
  for (const item of results) {
    console.log(`${item.ok ? '✅' : '❌'} ${item.name} -> ${item.status}`)
    if (!item.ok) {
      const preview = typeof item.body === 'string' ? item.body : JSON.stringify(item.body)
      console.log(`   ${preview?.slice(0, 240)}`)
    }
  }

  const passed = results.filter((item) => item.ok).length
  const failed = results.length - passed
  console.log(`\nPassed: ${passed}`)
  console.log(`Failed: ${failed}`)
}

async function run() {
  const registerRes = await request('POST', '/auth/register', {
    body: { name: 'Reminder Sweep User', email, password }
  })
  addResult('POST /auth/register', registerRes, [200, 201])

  const loginRes = await request('POST', '/auth/login', {
    body: { email, password }
  })
  addResult('POST /auth/login', loginRes, [200])

  const token = loginRes.body?.data?.token
  if (!token) {
    console.log('❌ Token missing. Cannot continue reminder sweep.')
    printSummary()
    process.exit(1)
  }

  const statusRes = await request('GET', '/reminders/status', {
    token
  })
  addResult('GET /reminders/status', statusRes, [200])

  const testReminderRes = await request('POST', '/reminders/test', {
    token,
    query: { topic: 'habits' }
  })
  addResult('POST /reminders/test?topic=habits', testReminderRes, [200])

  const sendNowUnauthorized = await request('POST', '/reminders/send-now', {
    query: { topic: 'habits' }
  })
  addResult('POST /reminders/send-now (no admin key)', sendNowUnauthorized, [403])

  if (!adminKey) {
    results.push({
      name: 'POST /reminders/send-now (with admin key)',
      status: 0,
      ok: false,
      body: { error: 'REMINDER_ADMIN_KEY is not set in process env for test run' }
    })
    printSummary()
    process.exit(1)
  }

  const sendNowAuthorized = await request('POST', '/reminders/send-now', {
    headers: { 'x-reminder-admin-key': adminKey },
    query: { topic: 'habits' }
  })
  addResult('POST /reminders/send-now (with admin key)', sendNowAuthorized, [200])

  printSummary()

  const failed = results.filter((item) => !item.ok)
  process.exit(failed.length > 0 ? 1 : 0)
}

run()
