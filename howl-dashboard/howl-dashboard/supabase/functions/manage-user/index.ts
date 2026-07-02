import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type AppRole = "admin" | "cliente" | "avaliador" | "empreendedor";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const allowedRoles = new Set<AppRole>(["admin", "cliente", "avaliador", "empreendedor"]);
const functionVersion = "manage-user-2026-07-04-01";

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify({ version: functionVersion, ...body }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeText(value: unknown) {
  return String(value || "").trim();
}

function normalizeEmail(value: unknown) {
  return normalizeText(value).toLowerCase();
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
  const callerProgramId = normalizeText(callerProfile?.program_id);
  const callerIsClient = callerRole === "cliente";
  if (
    callerProfileError ||
    !callerProfile?.active ||
    !["admin", "cliente"].includes(callerRole)
  ) {
    return jsonResponse(
      { error: "forbidden", message: "Apenas Admin ou Cliente ativo pode gerenciar usuários." },
      403
    );
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "invalid_json", message: "Corpo da requisição inválido." }, 400);
  }

  const action = normalizeText(payload.action).toLowerCase() || "update";
  const profileId = normalizeText(payload.profileId);
  if (!profileId) {
    return jsonResponse({ error: "missing_profile", message: "Informe o usuário." }, 400);
  }

  const { data: target, error: targetError } = await dbAdminClient
    .from("profiles")
    .select("id, auth_user_id, name, email, role, organization, program_id, active")
    .eq("id", profileId)
    .maybeSingle();
  if (targetError || !target) {
    return jsonResponse({ error: "profile_not_found", message: "Usuário não encontrado." }, 404);
  }

  let targetProgramId = normalizeText(target.program_id);
  if (!targetProgramId && target.role === "empreendedor") {
    const { data: link } = await dbAdminClient
      .from("profile_startups")
      .select("startup_id")
      .eq("profile_id", target.id)
      .maybeSingle();
    if (link?.startup_id) {
      const { data: startup } = await dbAdminClient
        .from("startups")
        .select("program_id")
        .eq("id", link.startup_id)
        .maybeSingle();
      targetProgramId = normalizeText(startup?.program_id);
    }
  }

  if (
    callerIsClient &&
    (!["avaliador", "empreendedor"].includes(target.role) || targetProgramId !== callerProgramId)
  ) {
    return jsonResponse(
      { error: "program_scope_violation", message: "Você só pode gerenciar usuários do seu programa." },
      403
    );
  }

  if (action === "deactivate") {
    if (target.id === callerProfile.id) {
      return jsonResponse(
        { error: "cannot_deactivate_self", message: "Você não pode inativar a própria conta." },
        400
      );
    }
    if (!target.active) {
      return jsonResponse({ user: { id: target.id, active: false } });
    }

    if (target.auth_user_id) {
      const { error: banError } = await authAdminClient.auth.admin.updateUserById(
        target.auth_user_id,
        { ban_duration: "876000h" }
      );
      if (banError) {
        return jsonResponse({ error: "auth_deactivate_failed", message: banError.message }, 400);
      }
    }

    const { error: deactivateError } = await dbAdminClient
      .from("profiles")
      .update({ active: false })
      .eq("id", target.id);
    if (deactivateError) {
      if (target.auth_user_id) {
        await authAdminClient.auth.admin.updateUserById(target.auth_user_id, {
          ban_duration: "none",
        });
      }
      return jsonResponse(
        { error: "profile_deactivate_failed", message: deactivateError.message },
        500
      );
    }
    return jsonResponse({ user: { id: target.id, active: false } });
  }

  if (action !== "update") {
    return jsonResponse({ error: "invalid_action", message: "Ação inválida." }, 400);
  }
  if (!target.active) {
    return jsonResponse({ error: "inactive_user", message: "Usuários inativos não podem ser alterados." }, 400);
  }

  const name = normalizeText(payload.name);
  const email = normalizeEmail(payload.email);
  const role = normalizeText(payload.role) as AppRole;
  const organization = normalizeText(payload.organization);
  const startupId = normalizeText(payload.startupId);
  const programId = normalizeText(payload.programId);

  if (!name) return jsonResponse({ error: "invalid_name", message: "Informe o nome." }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonResponse({ error: "invalid_email", message: "Informe um e-mail válido." }, 400);
  }
  if (!allowedRoles.has(role)) {
    return jsonResponse({ error: "invalid_role", message: "Perfil inválido." }, 400);
  }
  if (callerIsClient && !["avaliador", "empreendedor"].includes(role)) {
    return jsonResponse(
      { error: "forbidden_role", message: "Cliente pode gerenciar apenas Avaliadores e Empreendedores." },
      403
    );
  }
  if (target.id === callerProfile.id && role !== target.role) {
    return jsonResponse(
      { error: "cannot_change_own_role", message: "Você não pode alterar o perfil da própria conta." },
      400
    );
  }

  let nextProgramId = "";
  if (role === "empreendedor") {
    if (!startupId) {
      return jsonResponse({ error: "missing_startup", message: "Selecione a startup." }, 400);
    }
    const { data: startup, error: startupError } = await dbAdminClient
      .from("startups")
      .select("id, program_id")
      .eq("id", startupId)
      .maybeSingle();
    if (startupError || !startup) {
      return jsonResponse({ error: "startup_not_found", message: "Startup não encontrada." }, 400);
    }
    nextProgramId = normalizeText(startup.program_id);
  } else if (["cliente", "avaliador"].includes(role)) {
    if (!programId) {
      return jsonResponse({ error: "missing_program", message: "Selecione o programa." }, 400);
    }
    const { data: program, error: programError } = await dbAdminClient
      .from("programs")
      .select("id")
      .eq("id", programId)
      .maybeSingle();
    if (programError || !program) {
      return jsonResponse({ error: "program_not_found", message: "Programa não encontrado." }, 400);
    }
    nextProgramId = programId;
  }

  if (callerIsClient && nextProgramId !== callerProgramId) {
    return jsonResponse(
      { error: "program_scope_violation", message: "O usuário deve permanecer no seu programa." },
      403
    );
  }

  if (target.auth_user_id) {
    const { error: authUpdateError } = await authAdminClient.auth.admin.updateUserById(
      target.auth_user_id,
      {
        email,
        email_confirm: true,
        user_metadata: { name, role, organization },
      }
    );
    if (authUpdateError) {
      return jsonResponse({ error: "auth_update_failed", message: authUpdateError.message }, 400);
    }
  }

  const { data: profile, error: profileError } = await dbAdminClient
    .from("profiles")
    .update({
      name,
      email,
      role,
      organization,
      program_id: ["cliente", "avaliador"].includes(role) ? programId : null,
    })
    .eq("id", target.id)
    .select("id, name, email, role, organization, program_id, active")
    .single();
  if (profileError || !profile) {
    return jsonResponse(
      { error: "profile_update_failed", message: profileError?.message || "Falha ao alterar o perfil." },
      500
    );
  }

  const { error: deleteLinksError } = await dbAdminClient
    .from("profile_startups")
    .delete()
    .eq("profile_id", target.id);
  if (deleteLinksError) {
    return jsonResponse({ error: "startup_link_failed", message: deleteLinksError.message }, 500);
  }
  if (role === "empreendedor") {
    const { error: linkError } = await dbAdminClient
      .from("profile_startups")
      .insert({ profile_id: target.id, startup_id: startupId });
    if (linkError) {
      return jsonResponse({ error: "startup_link_failed", message: linkError.message }, 500);
    }
  }

  return jsonResponse({
    user: {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      organization: profile.organization,
      programId: profile.program_id,
      startupIds: role === "empreendedor" ? [startupId] : [],
      active: profile.active,
    },
  });
});
