import { supabase } from './supabase'
import { SessionError } from './errors'

/**
 * Crea una sesión anónima y confirma con getSession() que quedó guardada. Si no queda, lanza SessionError:
 * es mejor avisar que dejar votar con una sesión que luego saldría como rol `anon` (401 / 42501).
 */
export async function createAnonymousSession(): Promise<void> {
  const { error } = await supabase.auth.signInAnonymously()
  if (error) throw new SessionError(`No se pudo iniciar la sesión anónima: ${error.message}`)
  const { data } = await supabase.auth.getSession()
  if (!data.session) throw new SessionError('La sesión anónima se creó, pero este navegador no la pudo conservar.')
}

/** Garantiza que haya sesión antes de una llamada que la exige: la reutiliza o, si no hay, crea una anónima y la confirma. */
export async function ensureSession(): Promise<void> {
  const { data } = await supabase.auth.getSession()
  if (data.session) return
  console.warn('[sesión] no había sesión al llamar a Supabase; se crea una anónima')
  await createAnonymousSession()
}
