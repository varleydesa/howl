import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type AppRole = "admin" | "cliente" | "avaliador" | "empreendedor";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const allowedRoles = new Set<AppRole>(["admin", "cliente", "avaliador", "empreendedor"]);
const functionVersion = "create-user-2026-07-03-01";

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify({ version: functionVersion, ...body }), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function normalizeEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function normalizeText(value: unknown) {
  return String(value || "").trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed", message: "Use POST." }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("HOWL_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse(
      {
        error: "missing_server_config",
        message: "Configure HOWL_SERVICE_ROLE_KEY nos Secrets da Edge Function.",
      },
      500
    );
  }

  const authHeader = req.headers.get("Authorization") || "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (!jwt) {
    return jsonResponse({ error: "unauthorized", message: "Sessão ausente." }, 401);
  }

  const authAdminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const dbAdminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
      },
    },
  });

  const serviceRoleCheck = await authAdminClient.auth.admin.listUsers({
    page: 1,
    perPage: 1,
  });

  if (serviceRoleCheck.error) {
    return jsonResponse(
      {
        error: "invalid_admin_key",
        message:
          "HOWL_SERVICE_ROLE_KEY não está com permissão administrativa. Confirme que o valor é a legacy service_role API key, não anon/publishable/secret publishable.",
      },
      500
    );
  }

  const {
    data: { user: caller },
    error: callerError,
  } = await authAdminClient.auth.getUser(jwt);

  if (callerError || !caller) {
    return jsonResponse({ error: "unauthorized", message: "Sessão inválida." }, 401);
  }

  const { data: callerProfile, error: callerProfileError } = await dbAdminClient
    .from("profiles")
    .select("id, role, email, program_id")
    .eq("auth_user_id", caller.id)
    .maybeSingle();

  const callerRole = normalizeText(callerProfile?.role).toLowerCase();
  const callerProgramId = normalizeText(callerProfile?.program_id);
  const callerIsClient = callerRole === "cliente";

  if (callerProfileError || !["admin", "cliente"].includes(callerRole)) {
    return jsonResponse(
      {
        error: "forbidden",
        message:
          callerProfileError?.message ||
          `Apenas administradores e clientes podem criar usuários. Perfil detectado: ${callerRole || "não encontrado"}.`,
      },
      403
    );
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "invalid_json", message: "Corpo da requisição inválido." }, 400);
  }

  const name = normalizeText(payload.name);
  const email = normalizeEmail(payload.email);
  const password = String(payload.password || "");
  const role = normalizeText(payload.role) as AppRole;
  const organization = normalizeText(payload.organization);
  const startupId = normalizeText(payload.startupId);
  const programId = normalizeText(payload.programId);

  if (!name) {
    return jsonResponse({ error: "invalid_name", message: "Informe o nome do usuário." }, 400);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonResponse({ error: "invalid_email", message: "Informe um e-mail válido." }, 400);
  }

  if (!allowedRoles.has(role)) {
    return jsonResponse({ error: "invalid_role", message: "Perfil inválido." }, 400);
  }

  if (callerIsClient && !["avaliador", "empreendedor"].includes(role)) {
    return jsonResponse(
      { error: "forbidden_role", message: "O perfil Cliente pode criar apenas avaliadores e empreendedores." },
      403
    );
  }

  if (password.length < 8) {
    return jsonResponse(
      { error: "weak_password", message: "A senha temporária deve ter pelo menos 8 caracteres." },
      400
    );
  }

  if (role === "empreendedor" && !startupId) {
    return jsonResponse(
      { error: "missing_startup", message: "A startup vinculada é obrigatória para empreendedor." },
      400
    );
  }

  if (["cliente", "avaliador"].includes(role) && !programId) {
    return jsonResponse(
      { error: "missing_program", message: "O programa vinculado é obrigatório para Cliente/Avaliador." },
      400
    );
  }

  let startupProgramId = "";
  if (role === "empreendedor") {
    const { data: startup, error: startupError } = await dbAdminClient
      .from("startups")
      .select("id, program_id")
      .eq("id", startupId)
      .single();

    if (startupError || !startup) {
      return jsonResponse({ error: "startup_not_found", message: "Startup vinculada não encontrada." }, 400);
    }
    startupProgramId = normalizeText(startup.program_id);
  }

  if (["cliente", "avaliador"].includes(role)) {
    const { data: program, error: programError } = await dbAdminClient
      .from("programs")
      .select("id")
      .eq("id", programId)
      .single();

    if (programError || !program) {
      return jsonResponse({ error: "program_not_found", message: "Programa vinculado não encontrado." }, 400);
    }
  }

  const targetProgramId = role === "empreendedor" ? startupProgramId : programId;
  if (callerIsClient && targetProgramId !== callerProgramId) {
    return jsonResponse(
      { error: "program_scope_violation", message: "Você só pode criar usuários vinculados ao seu programa." },
      403
    );
  }

  const { data: createdUser, error: createUserError } = await authAdminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name,
      role,
      organization,
    },
  });

  if (createUserError || !createdUser.user) {
    const message = createUserError?.message || "Não foi possível criar o usuário no Supabase Auth.";
    const status = message.toLowerCase().includes("already") ? 409 : 400;
    return jsonResponse({ error: "auth_create_failed", message }, status);
  }

  const authUser = createdUser.user;

  const { data: existingProfile } = await dbAdminClient
    .from("profiles")
    .select("id")
    .eq("auth_user_id", authUser.id)
    .maybeSingle();

  const profileId = existingProfile?.id || authUser.id;

  const { data: profile, error: profileError } = await dbAdminClient
    .from("profiles")
    .upsert(
      {
        id: profileId,
        auth_user_id: authUser.id,
        name,
        email,
        role,
        organization: organization || (role === "admin" ? "HOWL" : ""),
        program_id: ["cliente", "avaliador"].includes(role) ? programId : null,
      },
      { onConflict: "id" }
    )
    .select("id, name, email, role, organization, program_id")
    .single();

  if (profileError || !profile) {
    await authAdminClient.auth.admin.deleteUser(authUser.id);
    return jsonResponse(
      {
        error: "profile_create_failed",
        message: profileError?.message || "Usuário criado no Auth, mas o perfil não pôde ser configurado.",
      },
      500
    );
  }

  const { error: deleteLinksError } = await dbAdminClient
    .from("profile_startups")
    .delete()
    .eq("profile_id", profile.id);

  if (deleteLinksError) {
    await authAdminClient.auth.admin.deleteUser(authUser.id);
    return jsonResponse({ error: "startup_link_failed", message: deleteLinksError.message }, 500);
  }

  if (role === "empreendedor") {
    const { error: linkError } = await dbAdminClient
      .from("profile_startups")
      .insert({ profile_id: profile.id, startup_id: startupId });

    if (linkError) {
      await authAdminClient.auth.admin.deleteUser(authUser.id);
      return jsonResponse({ error: "startup_link_failed", message: linkError.message }, 500);
    }
  }

  return jsonResponse({
    user: {
      id: profile.id,
      auth_user_id: authUser.id,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      organization: profile.organization,
      programId: profile.program_id,
      startupIds: role === "empreendedor" ? [startupId] : [],
    },
  });
});
