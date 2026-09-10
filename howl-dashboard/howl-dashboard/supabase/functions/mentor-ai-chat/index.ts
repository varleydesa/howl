import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const functionVersion = "mentor-ai-chat-2026-09-09-01";

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
      return typeof item.text === "string" && String(item.type || "").includes("text") ? item.text : "";
    })
    .filter(Boolean)
    .join("\n\n")
    .trim();
}

function extractGeminiText(payload: Record<string, unknown>) {
  const candidates = Array.isArray(payload.candidates) ? payload.candidates : [];
  return candidates
    .flatMap((candidate) => {
      const content = (candidate as { content?: { parts?: unknown } }).content;
      return Array.isArray(content?.parts) ? content.parts : [];
    })
    .map((part) => {
      const item = part as { text?: unknown };
      return typeof item.text === "string" ? item.text : "";
    })
    .filter(Boolean)
    .join("\n\n")
    .trim();
}

function geminiFinishReason(payload: Record<string, unknown>) {
  const candidates = Array.isArray(payload.candidates) ? payload.candidates : [];
  const first = candidates[0] as { finishReason?: unknown; finishMessage?: unknown } | undefined;
  return {
    reason: typeof first?.finishReason === "string" ? first.finishReason : "",
    message: typeof first?.finishMessage === "string" ? first.finishMessage : "",
  };
}

function providerFromEnv(provider: string, geminiKey: string | undefined, openAiKey: string | undefined) {
  const normalized = normalizeText(provider).toLowerCase();
  if (normalized && !["gemini", "openai"].includes(normalized)) {
    return { error: `Provedor de IA inválido: ${provider}. Use gemini ou openai.` };
  }
  if (normalized === "gemini") return { provider: "gemini" };
  if (normalized === "openai") return { provider: "openai" };
  return { provider: geminiKey ? "gemini" : openAiKey ? "openai" : "" };
}

async function generateWithOpenAi(
  openAiKey: string,
  model: string,
  instructions: string,
  message: string,
  context: Record<string, unknown>
) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openAiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      instructions,
      input: `Pergunta do usuário:\n${message}\n\nContexto real disponível:\n${JSON.stringify(context, null, 2)}`,
      max_output_tokens: 1000,
      store: false,
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    const error = payload.error as { message?: string } | undefined;
    throw new Error(error?.message || "A OpenAI não conseguiu responder.");
  }

  return {
    answer: extractOpenAiText(payload),
    usage: payload.usage || null,
  };
}

async function generateWithGemini(
  geminiKey: string,
  model: string,
  instructions: string,
  message: string,
  context: Record<string, unknown>
) {
  const normalizedModel = model.startsWith("models/") ? model : `models/${model}`;
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/${normalizedModel}:generateContent?key=${encodeURIComponent(geminiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: instructions }],
        },
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Pergunta do usuário:\n${message}\n\nContexto real disponível:\n${JSON.stringify(context, null, 2)}`,
              },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 1600,
          thinkingConfig: {
            thinkingLevel: "low",
          },
        },
      }),
    }
  );

  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    const error = payload.error as { message?: string } | undefined;
    throw new Error(error?.message || "O Gemini não conseguiu responder.");
  }
  const finish = geminiFinishReason(payload);
  if (finish.reason && finish.reason !== "STOP") {
    const detail =
      finish.reason === "MAX_TOKENS"
        ? "A IA interrompeu a resposta por limite de saída. Tente uma pergunta mais específica."
        : finish.message || `A IA interrompeu a resposta: ${finish.reason}.`;
    throw new Error(detail);
  }

  return {
    answer: extractGeminiText(payload),
    usage: payload.usageMetadata || null,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed", message: "Use POST." }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("HOWL_SERVICE_ROLE_KEY");
  const openAiKey = Deno.env.get("OPENAI_API_KEY");
  const geminiKey = Deno.env.get("GEMINI_API_KEY") || Deno.env.get("GOOGLE_API_KEY");
  const selectedProvider = providerFromEnv(Deno.env.get("AI_PROVIDER") || "", geminiKey, openAiKey);

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse(
      { error: "missing_server_config", message: "Configure HOWL_SERVICE_ROLE_KEY nos Secrets da Edge Function." },
      500
    );
  }
  if (selectedProvider.error) {
    return jsonResponse({ error: "invalid_ai_provider", message: selectedProvider.error }, 500);
  }
  if (!selectedProvider.provider) {
    return jsonResponse(
      { error: "missing_ai_key", message: "Configure GEMINI_API_KEY ou OPENAI_API_KEY nos Secrets da Edge Function." },
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
    .select("id, name, email, role, organization, program_id, active")
    .eq("auth_user_id", caller.id)
    .maybeSingle();

  const callerRole = normalizeText(callerProfile?.role).toLowerCase();
  if (callerProfileError || !callerProfile?.active || !["admin", "cliente", "avaliador", "empreendedor"].includes(callerRole)) {
    return jsonResponse({ error: "forbidden", message: "Usuário ativo necessário para usar o Mentor IA." }, 403);
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "invalid_json", message: "Corpo da requisição inválido." }, 400);
  }

  const message = normalizeText(payload.message);
  const requestedStartupId = normalizeText(payload.startupId);
  const requestedProgramId = normalizeText(payload.programId);
  const route = normalizeText(payload.route);
  if (message.length < 4) {
    return jsonResponse({ error: "empty_message", message: "Digite uma pergunta para o Mentor IA." }, 400);
  }
  if (message.length > 1200) {
    return jsonResponse({ error: "message_too_long", message: "Envie uma pergunta menor para o Mentor IA." }, 400);
  }

  const startupQuery = dbAdminClient
    .from("startups")
    .select("id, program_id, name, founder, sector, city, state, stage, description");
  if (callerRole === "cliente") {
    startupQuery.eq("program_id", callerProfile.program_id);
  } else if (callerRole === "admin" && requestedProgramId) {
    startupQuery.eq("program_id", requestedProgramId);
  }
  const startupsResult = await startupQuery.order("name");
  if (startupsResult.error) {
    return jsonResponse({ error: "context_load_failed", message: "Não foi possível carregar as startups." }, 500);
  }

  let visibleStartupIds = (startupsResult.data || []).map((startup) => startup.id);
  if (callerRole === "avaliador") {
    const linksResult = await dbAdminClient
      .from("mentor_startup_links")
      .select("startup_id")
      .eq("mentor_profile_id", callerProfile.id)
      .eq("status", "active");
    if (linksResult.error) {
      return jsonResponse({ error: "context_load_failed", message: "Não foi possível carregar os vínculos de mentoria." }, 500);
    }
    const linkedIds = new Set((linksResult.data || []).map((link) => link.startup_id));
    visibleStartupIds = visibleStartupIds.filter((startupId) => linkedIds.has(startupId));
  } else if (callerRole === "empreendedor") {
    const profileStartupsResult = await dbAdminClient
      .from("profile_startups")
      .select("startup_id")
      .eq("profile_id", callerProfile.id);
    if (profileStartupsResult.error) {
      return jsonResponse({ error: "context_load_failed", message: "Não foi possível carregar a startup do usuário." }, 500);
    }
    const ownIds = new Set((profileStartupsResult.data || []).map((link) => link.startup_id));
    visibleStartupIds = visibleStartupIds.filter((startupId) => ownIds.has(startupId));
  }
  if (requestedStartupId) {
    visibleStartupIds = visibleStartupIds.includes(requestedStartupId) ? [requestedStartupId] : [];
  }

  const visibleStartups = (startupsResult.data || [])
    .filter((startup) => visibleStartupIds.includes(startup.id))
    .slice(0, 12);
  const scopedStartupIds = visibleStartups.map((startup) => startup.id);

  let sessions: unknown[] = [];
  let tasks: unknown[] = [];
  let feedback: unknown[] = [];
  let assessmentRows: Array<Record<string, unknown>> = [];
  if (scopedStartupIds.length) {
    const [sessionsResult, tasksResult, feedbackResult, assessmentsResult] = await Promise.all([
      dbAdminClient
        .from("mentorship_sessions")
        .select("id, startup_id, mentor_profile_id, status, scheduled_at, duration_minutes, topic, agenda, summary, next_steps")
        .in("startup_id", scopedStartupIds)
        .order("scheduled_at", { ascending: false })
        .limit(20),
      dbAdminClient
        .from("mentorship_tasks")
        .select("id, startup_id, mentor_profile_id, title, description, priority, status, due_date, created_at")
        .in("startup_id", scopedStartupIds)
        .order("created_at", { ascending: false })
        .limit(40),
      dbAdminClient
        .from("mentorship_session_feedback")
        .select("session_id, startup_id, mentor_profile_id, rating, comment, updated_at")
        .in("startup_id", scopedStartupIds)
        .order("updated_at", { ascending: false })
        .limit(20),
      dbAdminClient
        .from("assessment_question_results")
        .select("startup_id, month, year, journey_name, final_score, gap, evaluator_comment")
        .in("startup_id", scopedStartupIds)
        .order("year", { ascending: false })
        .order("month", { ascending: false })
        .limit(80),
    ]);
    if (sessionsResult.error || tasksResult.error || feedbackResult.error) {
      return jsonResponse({ error: "context_load_failed", message: "Não foi possível carregar o contexto de mentoria." }, 500);
    }
    sessions = sessionsResult.data || [];
    tasks = tasksResult.data || [];
    feedback = feedbackResult.data || [];
    assessmentRows = assessmentsResult.error ? [] : assessmentsResult.data || [];
  }

  const profileIds = Array.from(
    new Set([
      ...sessions.map((session) => (session as { mentor_profile_id?: unknown }).mentor_profile_id),
      ...tasks.map((task) => (task as { mentor_profile_id?: unknown }).mentor_profile_id),
      callerProfile.id,
    ].filter(Boolean))
  );
  const profilesResult = profileIds.length
    ? await dbAdminClient.from("profiles").select("id, name, role, organization").in("id", profileIds)
    : { data: [], error: null };
  const profiles = profilesResult.error ? [] : profilesResult.data || [];

  const assessmentSummary = scopedStartupIds.map((startupId) => {
    const rows = assessmentRows.filter((row) => row.startup_id === startupId);
    const period = rows[0] ? `${rows[0].year}-${rows[0].month}` : "";
    const periodRows = rows.filter((row) => `${row.year}-${row.month}` === period);
    const scores = periodRows.map((row) => numberOrNull(row.final_score)).filter((value): value is number => value !== null);
    return {
      startupId,
      period: period || "sem avaliação",
      score: scores.length ? Math.round((average(scores) || 0) * 20) : null,
      weakestJourneys: periodRows
        .map((row) => ({ journey: row.journey_name, score: numberOrNull(row.final_score), gap: row.gap }))
        .filter((row) => row.score !== null)
        .sort((a, b) => (a.score || 0) - (b.score || 0))
        .slice(0, 3),
    };
  });

  const context = {
    generatedAt: new Date().toISOString(),
    route,
    user: {
      id: callerProfile.id,
      name: callerProfile.name,
      role: callerRole,
      organization: callerProfile.organization,
      programId: callerProfile.program_id,
    },
    startups: visibleStartups,
    profiles,
    sessions,
    tasks,
    feedback,
    assessmentSummary,
  };

  const instructions = [
    "Você é o Mentor IA da plataforma HORDA para programas de aceleração e acompanhamento de startups.",
    "Responda em português do Brasil, com tom objetivo, consultivo e prático.",
    "Use apenas os dados enviados no contexto. Se algo não estiver disponível, diga que não há dado suficiente.",
    "Não invente nomes, métricas, avaliações, tarefas, prazos ou fatos externos.",
    "Ajude o usuário a tomar decisões sobre mentoria, tarefas, foco de jornada, riscos e próximos passos.",
    "Não diga que salvou, alterou, notificou ou executou ações. Você apenas orienta.",
    "Prefira respostas curtas: 3 a 6 bullets ou até 2 parágrafos. Quando fizer sentido, termine com um próximo passo prático.",
  ].join("\n");

  const provider = selectedProvider.provider;
  const model =
    provider === "gemini"
      ? Deno.env.get("GEMINI_MODEL") || "gemini-3.6-flash"
      : Deno.env.get("OPENAI_MODEL") || "gpt-5.6-luna";

  let generated: { answer: string; usage: unknown };
  try {
    generated =
      provider === "gemini"
        ? await generateWithGemini(geminiKey || "", model, instructions, message, context)
        : await generateWithOpenAi(openAiKey || "", model, instructions, message, context);
  } catch (error) {
    return jsonResponse(
      {
        error: "ai_request_failed",
        message: error instanceof Error ? error.message : "O Mentor IA não conseguiu responder.",
      },
      502
    );
  }

  if (!generated.answer) {
    return jsonResponse({ error: "empty_answer", message: "O Mentor IA não retornou conteúdo." }, 502);
  }

  return jsonResponse({
    answer: generated.answer,
    provider,
    model,
    usage: generated.usage,
  });
});
