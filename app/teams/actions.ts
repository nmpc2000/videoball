"use server";

import { createClient } from "@/lib/supabase/server";

export async function createTeam(name: string) {
  const sb = await createClient();

  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "Não estás autenticado.",
    };
  }

  const cleanName = name.trim();

  if (!cleanName) {
    return {
      success: false,
      error: "Indica um nome para a equipa.",
    };
  }

  const { data: team, error } = await sb
    .from("teams")
    .insert({
      name: cleanName,
      owner_id: user.id,
    })
    .select("id, name")
    .single();

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  // O dono também é automaticamente membro da equipa
  const { error: memberError } = await sb.from("team_members").insert({
    team_id: team.id,
    user_id: user.id,
    role: "owner",
  });

  if (memberError) {
    // Se falhar, tentamos apagar a equipa criada
    await sb.from("teams").delete().eq("id", team.id);

    return {
      success: false,
      error: memberError.message,
    };
  }

  return {
    success: true,
    team,
  };
}

export async function inviteToTeam(teamId: string, email: string) {
  const sb = await createClient();

  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "Não estás autenticado.",
    };
  }

  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail) {
    return {
      success: false,
      error: "Indica um email.",
    };
  }

  // Confirmar que o utilizador é dono da equipa
  const { data: team, error: teamError } = await sb
    .from("teams")
    .select("id, owner_id")
    .eq("id", teamId)
    .single();

  if (teamError || !team) {
    return {
      success: false,
      error: "Equipa não encontrada.",
    };
  }

  if (team.owner_id !== user.id) {
    return {
      success: false,
      error: "Só o dono da equipa pode convidar membros.",
    };
  }

  // Não permitir convidar o próprio dono
  if (cleanEmail === user.email?.toLowerCase()) {
    return {
      success: false,
      error: "Não podes convidar-te a ti próprio.",
    };
  }

  // Verificar se o email já tem conta e já pertence à equipa
  const { data: existingProfile } = await sb
    .from("profiles")
    .select("id")
    .eq("email", cleanEmail)
    .maybeSingle();

  if (existingProfile) {
    const { data: existingMember } = await sb
      .from("team_members")
      .select("id")
      .eq("team_id", teamId)
      .eq("user_id", existingProfile.id)
      .maybeSingle();

    if (existingMember) {
      return {
        success: false,
        error: "Este utilizador já pertence à equipa.",
      };
    }
  }

  // Verificar se já existe convite pendente
  const { data: existingInvite } = await sb
    .from("team_invites")
    .select("id")
    .eq("team_id", teamId)
    .eq("email", cleanEmail)
    .eq("accepted", false)
    .maybeSingle();

  if (existingInvite) {
    return {
      success: false,
      error: "Já existe um convite pendente para este email.",
    };
  }

  const { error } = await sb.from("team_invites").insert({
    team_id: teamId,
    email: cleanEmail,
    invited_by: user.id,
  });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
  };
}

export async function acceptInvite(inviteId: string) {
  const sb = await createClient();

  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "Não estás autenticado.",
    };
  }

  const { data: invite, error: inviteError } = await sb
    .from("team_invites")
    .select("*")
    .eq("id", inviteId)
    .eq("accepted", false)
    .single();

  if (inviteError || !invite) {
    return {
      success: false,
      error: "Convite não encontrado ou já aceite.",
    };
  }

  if (invite.email.toLowerCase() !== user.email?.toLowerCase()) {
    return {
      success: false,
      error: "Este convite não pertence ao teu email.",
    };
  }

  // Verificar se já é membro
  const { data: existingMember } = await sb
    .from("team_members")
    .select("id")
    .eq("team_id", invite.team_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existingMember) {
    const { error: memberError } = await sb.from("team_members").insert({
      team_id: invite.team_id,
      user_id: user.id,
      role: "analyst",
    });

    if (memberError) {
      return {
        success: false,
        error: memberError.message,
      };
    }
  }

  const { error: updateError } = await sb
    .from("team_invites")
    .update({
      accepted: true,
      accepted_at: new Date().toISOString(),
    })
    .eq("id", invite.id);

  if (updateError) {
    return {
      success: false,
      error: updateError.message,
    };
  }

  return {
    success: true,
  };
}

export async function leaveTeam(teamId: string) {
  const sb = await createClient();

  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "Não estás autenticado.",
    };
  }

  const { data: team } = await sb
    .from("teams")
    .select("owner_id")
    .eq("id", teamId)
    .single();

  if (team?.owner_id === user.id) {
    return {
      success: false,
      error:
        "O dono da equipa não pode sair. Para já, só podes eliminar a equipa.",
    };
  }

  const { error } = await sb
    .from("team_members")
    .delete()
    .eq("team_id", teamId)
    .eq("user_id", user.id);

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
  };
}
