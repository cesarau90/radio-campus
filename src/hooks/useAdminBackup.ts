import { useCallback, useState } from 'react'
import { buildBackup, parseBackup, restoreBackup, summarizeBackup, type Backup, type RestoreReport } from '../lib/backup'
import { downloadJson } from '../lib/download'

interface Pending {
  fileName: string
  backup: Backup
  summary: string
}

/**
 * Respaldo de la configuración (Fase 10): exportar a un archivo JSON (ajustes, reglas, eventos, anuncios y playlists)
 * e importarlo de vuelta con confirmación. Importar no borra nada: sobrescribe lo que tiene el mismo nombre y crea lo que falta.
 */
export function useAdminBackup() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [pending, setPending] = useState<Pending | null>(null)
  const [report, setReport] = useState<RestoreReport | null>(null)

  const exportBackup = useCallback(async () => {
    setBusy(true)
    setError(null)
    setNotice(null)
    setReport(null)
    try {
      const backup = await buildBackup()
      const name = `radio-campus-respaldo-${backup.exported_at.slice(0, 10)}.json`
      downloadJson(name, backup)
      setNotice(`Respaldo exportado: ${name}. Guárdalo fuera de la computadora de la radio (por ejemplo, en tu correo o una nube).`)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }, [])

  /** Lee el archivo elegido y lo valida; todavía NO toca la base: queda a la espera de la confirmación. */
  const pickFile = useCallback(async (file: File | undefined) => {
    setError(null)
    setNotice(null)
    setReport(null)
    setPending(null)
    if (!file) return
    try {
      const parsed = parseBackup(await file.text())
      if (!parsed.ok) {
        setError(parsed.error)
        return
      }
      setPending({ fileName: file.name, backup: parsed.backup, summary: summarizeBackup(parsed.backup) })
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }, [])

  const cancelImport = useCallback(() => setPending(null), [])

  const confirmImport = useCallback(async () => {
    if (!pending) return
    setBusy(true)
    setError(null)
    try {
      setReport(await restoreBackup(pending.backup))
      setPending(null)
      setNotice('Respaldo importado. Recarga las pestañas del panel para ver los cambios.')
    } catch (e) {
      setError(`No se pudo terminar la importación: ${e instanceof Error ? e.message : String(e)}. Puedes volver a importar el mismo archivo: no duplica nada.`)
    } finally {
      setBusy(false)
    }
  }, [pending])

  return { busy, error, notice, pending, report, exportBackup, pickFile, cancelImport, confirmImport }
}

export type AdminBackupModel = ReturnType<typeof useAdminBackup>
