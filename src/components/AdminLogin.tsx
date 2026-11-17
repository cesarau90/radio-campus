import './admin.css'
import { useId, type FormEvent } from 'react'
import { DialMark } from './icons'

interface Props {
  error: string | null
  onLogin: (email: string, password: string) => Promise<boolean>
}

/** Entrada del panel: correo y contraseña. Solo entran las cuentas que están en la tabla admins. */
export default function AdminLogin({ error, onLogin }: Props) {
  const emailId = useId()
  const passId = useId()

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    void onLogin(String(form.get('email') ?? '').trim(), String(form.get('password') ?? ''))
  }

  return (
    <main className="ad-login">
      <form className="ad-login-card" onSubmit={submit}>
        <span className="ad-login-brand">
          <DialMark size={32} />
          Radio Campus
        </span>
        <h1 className="ad-title">Panel de administración</h1>
        <label className="ad-field" htmlFor={emailId}>
          <span className="ad-label">Correo</span>
          <input id={emailId} name="email" type="email" autoComplete="username" required className="ad-input" />
        </label>
        <label className="ad-field" htmlFor={passId}>
          <span className="ad-label">Contraseña</span>
          <input id={passId} name="password" type="password" autoComplete="current-password" required className="ad-input" />
        </label>
        {error && (
          <p className="ad-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="ad-btn ad-btn--primary">
          Entrar
        </button>
      </form>
    </main>
  )
}
