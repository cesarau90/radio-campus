import './admin.css'
import { useId } from 'react'

interface TextProps {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  hint?: string
  type?: 'text' | 'datetime-local' | 'number'
  /** id de un <datalist> con sugerencias. */
  list?: string
  mono?: boolean
  multiline?: boolean
  required?: boolean
}

/** Campo de texto con su etiqueta, ayuda y error (el error se anuncia y marca el campo). */
export function TextField({ label, value, onChange, error, hint, type = 'text', list, mono, multiline, required }: TextProps) {
  const id = useId()
  const common = {
    id,
    className: `ad-input${mono ? ' mono' : ''}${multiline ? ' ad-input--area' : ''}`,
    value,
    required,
    'aria-invalid': error ? (true as const) : undefined,
    'aria-describedby': error || hint ? `${id}-d` : undefined,
  }
  return (
    <div className="ad-field">
      <label className="ad-label" htmlFor={id}>
        {label}
      </label>
      {multiline ? (
        <textarea {...common} rows={3} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input {...common} type={type} list={list} onChange={(e) => onChange(e.target.value)} />
      )}
      {(error || hint) && (
        <span id={`${id}-d`} className={error ? 'ad-error' : 'ad-hint'}>
          {error ?? hint}
        </span>
      )}
    </div>
  )
}

interface CheckProps {
  label: string
  hint?: string
  checked: boolean
  onChange: (checked: boolean) => void
}

/** Casilla con su etiqueta y una ayuda corta. */
export function CheckField({ label, hint, checked, onChange }: CheckProps) {
  const id = useId()
  return (
    <label className="ad-check" htmlFor={id}>
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>
        <strong>{label}</strong>
        {hint && <span className="ad-hint"> {hint}</span>}
      </span>
    </label>
  )
}

interface SelectProps<T extends string> {
  label: string
  value: T
  options: Array<{ value: T; label: string }>
  onChange: (value: T) => void
  hint?: string
}

/** Lista desplegable con su etiqueta. */
export function SelectField<T extends string>({ label, value, options, onChange, hint }: SelectProps<T>) {
  const id = useId()
  return (
    <div className="ad-field">
      <label className="ad-label" htmlFor={id}>
        {label}
      </label>
      <select id={id} className="ad-input" value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && <span className="ad-hint">{hint}</span>}
    </div>
  )
}
