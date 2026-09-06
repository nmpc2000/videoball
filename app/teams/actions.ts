"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function supabase() {
  const cookieStore = cookies(); // Next 16: sem await

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        }
      }
    }
  );
}

export async function inviteToTeam(teamId: string, email: string) {
  const sb = supabase();
  const { data: user } = await sb.auth.getUser();

  await sb.from("team_invites").insert({
    team_id: teamId,
    email,
    invited_by: user.user?.id
  });
}

export async function acceptInvite() {
  const sb = supabase();
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
      user_id: user.user.id
    });

    await sb
      .from("team_invites")
      .update({ accepted: true })
      .eq("id", invite.id);
  }
}
