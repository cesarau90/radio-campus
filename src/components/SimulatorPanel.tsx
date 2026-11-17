import './admin.css'
import { describeContext, SIM_EVENTS, SIM_PRESETS, type AdminSimulatorModel, type ScenarioEntry } from '../hooks/useAdminSimulator'
import type { Song } from '../types'
import { SelectField, TextField } from './AdminField'
import Cover from './Cover'

function SongCard({ tag, song }: { tag: 'A' | 'B'; song: Song | null }) {
  if (!song) return <div className="ad-sim-song ad-hint">Sin canción</div>
  return (
    <div className="ad-sim-song">
      <span className="ad-song-cover">
        <Cover song={song} />
      </span>
      <span className="ad-song-text">
        <strong>
          <span className="ad-chip ad-chip--ok">{tag}</span> {song.title}
        </strong>
        <span className="ad-hint">{song.artist}</span>
        <span className="ad-hint mono">
          {song.genre} · {song.mood} · energía {song.energy}
          {song.theme ? ` · ${song.theme}` : ''}
        </span>
      </span>
    </div>
  )
}

function Scenario({ entry, first }: { entry: ScenarioEntry; first: boolean }) {
  const { result } = entry
  const p = result.pick
  const rules = p.rule_names.length ? p.rule_names.join(' · ') : 'ninguna regla'
  const facts: string[] = []
  if (p.used_fallback) facts.push(p.fallback_reason === 'sin_temperatura' ? 'Respaldo: sin dato de clima' : 'Respaldo: pocas canciones elegibles')
  else facts.push(`${p.pool_size} canciones elegibles`)
  if (p.genres?.length) facts.push(`géneros: ${p.genres.join(', ')}`)
  if (p.energy_min !== null || p.energy_max !== null) facts.push(`energía ${p.energy_min ?? 1}–${p.energy_max ?? 5}`)
  if (p.applied_moods.length) facts.push(`ánimos: ${p.applied_moods.flat().join(', ')}`)
  if (p.active_themes?.length) facts.push(`temas activos: ${p.active_themes.join(', ')}`)
  return (
    <li className={`ad-scenario${first ? ' is-latest' : ''}`}>
      <p className="ad-scenario-head">
        <strong className="mono">{describeContext(result.context)}</strong>
        {first && <span className="ad-chip ad-chip--ok">Último</span>}
      </p>
      <p className="ad-hint">Reglas: {rules}</p>
      <p className="ad-hint">{facts.join(' · ')}</p>
      <div className="ad-sim-pair">
        <SongCard tag="A" song={result.song_a} />
        <SongCard tag="B" song={result.song_b} />
      </div>
    </li>
  )
}

/** Simulador de contexto. Solo pinta el modelo de useAdminSimulator. */
export default function SimulatorPanel({ sim }: { sim: AdminSimulatorModel }) {
  const invalid = Object.keys(sim.errors).length > 0
  const o = sim.override
  return (
    <section className="ad-section ad-section--wide" aria-labelledby="sim-h">
      <h2 className="ad-h2" id="sim-h">
        Simular contexto
      </h2>
      <p className="ad-hint">
        Elige una hora, una temperatura y un evento y mira qué dos opciones ofrecería la radio. La vista previa solo consulta: no crea rondas.
        Con "Aplicar a la radio" la simulación se guarda y las rondas nuevas la usan hasta que la quites.
      </p>

      {o && (
        <div className="ad-banner" role="status">
          <strong>Simulación activa en la radio:</strong>{' '}
          <span className="mono">
            {[o.hour !== undefined ? `${o.hour}:00` : 'hora real', o.temp !== undefined ? `${o.temp} °C` : 'clima real', o.event_type === 'ninguno' ? 'sin evento' : o.event_type ? `${o.event_type}${o.theme ? ` "${o.theme}"` : ''}` : 'calendario real'].join(' · ')}
          </span>
          <button type="button" className="ad-btn ad-btn--sm" onClick={() => void sim.clearOverride()} disabled={sim.applying}>
            Quitar simulación
          </button>
        </div>
      )}

      <div className="ad-presets" role="group" aria-label="Escenarios de ejemplo">
        {SIM_PRESETS.map((p) => (
          <button key={p.id} type="button" className="ad-btn ad-btn--sm ad-preset" onClick={() => sim.loadPreset(p.id)} disabled={sim.running}>
            <strong>{p.label}</strong>
            <span className="ad-hint">{p.hint}</span>
          </button>
        ))}
      </div>

      <form
        className="ad-group"
        onSubmit={(e) => {
          e.preventDefault()
          void sim.preview()
        }}
      >
        <h3 className="ad-legend">Tu escenario</h3>
        <div className="ad-grid">
          <TextField label="Hora (0–23)" value={sim.draft.hour} onChange={(v) => sim.setField('hour', v)} error={sim.errors.hour} hint="Vacío = la hora real." mono />
          <TextField label="Temperatura (°C)" value={sim.draft.temp} onChange={(v) => sim.setField('temp', v)} error={sim.errors.temp} hint="Vacío = sin dato de clima." mono />
          <SelectField label="Evento activo" value={sim.draft.eventType} options={SIM_EVENTS} onChange={(v) => sim.setField('eventType', v)} />
          <TextField
            label="Tema del evento (opcional)"
            value={sim.draft.theme}
            onChange={(v) => sim.setField('theme', v)}
            hint='Ejemplo: "navidad" deja salir las navideñas.'
          />
        </div>
        {sim.error && (
          <p className="ad-error" role="alert">
            {sim.error}
          </p>
        )}
        {sim.notice && (
          <p className="ad-ok" role="status">
            {sim.notice}
          </p>
        )}
        <div className="ad-actions">
          <button type="submit" className="ad-btn ad-btn--primary" disabled={invalid || sim.running}>
            {sim.running ? 'Consultando…' : 'Ver las 2 opciones'}
          </button>
          <button type="button" className="ad-btn" onClick={() => void sim.applyToRadio()} disabled={invalid || sim.applying}>
            Aplicar a la radio
          </button>
        </div>
      </form>

      {sim.history.length > 0 && (
        <>
          <div className="ad-head">
            <h3 className="ad-h3">Escenarios consultados</h3>
            <button type="button" className="ad-btn ad-btn--sm" onClick={sim.clearHistory}>
              Limpiar lista
            </button>
          </div>
          <ul className="ad-scenarios">
            {sim.history.map((entry, i) => (
              <Scenario key={entry.id} entry={entry} first={i === 0} />
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
