// Verifica que cada youtube_id del seed siga existiendo y permita embed (oEmbed responde 200).
//   npm run verify:seed            -> revisa supabase/seed.sql
//   node scripts/verify-youtube-ids.mjs ruta/otro.sql
// Sale con código 1 si algún video falla (eliminado, privado o con embed deshabilitado).
import { readFileSync } from 'node:fs'

const file = process.argv[2] ?? 'supabase/seed.sql'
const sql = readFileSync(file, 'utf8')
const rows = [...sql.matchAll(/^\s+\('([A-Za-z0-9_-]{11})', '((?:[^']|'')*)'/gm)].map((m) => ({
  id: m[1],
  title: m[2].replace(/''/g, "'"),
}))

if (rows.length === 0) {
  console.error(`No encontré canciones en ${file}`)
  process.exit(1)
}

let failed = 0
for (const { id, title } of rows) {
  const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
    if (res.status === 200) {
      console.log(`OK    ${id}  ${title}`)
    } else {
      failed++
      console.log(`FALLA ${id}  ${title}  (HTTP ${res.status}: ${res.status === 401 ? 'embed deshabilitado' : 'no disponible'})`)
    }
  } catch (e) {
    failed++
    console.log(`FALLA ${id}  ${title}  (${e})`)
  }
  await new Promise((r) => setTimeout(r, 150))
}

console.log(`\n${rows.length - failed}/${rows.length} videos disponibles para embed`)
process.exit(failed ? 1 : 0)
