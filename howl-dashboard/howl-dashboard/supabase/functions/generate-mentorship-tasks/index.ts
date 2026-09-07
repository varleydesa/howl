import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const functionVersion = "generate-mentorship-tasks-2026-09-07-01";

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
      input: `Contexto real da mentoria HORDA:\n${JSON.stringify(context, null, 2)}`,
      max_output_tokens: 1400,
      store: false,
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    const error = payload.error as { message?: string } | undefined;
    throw new Error(error?.message || "A OpenAI não conseguiu gerar as tarefas.");
  }

  return {
    text: extractOpenAiText(payload),
    usage: payload.usage || null,
  };
}

async function generateWithGemini(
  geminiKey: string,
  model: string,
  instructions: string,
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
                text: `Contexto real da mentoria HORDA:\n${JSON.stringify(context, null, 2)}`,
              },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 1800,
          responseMimeType: "application/json",
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
    throw new Error(error?.message || "O Gemini não conseguiu gerar as tarefas.");
  }
  const finish = geminiFinishReason(payload);
  if (finish.reason && finish.reason !== "STOP") {
    const detail =
      finish.reason === "MAX_TOKENS"
        ? "A IA interrompeu as tarefas por limite de saída. Tente gerar novamente."
        : finish.message || `A IA interrompeu a resposta: ${finish.reason}.`;
    throw new Error(detail);
  }

  return {
    text: extractGeminiText(payload),
    usage: payload.usageMetadata || null,
  };
}

function stripJsonFences(value: string) {
  return value
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function parseTaskPayload(text: string) {
  const cleaned = stripJsonFences(text);
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  const jsonText = start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;
  const parsed = JSON.parse(jsonText) as { tasks?: unknown };
  return Array.isArray(parsed.tasks) ? parsed.tasks : [];
}

function sanitizeTasks(tasks: unknown[]) {
  return tasks
    .map((task) => {
      const item = task as { title?: unknown; description?: unknown; priority?: unknown; dueDate?: unknown };
      const title = normalizeText(item.title).slice(0, 140);
      if (!title) return null;
      const priority = ["high", "medium", "low"].includes(String(item.priority)) ? String(item.priority) : "medium";
      const rawDueDate = normalizeText(item.dueDate);
      const dueDate = /^\d{4}-\d{2}-\d{2}$/.test(rawDueDate) ? rawDueDate : null;
      return {
        title,
        description: normalizeText(item.description).slice(0, 700),
        priority,
        dueDate,
      };
    })
    .filter(Boolean)
    .slice(0, 5);
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
  if (selectedProvider.provider === "gemini" && !geminiKey) {
    return jsonResponse({ error: "missing_gemini_key", message: "Configure GEMINI_API_KEY nos Secrets da Edge Function." }, 500);
  }
  if (selectedProvider.provider === "openai" && !openAiKey) {
    return jsonResponse({ error: "missing_openai_key", message: "Configure OPENAI_API_KEY nos Secrets da Edge Function." }, 500);
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
      { error: "forbidden", message: "Apenas gestores e mentores ativos podem gerar tarefas com IA." },
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

  const [startupResult, programResult, mentorResult, tasksResult, sessionsResult, feedbackResult, assessmentsResult] =
    await Promise.all([
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
        .order("scheduled_at", { ascending: false })
        .limit(6),
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
  const finalScores = latestAssessmentRows
    .map((row) => numberOrNull(row.final_score))
    .filter((value): value is number => value !== null);
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
    generatedAt: new Date().toISOString().slice(0, 10),
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
    openTasks: (tasksResult.data || []).slice(0, 10),
    recentSessions: sessionsResult.data || [],
    recentFeedback: feedbackResult.error ? [] : feedbackResult.data || [],
  };

  const instructions = [
    "Você é um assistente de mentoria para programas de aceleração da plataforma HORDA.",
    "Gere tarefas pós-sessão em português do Brasil para serem revisadas por um mentor humano antes do salvamento.",
    "Use apenas os dados enviados. Não invente métricas, nomes, notas, reuniões ou fatos externos.",
    "Crie de 3 a 5 tarefas objetivas, acionáveis e úteis para a startup executar após a mentoria.",
    "Evite duplicar tarefas abertas já existentes. Se uma tarefa aberta precisar continuar, proponha um desdobramento mais específico.",
    "Quando houver prazo explícito no contexto, respeite-o. Caso contrário, sugira prazos realistas entre 7 e 21 dias após generatedAt.",
    "Retorne somente JSON válido, sem Markdown, sem explicações e sem texto fora do objeto.",
    "Formato obrigatório: {\"tasks\":[{\"title\":\"...\",\"description\":\"...\",\"priority\":\"high|medium|low\",\"dueDate\":\"YYYY-MM-DD ou null\"}]}",
  ].join("\n");

  const provider = selectedProvider.provider;
  const model =
    provider === "gemini"
      ? Deno.env.get("GEMINI_MODEL") || "gemini-3.6-flash"
      : Deno.env.get("OPENAI_MODEL") || "gpt-5.6-luna";

  let generated: { text: string; usage: unknown };
  try {
    generated =
      provider === "gemini"
        ? await generateWithGemini(geminiKey || "", model, instructions, context)
        : await generateWithOpenAi(openAiKey || "", model, instructions, context);
  } catch (error) {
    return jsonResponse(
      {
        error: "ai_request_failed",
        message: error instanceof Error ? error.message : "A IA não conseguiu gerar as tarefas.",
      },
      502
    );
  }

  let tasks: unknown[];
  try {
    tasks = sanitizeTasks(parseTaskPayload(generated.text));
  } catch {
    return jsonResponse({ error: "invalid_ai_output", message: "A IA retornou tarefas em formato inválido." }, 502);
  }

  if (!tasks.length) {
    return jsonResponse({ error: "empty_tasks", message: "A IA não retornou tarefas utilizáveis." }, 502);
  }

  return jsonResponse({
    tasks,
    provider,
    model,
    usage: generated.usage,
  });
});
