# HORDA and HOWL architecture

This repository now treats HORDA as the public platform shell and HOWL Dashboard as the authenticated diagnostic module.

## Product split

- HORDA is the platform layer for acceleration programs, mentoring journeys, mentor-startup matching, tasks, approvals and program visibility.
- HOWL Dashboard is the diagnostic layer inside HORDA: assessments, HOWL Score, startup comparison, evolution history and executive reports.
- Supabase remains the system of record for authentication, role-based access and protected dashboard data.

## Route model

The app uses a single-page route state in `howl-dashboard/howl-dashboard/app.js`.

Public routes do not require an authenticated Supabase session:

- `home`
- `pitch`
- `startupApply`
- `mentorApply`
- `login`

Protected routes require a session and still pass through role-based navigation:

- `dashboard`
- `startups`
- `portfolio`
- `registration`
- `assessment`
- `history`
- `compare`
- `reports`
- `users`
- `settings`

## Authentication boundary

The public HORDA pages can render even when Supabase is not configured. Any protected route redirects to the login view when there is no active session.

The dashboard keeps the existing Supabase flow:

1. Supabase Auth validates the user session.
2. The `profiles` table maps the Supabase user to an application role.
3. Navigation is derived from the active role.
4. Program/startup visibility is filtered before data is rendered.

## Current migration state

The first migration slice reintroduces the HORDA public platform shell into the Supabase-backed HOWL app. The startup and mentor application forms are still UI-only placeholders; the next slice should persist those submissions into Supabase tables and add manager approval flows.

