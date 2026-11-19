import { useEffect, useRef } from 'react'

/**
 * Lleva al usuario al formulario de edición y lo regresa a su fila al terminar.
 * - Al abrir (editingId pasa a tener valor): scroll suave al formulario, foco en su primer campo y un destello naranja.
 * - Al cerrar (guardar o cancelar): scroll de vuelta a la fila editada (`data-row-id`) o, si era "nuevo", al botón que lo abrió.
 * Uso: `useEditFocus(editingId)` en el hook del CRUD; `<form data-edit-form>` y `<tr data-row-id={id}>`.
 */
export function useEditFocus(editingId: string | null) {
  const trigger = useRef<HTMLElement | null>(null)
  const prevId = useRef<string | null>(null)

  useEffect(() => {
    const prev = prevId.current
    prevId.current = editingId
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const behavior: ScrollBehavior = reduce ? 'auto' : 'smooth'

    if (editingId !== null && prev === null) {
      const active = document.activeElement
      trigger.current = active instanceof HTMLElement && active !== document.body ? active : null
      const form = document.querySelector<HTMLFormElement>('form[data-edit-form]')
      if (!form) return
      form.scrollIntoView({ behavior, block: 'start' })
      form.querySelector<HTMLElement>('input:not([type=hidden]):not([disabled]), select, textarea')?.focus({ preventScroll: true })
      form.classList.remove('ad-flash')
      void form.offsetWidth // reinicia la animación si se abre dos veces seguidas
      form.classList.add('ad-flash')
      const t = window.setTimeout(() => form.classList.remove('ad-flash'), 1800)
      return () => window.clearTimeout(t)
    }

    if (editingId === null && prev !== null) {
      const row = prev === 'new' ? null : document.querySelector<HTMLElement>(`[data-row-id="${CSS.escape(prev)}"]`)
      const target = row ?? (trigger.current?.isConnected ? trigger.current : null)
      target?.scrollIntoView({ behavior, block: 'center' })
      const back = trigger.current?.isConnected ? trigger.current : row?.querySelector<HTMLElement>('button')
      back?.focus({ preventScroll: true })
      trigger.current = null
    }
  }, [editingId])

}
