"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createTeam(formData: FormData) {
  const name = formData.get("name") as string;
  if (!name) return;

  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) return;

  const { data: team, error } = await sb
    .from("teams")
    .insert({
      name,
      owner_id: user.id,
    })
    .select()
    .single();

  if (error || !team) return;

  // Adiciona o criador como membro da equipa
  await sb.from("team_members").insert({
    team_id: team.id,
    user_id: user.id,
    role: "owner",
  });

  revalidatePath("/teams");
}

export async function inviteToTeam(teamId: string, email: string) {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user || !email) return;

  await sb.from("team_invites").insert({
    team_id: teamId,
    email,
    invited_by: user.id,
  });

  revalidatePath("/teams");
}

export async function acceptInvite(inviteId?: string) {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user?.email) return;

  let query = sb
    .from("team_invites")
    .select("*")
    .eq("email", user.email)
    .eq("accepted", false);

  if (inviteId) {
    query = query.eq("id", inviteId);
  }

  const { data: invites } = await query;

  if (!invites || invites.length === 0) return;

  for (const invite of invites) {
    await sb.from("team_members").insert({
      team_id: invite.team_id,
      user_id: user.id,
    });

    await sb
      .from("team_invites")
      .update({ accepted: true })
      .eq("id", invite.id);
  }

  revalidatePath("/teams");
}

export async function leaveTeam(teamId: string) {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) return;

  await sb
    .from("team_members")
    .delete()
    .eq("team_id", teamId)
    .eq("user_id", user.id);

  revalidatePath("/teams");
}
