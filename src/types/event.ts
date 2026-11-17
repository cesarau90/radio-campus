export type EventType = 'festividad' | 'examenes' | 'evento'

/** Evento del calendario del campus: mientras está vigente, activa su tema (canciones con ese `theme`) y su tipo (reglas). */
export interface CampusEvent {
  id: string
  name: string
  type: EventType
  starts_at: string
  ends_at: string
  theme: string | null
}

export type CampusEventInput = Omit<CampusEvent, 'id'>
