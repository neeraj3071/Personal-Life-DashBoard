const base = 'https://personal-life-dashboard.onrender.com/api'
const adminKey = process.env.REMINDER_ADMIN_KEY || ''
const email = `remprobe${Date.now()}@example.com`
const password = 'Demo@123'

async function request(method, path, { token, headers = {}, body, timeoutMs = 20000 } = {}) {
  const url = `${base}${path}`
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  const requestHeaders = {
    'Content-Type': 'application/json',
    ...headers
  }
  if (token) requestHeaders.Authorization = `Bearer ${token}`

  try {
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal
    })

    const text = await response.text()
    let parsed = text
    try {
      parsed = JSON.parse(text)
    } catch {}

    return { ok: true, status: response.status, body: parsed }
  } catch (error) {
    return {
      ok: false,
      status: 0,
      body: { error: error instanceof Error ? error.message : String(error) }
    }
  } finally {
    clearTimeout(timeout)
  }
}

;(async () => {
  const register = await request('POST', '/auth/register', {
    body: { name: 'Reminder Probe', email, password },
    timeoutMs: 20000
  })

  const login = await request('POST', '/auth/login', {
    body: { email, password },
    timeoutMs: 20000
  })

  const token = login.body?.data?.token

  const status = token
    ? await request('GET', '/reminders/status', { token, timeoutMs: 15000 })
    : { ok: false, status: 0, body: { error: 'Token missing after login' } }

  const testReminder = token
    ? await request('POST', '/reminders/test?topic=habits', { token, timeoutMs: 25000 })
    : { ok: false, status: 0, body: { error: 'Token missing after login' } }

  const sendNowNoKey = await request('POST', '/reminders/send-now?topic=habits', {
    timeoutMs: 15000
  })

  const sendNowWithKey = adminKey
    ? await request('POST', '/reminders/send-now?topic=habits', {
        headers: { 'x-reminder-admin-key': adminKey },
        timeoutMs: 25000
      })
    : { ok: false, status: 0, body: { error: 'REMINDER_ADMIN_KEY missing for probe' } }

  const result = {
    register: { status: register.status },
    login: { status: login.status },
    remindersStatus: { status: status.status, body: status.body },
    remindersTest: { status: testReminder.status, body: testReminder.body },
    sendNowNoKey: { status: sendNowNoKey.status, body: sendNowNoKey.body },
    sendNowWithKey: { status: sendNowWithKey.status, body: sendNowWithKey.body }
  }

  console.log(JSON.stringify(result, null, 2))
})()
