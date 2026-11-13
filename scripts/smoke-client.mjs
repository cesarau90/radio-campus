// Prueba de humo del cliente contra Supabase real (usa .env).
//   npm run smoke
// Comprueba, como lo haría el navegador: sign-in anónimo, lectura pública bajo RLS, RPC,
// escritura bloqueada para anónimos y suscripción Realtime. No crea rondas ni modifica datos
// (solo queda un usuario anónimo nuevo en Auth, igual que cada visitante).
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  readFileSync('.env', 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.includes('=') && !l.startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
)
const url = env.VITE_SUPABASE_URL
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY
if (!url || !key) throw new Error('Falta VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY en .env')

const supabase = createClient(url, key, { auth: { persistSession: false } })
let failed = 0
const check = (name, ok, detail = '') => {
  if (!ok) failed++
  console.log(`${ok ? 'OK   ' : 'FALLA'} ${name}${detail ? ' — ' + detail : ''}`)
}

// 1. Sign-in anónimo (Auth > Sign In / Providers > Anonymous debe estar activado)
const { data: auth, error: authErr } = await supabase.auth.signInAnonymously()
check('sign-in anónimo', !authErr && auth?.user?.is_anonymous === true, authErr?.message ?? `uid ${auth?.user?.id}`)

// 2. Lecturas públicas bajo RLS
const { data: settings, error: sErr } = await supabase.from('settings').select('*').single()
check('lee settings', !sErr && settings?.id === 1, sErr?.message ?? `lat=${settings?.lat} lon=${settings?.lon} max_play_sec=${settings?.max_play_sec}`)
const { count: songs, error: songsErr } = await supabase.from('songs').select('*', { count: 'exact', head: true })
check('lee canciones (públicas)', !songsErr && songs > 0, songsErr?.message ?? `${songs} canciones`)
const { data: pb, error: pbErr } = await supabase.from('playback_state').select('*').single()
check('lee playback_state', !pbErr && pb?.id === 1, pbErr?.message ?? `fase=${pb?.phase}`)
const { data: rules } = await supabase.from('context_rules').select('id')
check('NO lee context_rules (solo admin)', (rules ?? []).length === 0)
const { data: hist } = await supabase.from('play_history').select('id')
check('NO lee play_history (solo admin)', (hist ?? []).length === 0)

// 3. RPC
const t0 = Date.now()
const { data: now, error: nowErr } = await supabase.rpc('server_now')
const t1 = Date.now()
check('rpc server_now', !nowErr && !!now, nowErr?.message ?? `desfase ${Math.round(new Date(now).getTime() - (t0 + t1) / 2)} ms, rtt ${t1 - t0} ms`)
const { data: adm } = await supabase.rpc('is_admin')
check('rpc is_admin = false para anónimo', adm === false)
const { data: vote, error: voteErr } = await supabase.rpc('cast_vote', { p_round_id: crypto.randomUUID(), p_option: 'a' })
check('rpc cast_vote con ronda inexistente → not_found', !voteErr && vote?.status === 'not_found', voteErr?.message ?? JSON.stringify(vote))

// 4. Escritura bloqueada para anónimos
const ins = await supabase.from('songs').insert({ youtube_id: 'SMOKE000000', title: 'x', genre: 'pop', energy: 3, mood: 'x' })
check('insert directo en songs bloqueado', !!ins.error, ins.error ? `${ins.error.code} ${ins.error.message}` : 'se insertó (MAL)')
const upd = await supabase.from('settings').update({ paused: true }).eq('id', 1).select()
check('update directo en settings bloqueado', !!upd.error || (upd.data ?? []).length === 0, upd.error?.message ?? '0 filas afectadas')
const vIns = await supabase.from('votes').insert({ round_id: crypto.randomUUID(), option: 'a', voter_id: auth.user.id })
check('insert directo en votes bloqueado', !!vIns.error, vIns.error?.message ?? 'se insertó (MAL)')

// 5. Realtime
const status = await new Promise((resolve) => {
  const ch = supabase
    .channel('smoke')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'rounds' }, () => {})
    .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, () => {})
    .subscribe((s) => {
      if (s === 'SUBSCRIBED' || s === 'CHANNEL_ERROR' || s === 'TIMED_OUT') resolve(s)
    })
  setTimeout(() => resolve('SIN_RESPUESTA'), 12000)
  void ch
})
check('Realtime SUBSCRIBED', status === 'SUBSCRIBED', status)

await supabase.removeAllChannels()
await supabase.auth.signOut()
console.log(failed ? `\n${failed} comprobación(es) fallaron` : '\nTodo bien')
process.exit(failed ? 1 : 0)
