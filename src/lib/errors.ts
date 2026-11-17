/** Error de una llamada a Supabase con su código y estado HTTP, para poder distinguir "sin permiso" de "sin conexión". */
export class ApiError extends Error {
  readonly code?: string
  readonly status?: number
  constructor(message: string, code?: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
  }
}

/** No hay (o no se pudo crear) una sesión válida en este navegador. */
export class SessionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SessionError'
  }
}

/** 401/403, código 42501 ("permission denied") o JWT inválido: la llamada salió sin una sesión válida. */
export function isAuthError(e: unknown): boolean {
  if (e instanceof SessionError) return true
  if (e instanceof ApiError) {
    return e.status === 401 || e.status === 403 || e.code === '42501' || /permission denied|JWT/i.test(e.message)
  }
  return false
}

/** El navegador no pudo hablar con el servidor (sin red, bloqueado, tiempo agotado). */
export function isNetworkError(e: unknown): boolean {
  if (e instanceof ApiError || e instanceof SessionError) return false
  const msg = e instanceof Error ? e.message : String(e)
  return e instanceof TypeError || /failed to fetch|networkerror|load failed|network request failed/i.test(msg)
}

/** Mensaje para quien vota cuando el voto no se pudo enviar. Cada causa dice lo que de verdad pasó. */
export function voteErrorMessage(e: unknown): string {
  if (isAuthError(e)) {
    return 'No pudimos verificar tu sesión en este navegador, así que tu voto no se envió. Recarga la página e inténtalo de nuevo. Si navegas en modo privado o bloqueas las cookies y el almacenamiento, desactívalo para esta página.'
  }
  if (isNetworkError(e)) {
    return 'No se pudo enviar tu voto. Revisa tu conexión e inténtalo otra vez.'
  }
  return 'No se pudo registrar tu voto. Inténtalo otra vez en unos segundos.'
}
