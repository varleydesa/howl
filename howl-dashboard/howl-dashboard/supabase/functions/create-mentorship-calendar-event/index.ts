import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const functionVersion = "create-mentorship-calendar-event-2026-09-10-01";
const calendarTimeZone = "America/Sao_Paulo";

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify({ version: functionVersion, ...body }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeText(value: unknown) {
  return String(value || "").trim();
}

function googleApiMessage(status: number, payload: Record<string, unknown>) {
  const error = payload.error as { message?: unknown; status?: unknown } | undefined;
  const message = normalizeText(error?.message) || normalizeText(payload.error_description);
  if (status === 401) return "Reconecte o Google Calendar. A autorização expirou ou não está disponível.";
  if (status === 403) return "O Google recusou a criação do evento. Confirme se o escopo do Calendar foi autorizado.";
  if (status === 429) return "O Google Calendar está limitando as chamadas agora. Tente novamente em instantes.";
  return message || "O Google Calendar não conseguiu criar o evento.";
}

function extractGoogleMeetUrl(event: Record<string, unknown>) {
  const hangoutLink = normalizeText(event.hangoutLink);
  if (hangoutLink) return hangoutLink;

  const conferenceData = event.conferenceData as { entryPoints?: unknown } | undefined;
  const entryPoints = Array.isArray(conferenceData?.entryPoints) ? conferenceData.entryPoints : [];
  const videoEntry = entryPoints.find((entryPoint) => {
    const item = entryPoint as { entryPointType?: unknown; uri?: unknown };
    return item.entryPointType === "video" && Boolean(item.uri);
  }) as { uri?: unknown } | undefined;
  return normalizeText(videoEntry?.uri);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed", message: "Use POST." }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("HOWL_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse(
      { error: "missing_server_config", message: "Configure HOWL_SERVICE_ROLE_KEY nos Secrets da Edge Function." },
      500
    );
  }

  const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!jwt) return jsonResponse({ error: "unauthorized", message: "Sessão ausente." }, 401);

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "invalid_json", message: "Corpo da requisição inválido." }, 400);
  }

  const sessionId = normalizeText(payload.sessionId);
  const accessToken = normalizeText(payload.accessToken);
  if (!sessionId) {
    return jsonResponse({ error: "missing_session", message: "Informe a sessão de mentoria." }, 400);
  }
  if (!accessToken) {
    return jsonResponse(
      { error: "missing_google_token", message: "Reconecte o Google Calendar antes de criar o Meet." },
      400
    );
  }

  const authAdminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const dbAdminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      headers: { Authorization: `Bearer ${serviceRoleKey}`, apikey: serviceRoleKey },
    },
  });

  const {
    data: { user: caller },
    error: callerError,
  } = await authAdminClient.auth.getUser(jwt);
  if (callerError || !caller) {
    return jsonResponse({ error: "unauthorized", message: "Sessão inválida." }, 401);
  }

  const { data: callerProfile, error: callerProfileError } = await dbAdminClient
    .from("profiles")
    .select("id, role, program_id, active")
    .eq("auth_user_id", caller.id)
    .maybeSingle();

  const callerRole = normalizeText(callerProfile?.role).toLowerCase();
  if (callerProfileError || !callerProfile?.active || !["admin", "cliente", "avaliador"].includes(callerRole)) {
    return jsonResponse(
      { error: "forbidden", message: "Apenas gestores e mentores ativos podem criar eventos de mentoria." },
      403
    );
  }

  const { data: session, error: sessionError } = await dbAdminClient
    .from("mentorship_sessions")
    .select("id, program_id, startup_id, mentor_profile_id, status, scheduled_at, duration_minutes, topic, agenda, google_calendar_event_id, google_calendar_event_url, google_meet_url")
    .eq("id", sessionId)
    .maybeSingle();
  if (sessionError || !session) {
    return jsonResponse({ error: "session_not_found", message: "Sessão de mentoria não encontrada." }, 404);
  }

  const callerProgramId = normalizeText(callerProfile.program_id);
  const canManage =
    callerRole === "admin" ||
    (callerRole === "cliente" && callerProgramId === session.program_id) ||
    (callerRole === "avaliador" && callerProfile.id === session.mentor_profile_id);
  if (!canManage) {
    return jsonResponse({ error: "forbidden", message: "Você não tem permissão para esta sessão." }, 403);
  }
  if (session.status === "canceled") {
    return jsonResponse({ error: "canceled_session", message: "Sessões canceladas não geram evento no Google Calendar." }, 400);
  }
  if (session.google_meet_url) {
    return jsonResponse({
      synced: true,
      googleCalendarEventId: session.google_calendar_event_id || "",
      googleCalendarEventUrl: session.google_calendar_event_url || "",
      googleMeetUrl: session.google_meet_url,
      googleCalendarSyncedAt: null,
    });
  }

  const [startupResult, programResult, mentorResult] = await Promise.all([
    dbAdminClient.from("startups").select("id, name, founder, sector").eq("id", session.startup_id).maybeSingle(),
    dbAdminClient.from("programs").select("id, name, client").eq("id", session.program_id).maybeSingle(),
    dbAdminClient.from("profiles").select("id, name, email").eq("id", session.mentor_profile_id).maybeSingle(),
  ]);
  if (startupResult.error || programResult.error || mentorResult.error) {
    return jsonResponse({ error: "context_error", message: "Não foi possível carregar os dados da sessão." }, 500);
  }

  const start = new Date(session.scheduled_at);
  if (Number.isNaN(start.getTime())) {
    return jsonResponse({ error: "invalid_date", message: "A sessão não possui data válida." }, 400);
  }
  const durationMinutes = Math.min(Math.max(Number(session.duration_minutes) || 60, 15), 360);
  const end = new Date(start.getTime() + durationMinutes * 60000);
  const startup = startupResult.data || {};
  const program = programResult.data || {};
  const mentor = mentorResult.data || {};

  const eventBody = {
    summary: `${normalizeText(session.topic) || "Mentoria"} - ${normalizeText(startup.name) || "Startup"}`,
    description: [
      `Programa: ${normalizeText(program.name) || "Programa HOWL"}`,
      `Startup: ${normalizeText(startup.name) || "Startup"}`,
      `Mentor: ${normalizeText(mentor.name) || "Mentor"}`,
      "",
      normalizeText(session.agenda) ? `Contexto pré-sessão:\n${normalizeText(session.agenda)}` : "",
    ].filter(Boolean).join("\n"),
    start: { dateTime: start.toISOString(), timeZone: calendarTimeZone },
    end: { dateTime: end.toISOString(), timeZone: calendarTimeZone },
    conferenceData: {
      createRequest: {
        requestId: `horda-${session.id}`.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 96),
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    },
  };

  const googleResponse = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventBody),
    }
  );
  const googlePayload = await googleResponse.json().catch(() => ({}));
  if (!googleResponse.ok) {
    return jsonResponse(
      { error: "google_calendar_error", message: googleApiMessage(googleResponse.status, googlePayload) },
      googleResponse.status === 401 ? 401 : 502
    );
  }

  const googleEvent = googlePayload as Record<string, unknown>;
  const googleCalendarEventId = normalizeText(googleEvent.id);
  const googleCalendarEventUrl = normalizeText(googleEvent.htmlLink);
  const googleMeetUrl = extractGoogleMeetUrl(googleEvent);
  const googleCalendarSyncedAt = new Date().toISOString();

  const { error: updateError } = await dbAdminClient
    .from("mentorship_sessions")
    .update({
      google_calendar_event_id: googleCalendarEventId,
      google_calendar_event_url: googleCalendarEventUrl,
      google_meet_url: googleMeetUrl,
      google_calendar_synced_at: googleCalendarSyncedAt,
    })
    .eq("id", session.id);
  if (updateError) {
    return jsonResponse(
      { error: "session_update_failed", message: "O evento foi criado, mas não foi possível salvar o link na sessão." },
      500
    );
  }

  return jsonResponse({
    synced: true,
    googleCalendarEventId,
    googleCalendarEventUrl,
    googleMeetUrl,
    googleCalendarSyncedAt,
  });
});
