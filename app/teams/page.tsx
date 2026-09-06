import { createClient } from "@/lib/supabase/server";
import { inviteToTeam } from "./actions";

async function getTeams() {
  const sb = await createClient();
  const { data: user } = await sb.auth.getUser();

  if (!user?.user) return { teams: [], memberships: [] };

  const { data: teams } = await sb
    .from("teams")
    .select("id, name")
    .eq("owner_id", user.user.id);

  const { data: memberships } = await sb
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.user.id);

  return { teams: teams || [], memberships: memberships || [] };
}

export default async function TeamsPage() {
  const { teams } = await getTeams();

  async function handleInvite(formData: FormData) {
    "use server";
    const email = formData.get("email") as string;
    const teamId = formData.get("teamId") as string;
    await inviteToTeam(teamId, email);
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Equipas</h1>

      {teams.length === 0 && (
        <p className="text-gray-500">Ainda não tens equipas criadas.</p>
      )}

      {teams.map((team) => (
        <div
          key={team.id}
          className="border rounded-lg p-4 mb-6 bg-white shadow-sm"
        >
          <h2 className="text-xl font-semibold mb-2">{team.name}</h2>

          <form action={handleInvite} className="flex gap-2 mt-4">
            <input type="hidden" name="teamId" value={team.id} />

            <input
              type="email"
              name="email"
              placeholder="Email do treinador"
              className="border p-2 rounded flex-1"
              required
            />

            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Convidar
            </button>
          </form>
        </div>
      ))}
    </div>
  );
}
