// POST /api/auth/logout — удаляет сессию из БД и сбрасывает cookie.
export default defineEventHandler(async (event) => {
  const sessionId = getCookie(event, SESSION_COOKIE)
  if (sessionId) await destroySession(sessionId)
  deleteCookie(event, SESSION_COOKIE, { path: '/' })
  return { ok: true }
})
