import './votar.css'
import { useEffect, useRef } from 'react'
import type { RoundOption } from '../types'
import type { VotarModel } from '../hooks/useVotar'
import ConnectionBanner from './ConnectionBanner'
import NowPlaying from './NowPlaying'
import OptionPanel, { type PanelState } from './OptionPanel'
import ResultView from './ResultView'
import StatusNotice from './StatusNotice'
import VotarHeader from './VotarHeader'
import WaitingView from './WaitingView'

/** Pantalla completa de /votar. Solo pinta el modelo que arma useVotar; no tiene lógica propia. */
export default function VotarView(m: VotarModel) {
  const { view } = m

  // Al votar, el botón y el radio enfocados se desmontan y el foco caería al <body>:
  // se lleva al título, que ya dice "¡Voto registrado!". Solo si se votó en esta visita (justVoted):
  // al recargar una ronda ya votada la vista también pasa por 'voting' un instante hasta que
  // llega fetchMyVote, y ahí no se debe robar el foco.
  const headingRef = useRef<HTMLHeadingElement>(null)
  const prevView = useRef(view)
  useEffect(() => {
    if (view === 'voted' && prevView.current === 'voting' && m.justVoted) headingRef.current?.focus()
    prevView.current = view
  }, [view, m.justVoted])

  if (view === 'connecting') {
    return (
      <div className="vt-app">
        <StatusNotice scanning title="Sintonizando…" text="Conectando con la radio del campus." />
      </div>
    )
  }

  if (view === 'error') {
    return (
      <div className="vt-app">
        <StatusNotice
          title="No pudimos conectar"
          text={m.errorMessage ?? 'Revisa tu conexión e inténtalo de nuevo.'}
          actionLabel="Reintentar"
          onAction={m.retry}
        />
      </div>
    )
  }

  if (view === 'no-round') {
    return (
      <div className="vt-app">
        <ConnectionBanner status={m.connection} />
        <VotarHeader timeLabel={null} timeSpoken={null} urgent={false} progress={0} />
        <WaitingView nowPlaying={m.nowPlaying} />
      </div>
    )
  }

  if (view === 'closed') {
    return (
      <div className="vt-app">
        <ConnectionBanner status={m.connection} />
        <VotarHeader timeLabel={null} timeSpoken={null} urgent={false} progress={0} />
        <ResultView
          winner={m.result?.winner ?? null}
          winnerOption={m.result?.winnerOption ?? null}
          tally={m.result?.tally ?? []}
          resolution={m.result?.resolution ?? null}
          myOption={m.myOption}
          nowPlaying={m.nowPlaying}
        />
      </div>
    )
  }

  // voting | voted | counting: la papeleta
  const voting = view === 'voting'
  const hasSelection = voting && m.selectedOption !== null
  const heading = voting
    ? '¿Qué suena después?'
    : view === 'counting'
      ? 'Contando votos…'
      : m.justVoted
        ? '¡Voto registrado!'
        : 'Ya votaste en esta ronda'

  const stateFor = (option: RoundOption): PanelState => {
    if (voting) return m.selectedOption === option ? 'selected' : 'idle'
    if (m.myOption === option) return 'chosen'
    return m.myOption ? 'dimmed' : 'idle'
  }

  const letter = m.selectedOption ? m.selectedOption.toUpperCase() : null
  const offline = m.connection === 'error'
  const confirmLabel = m.submitting ? 'Enviando…' : letter ? `Confirmar voto por ${letter}` : 'Elige una canción'

  // Región viva: existe desde que se pinta la papeleta (vacía mientras se vota) y recibe el texto al cambiar de vista.
  // Un aria-live que aparece ya con texto no siempre se anuncia; por eso no vive en el pie, que solo se monta después.
  const chosen = m.myOption === 'a' ? m.songA : m.myOption === 'b' ? m.songB : null
  const announcement =
    view === 'voted'
      ? `Voto registrado.${chosen ? ` Elegiste la opción ${m.myOption?.toUpperCase()}: ${chosen.title}, de ${chosen.artist}.` : ''} El resultado aparece cuando termine la ronda.`
      : view === 'counting'
        ? 'Tiempo terminado. En un momento sabrás qué suena.'
        : ''

  return (
    <div className="vt-app">
      <ConnectionBanner status={m.connection} />
      <VotarHeader timeLabel={m.timeLabel} timeSpoken={m.timeSpoken} urgent={m.urgent} progress={m.progress} />
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>

      <main className="vt-ballot">
        {m.nowPlaying && (
          <div className="vt-now">
            <NowPlaying song={m.nowPlaying} />
          </div>
        )}
        <h1 className="vt-heading" ref={headingRef} tabIndex={-1}>
          {heading}
        </h1>
        {voting && <p className="vt-subtitle">Elige la canción que quieres escuchar</p>}

        <div
          className={`vt-panels${hasSelection ? ' has-selection' : ''}`}
          role={voting ? 'radiogroup' : undefined}
          aria-label={voting ? 'Elige la siguiente canción' : undefined}
        >
          {m.songA && (
            <OptionPanel
              option="a"
              song={m.songA}
              state={stateFor('a')}
              interactive={voting}
              stampAnimated={m.justVoted}
              onSelect={m.select}
            />
          )}
          {m.songB && (
            <OptionPanel
              option="b"
              song={m.songB}
              state={stateFor('b')}
              interactive={voting}
              stampAnimated={m.justVoted}
              onSelect={m.select}
            />
          )}
        </div>
      </main>

      {voting ? (
        <footer className="vt-bar">
          {m.voteError && (
            <p className="vt-bar-error" role="alert">
              {m.voteError}
            </p>
          )}
          <button
            type="button"
            className="vt-confirm"
            disabled={!m.selectedOption || m.submitting || offline}
            onClick={() => void m.vote()}
          >
            {confirmLabel}
          </button>
        </footer>
      ) : (
        <footer className="vt-bar vt-bar--status">
          <p>
            {view === 'counting'
              ? 'Tiempo terminado. En un momento sabrás qué suena.'
              : 'Tu voto ya cuenta. El resultado aparece aquí cuando termine la ronda.'}
          </p>
        </footer>
      )}
    </div>
  )
}
