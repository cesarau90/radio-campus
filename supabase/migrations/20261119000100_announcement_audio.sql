-- Fase 12: audio opcional por anuncio (URL completa o ruta tipo /audio/x.mp3). Sin audio se usa la voz del navegador.
alter table public.announcements add column if not exists audio_url text;
