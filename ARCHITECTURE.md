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

## Public applications

Public startup and mentor forms write to `public.horda_applications`.

Anonymous visitors can only insert new pending applications. Authenticated managers can review applications, assign them to a program and approve or reject them. Approving a startup creates a startup record and its assessment cycles. Approving a mentor creates an evaluator profile through the existing Supabase Edge Function that provisions Auth users.

Applications without a program are visible to Admin users. Client users see applications after they are associated with their own program.

## Current migration state

The first migration slice reintroduced the HORDA public platform shell into the Supabase-backed HOWL app. The second slice connects public applications to Supabase and adds an internal approval queue. The next migration slice should expand HORDA's operational module with mentoring sessions, task follow-up and mentor-startup matching.
