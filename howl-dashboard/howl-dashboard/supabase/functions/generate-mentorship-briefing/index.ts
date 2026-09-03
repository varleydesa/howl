import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const functionVersion = "generate-mentorship-briefing-2026-09-03-01";

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify({ version: functionVersion, ...body }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeText(value: unknown) {
  return String(value || "").trim();
}

function numberOrNull(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function average(values: number[]) {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function extractOpenAiText(payload: Record<string, unknown>) {
  if (typeof payload.output_text === "string") return payload.output_text;
  const output = Array.isArray(payload.output) ? payload.output : [];
  return output
    .flatMap((item) => {
      const content = (item as { content?: unknown }).content;
      return Array.isArray(content) ? content : [];
    })
    .map((content) => {
      const item = content as { text?: unknown; type?: unknown };
      return typeof item.text === "string" && String(item.type || "").includes("text")
        ? item.text
        : "";
    })
    .filter(Boolean)
    .join("\n\n")
    .trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed", message: "Use POST." }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("HOWL_SERVICE_ROLE_KEY");
  const openAiKey = Deno.env.get("OPENAI_API_KEY");
  const model = Deno.env.get("OPENAI_MODEL") || "gpt-5.6-luna";

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse(
      { error: "missing_server_config", message: "Configure HOWL_SERVICE_ROLE_KEY nos Secrets da Edge Function." },
      500
    );
  }
  if (!openAiKey) {
    return jsonResponse(
      { error: "missing_openai_key", message: "Configure OPENAI_API_KEY nos Secrets da Edge Function." },
      500
    );
  }

  const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!jwt) return jsonResponse({ error: "unauthorized", message: "Sessão ausente." }, 401);

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
      { error: "forbidden", message: "Apenas gestores e mentores ativos podem gerar briefing com IA." },
      403
    );
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "invalid_json", message: "Corpo da requisição inválido." }, 400);
  }

  const sessionId = normalizeText(payload.sessionId);
  if (!sessionId) {
    return jsonResponse({ error: "missing_session", message: "Informe a sessão de mentoria." }, 400);
  }

  const { data: session, error: sessionError } = await dbAdminClient
    .from("mentorship_sessions")
    .select("id, link_id, program_id, startup_id, mentor_profile_id, status, scheduled_at, duration_minutes, topic, agenda, summary, next_steps")
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

  const [
    startupResult,
    programResult,
    mentorResult,
    tasksResult,
    sessionsResult,
    feedbackResult,
    assessmentsResult,
  ] = await Promise.all([
    dbAdminClient
      .from("startups")
      .select("id, name, founder, sector, city, state, stage, description")
      .eq("id", session.startup_id)
      .maybeSingle(),
    dbAdminClient.from("programs").select("id, name, client").eq("id", session.program_id).maybeSingle(),
    dbAdminClient.from("profiles").select("id, name, organization").eq("id", session.mentor_profile_id).maybeSingle(),
    dbAdminClient
      .from("mentorship_tasks")
      .select("id, title, description, priority, status, due_date")
      .eq("startup_id", session.startup_id)
      .neq("status", "done")
      .order("due_date", { ascending: true }),
    dbAdminClient
      .from("mentorship_sessions")
      .select("id, status, scheduled_at, duration_minutes, topic, agenda, summary, next_steps")
      .eq("startup_id", session.startup_id)
      .neq("id", session.id)
      .order("scheduled_at", { ascending: false })
      .limit(5),
    dbAdminClient
      .from("mentorship_session_feedback")
      .select("session_id, rating, comment, updated_at")
      .eq("startup_id", session.startup_id)
      .order("updated_at", { ascending: false })
      .limit(5),
    dbAdminClient
      .from("assessment_question_results")
      .select("month, year, journey_name, final_score, gap, evaluator_comment")
      .eq("startup_id", session.startup_id)
      .order("year", { ascending: false })
      .order("month", { ascending: false })
      .limit(40),
  ]);

  if (startupResult.error || !startupResult.data) {
    return jsonResponse({ error: "startup_not_found", message: "Startup da sessão não encontrada." }, 404);
  }
  if (programResult.error || mentorResult.error || tasksResult.error || sessionsResult.error) {
    return jsonResponse({ error: "context_load_failed", message: "Não foi possível carregar o contexto da mentoria." }, 500);
  }

  const assessmentRows = assessmentsResult.error ? [] : assessmentsResult.data || [];
  const latestPeriodKey = assessmentRows[0] ? `${assessmentRows[0].year}-${assessmentRows[0].month}` : "";
  const latestAssessmentRows = assessmentRows.filter((row) => `${row.year}-${row.month}` === latestPeriodKey);
  const finalScores = latestAssessmentRows.map((row) => numberOrNull(row.final_score)).filter((value): value is number => value !== null);
  const score = average(finalScores);
  const journeyScores = Array.from(
    latestAssessmentRows.reduce((map, row) => {
      const value = numberOrNull(row.final_score);
      if (value === null) return map;
      const name = normalizeText(row.journey_name) || "Jornada";
      map.set(name, [...(map.get(name) || []), value]);
      return map;
    }, new Map<string, number[]>())
  ).map(([name, values]) => ({ name, score: average(values) }));
  const sortedJourneys = [...journeyScores].sort((a, b) => (a.score || 0) - (b.score || 0));

  const context = {
    program: programResult.data,
    startup: startupResult.data,
    mentor: mentorResult.data,
    currentSession: session,
    latestAssessment: {
      period: latestPeriodKey || "sem avaliação",
      score: score === null ? null : Math.round(score * 20),
      weakestJourney: sortedJourneys[0] || null,
      strongestJourney: sortedJourneys.at(-1) || null,
      evaluatorComments: latestAssessmentRows
        .map((row) => normalizeText(row.evaluator_comment))
        .filter(Boolean)
        .slice(0, 6),
    },
    openTasks: (tasksResult.data || []).slice(0, 8),
    recentSessions: sessionsResult.data || [],
    recentFeedback: feedbackResult.error ? [] : feedbackResult.data || [],
  };

  const instructions = [
    "Você é um assistente de mentoria para programas de aceleração da plataforma HORDA.",
    "Gere um briefing pré-sessão em português do Brasil, objetivo e acionável.",
    "Use apenas os dados enviados. Não invente métricas, nomes, avaliações ou fatos externos.",
    "O texto será revisado por um mentor humano antes de ser salvo.",
    "Formato obrigatório: Situação atual, Pontos de atenção, Perguntas sugeridas, Foco recomendado, Próximos passos prováveis.",
    "Evite jargões genéricos e mantenha a resposta com no máximo 550 palavras.",
  ].join("\n");

  const openAiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openAiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      instructions,
      input: `Contexto real da mentoria HORDA:\n${JSON.stringify(context, null, 2)}`,
      max_output_tokens: 900,
      store: false,
    }),
  });

  const openAiPayload = (await openAiResponse.json().catch(() => ({}))) as Record<string, unknown>;
  if (!openAiResponse.ok) {
    const error = openAiPayload.error as { message?: string } | undefined;
    return jsonResponse(
      {
        error: "openai_request_failed",
        message: error?.message || "A OpenAI não conseguiu gerar o briefing.",
      },
      502
    );
  }

  const briefing = extractOpenAiText(openAiPayload);
  if (!briefing) {
    return jsonResponse({ error: "empty_briefing", message: "A IA não retornou conteúdo para o briefing." }, 502);
  }

  return jsonResponse({
    briefing,
    model,
    usage: openAiPayload.usage || null,
  });
});
