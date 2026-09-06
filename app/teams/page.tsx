import { inviteToTeam } from "./actions";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

async function getData() {
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies }
  );

  const { data: user } = await sb.auth.getUser();

  const { data: teams } = await sb
    .from("teams")
    .select("id, name")
    .eq("owner_id", user.user?.id);

  const { data: memberships } = await sb
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.user?.id);

  return { teams, memberships };
}

export default async function TeamsPage() {
  const { teams } = await getData();

  async function handleInvite(formData: FormData) {
    "use server";
    const email = formData.get("email") as string;
    const teamId = formData.get("teamId") as string;
    await inviteToTeam(teamId, email);
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Equipas</h1>

      {teams?.map(team => (
        <div key={team.id} className="border p-4 rounded mb-4">
          <h2 className="text-xl font-semibold">{team.name}</h2>

          <form action={handleInvite} className="mt-4 flex gap-2">
            <input
              type="hidden"
              name="teamId"
              value={team.id}
            />
            <input
              type="email"
              name="email"
              placeholder="Email do treinador"
              className="border p-2 rounded flex-1"
              required
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Convidar
            </button>
          </form>
        </div>
      ))}
    </div>
  );
}
