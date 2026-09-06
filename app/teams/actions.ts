"use server";

import { createClient } from "@/lib/supabase/server";

export async function inviteToTeam(teamId: string, email: string) {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) return;

  await sb.from("team_invites").insert({
    team_id: teamId,
    email,
    invited_by: user.id,
  });
}

export async function acceptInvite() {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user?.email) return;

  const { data: invites } = await sb
    .from("team_invites")
    .select("*")
    .eq("email", user.email)
    .eq("accepted", false);

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
}
