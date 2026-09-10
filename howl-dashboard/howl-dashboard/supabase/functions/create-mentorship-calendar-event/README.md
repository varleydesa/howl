# create-mentorship-calendar-event

Cria um evento no Google Calendar para uma sessão de mentoria, solicita um link do Google Meet e salva os dados em `mentorship_sessions`.

## Secrets necessárias

- `HOWL_SERVICE_ROLE_KEY`: chave service role do Supabase.

O token do Google Calendar é enviado pelo frontend a partir da sessão OAuth já autorizada pelo usuário logado.

## Campos atualizados

- `google_calendar_event_id`
- `google_calendar_event_url`
- `google_meet_url`
- `google_calendar_synced_at`

## Deploy

```bash
supabase functions deploy create-mentorship-calendar-event
```
