import { createClient } from '@supabase/supabase-js'
import { resilientStorage } from './safeStorage'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

if (!url || !publishableKey) {
  throw new Error(
    'Faltan VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY. Copia .env.example a .env y llénalo.',
  )
}

/**
 * Cliente único. Sin `global.headers`: no se fija ninguna cabecera Authorization, así cada llamada lleva el JWT de la
 * sesión (si no hay sesión, supabase-js usa la clave publicable y Postgres responde como rol `anon`).
 * La sesión se guarda con `resilientStorage` (localStorage + copia en memoria) para que no se pierda en Safari.
 */
export const supabase = createClient(url, publishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false, // la app no usa enlaces mágicos ni OAuth
    storage: resilientStorage,
  },
})
