/**
 * Almacenamiento de la sesión de Supabase que NO se rinde cuando el navegador falla.
 *
 * Por qué existe: supabase-js, si `getSession()` no encuentra sesión (la clave desapareció de localStorage o el acceso
 * lanzó un error), llama a la API con la clave publicable, es decir, como rol `anon`, sin avisar. En un iPhone con Safari
 * eso mostró "permission denied for function cast_vote" (401, 42501) justo después de crear la sesión anónima.
 *
 * Cómo funciona: la sesión también vive en memoria. Se escribe en las dos partes; se lee primero localStorage (para
 * compartir la sesión entre pestañas) y, si falla o no está, se usa la copia en memoria. Nunca lanza errores.
 */
const memory = new Map<string, string>()

function local(): Storage | null {
  try {
    return window.localStorage
  } catch {
    return null // Safari con el almacenamiento bloqueado lanza SecurityError al ni siquiera tocar window.localStorage
  }
}

export const resilientStorage = {
  getItem(key: string): string | null {
    try {
      const value = local()?.getItem(key) ?? null
      if (value !== null) {
        memory.set(key, value)
        return value
      }
    } catch {
      /* se usa la copia en memoria */
    }
    return memory.get(key) ?? null
  },
  setItem(key: string, value: string): void {
    memory.set(key, value)
    try {
      local()?.setItem(key, value)
    } catch {
      /* cuota llena o almacenamiento bloqueado: la sesión sigue viva en memoria */
    }
  },
  removeItem(key: string): void {
    memory.delete(key)
    try {
      local()?.removeItem(key)
    } catch {
      /* nada que quitar */
    }
  },
}
