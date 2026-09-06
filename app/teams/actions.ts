"use server";

import { createClient } from "@/lib/supabase/server";

export async function inviteToTeam(teamId: string, email: string) {
  const sb = await createClient();
  const { data: user } = await sb.auth.getUser();

  if (!user?.user) return;

  await sb.from("team_invites").insert({
    team_id: teamId,
    email,
    invited_by: user.user.id,
  });
}

export async function acceptInvite() {
  const sb = await createClient();
  const { data: user } = await sb.auth.getUser();

  if (!user?.user) return;

  const { data: invites } = await sb
    .from("team_invites")
    .select("*")
    .eq("email", user.user.email)
    .eq("accepted", false);

  if (!invites?.length) return;

  for (const invite of invites) {
    await sb.from("team_members").insert({
      team_id: invite.team_id,
      user_id: user.user.id,
    });

    await sb
      .from("team_invites")
      .update({ accepted: true })
      .eq("id", invite.id);
  }
}
