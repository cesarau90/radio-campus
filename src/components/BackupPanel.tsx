import './admin.css'
import { useId } from 'react'
import type { AdminBackupModel } from '../hooks/useAdminBackup'

/** Respaldo de la configuración. Solo pinta el modelo de useAdminBackup. */
export default function BackupPanel({ backup: b }: { backup: AdminBackupModel }) {
  const fileId = useId()
  const r = b.report
  return (
    <section className="ad-section ad-section--form" aria-labelledby="bk-h">
      <h2 className="ad-h2" id="bk-h">
        Respaldo
      </h2>
      <p className="ad-hint">
        El respaldo es un archivo JSON con los <strong>ajustes</strong>, las <strong>reglas</strong>, los <strong>eventos</strong>, los <strong>anuncios</strong> y las{' '}
        <strong>playlists</strong> (con sus canciones). No incluye las canciones del catálogo ni el historial de votos. Al importar no se borra nada: lo que ya existe con el
        mismo nombre se sobrescribe y lo que falta se crea.
      </p>
      <div className="ad-actions">
        <button type="button" className="ad-btn" onClick={() => void b.exportBackup()} disabled={b.busy}>
          Exportar respaldo
        </button>
        <label className="ad-btn ad-file" htmlFor={fileId} aria-disabled={b.busy}>
          Importar respaldo
          <input
            id={fileId}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            disabled={b.busy}
            onChange={(e) => {
              void b.pickFile(e.target.files?.[0])
              e.target.value = '' // permite elegir el mismo archivo otra vez
            }}
          />
        </label>
      </div>

      {b.pending && (
        <div className="ad-banner" role="alertdialog" aria-label="Confirmar importación del respaldo">
          <p>
            <strong>¿Importar {b.pending.fileName}?</strong> Trae {b.pending.summary} Se sobrescribirán los elementos con el mismo nombre; el resto no se toca.
          </p>
          <span className="ad-row-actions">
            <button type="button" className="ad-btn ad-btn--primary" onClick={() => void b.confirmImport()} disabled={b.busy}>
              {b.busy ? 'Importando…' : 'Sí, importar'}
            </button>
            <button type="button" className="ad-btn" onClick={b.cancelImport} disabled={b.busy}>
              Cancelar
            </button>
          </span>
        </div>
      )}

      {b.error && (
        <p className="ad-error" role="alert">
          {b.error}
        </p>
      )}
      {b.notice && (
        <p className="ad-ok" role="status">
          {b.notice}
        </p>
      )}
      {r && (
        <ul className="ad-report" aria-label="Resultado de la importación">
          <li>Ajustes: {r.ajustes ? 'restaurados' : 'sin cambios'}</li>
          <li>
            Reglas: {r.reglas.creadas} creadas, {r.reglas.actualizadas} actualizadas
          </li>
          <li>
            Eventos: {r.eventos.creados} creados, {r.eventos.actualizados} actualizados
          </li>
          <li>
            Anuncios: {r.anuncios.creados} creados, {r.anuncios.actualizados} actualizados
          </li>
          <li>
            Playlists: {r.playlists.creadas} creadas, {r.playlists.actualizadas} actualizadas, {r.playlists.cancionesVinculadas} canciones vinculadas
          </li>
          {r.avisos.map((a) => (
            <li key={a} className="ad-error">
              {a}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
