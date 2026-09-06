import { createClient } from "@/lib/supabase/server";
import { inviteToTeam } from "./actions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Team {
  id: string;
  name: string;
}

async function getTeams() {
  const sb = await createClient();
  const { data: user } = await sb.auth.getUser();

  if (!user?.user) return { teams: [] as Team[] };

  const { data: teams } = await sb
    .from("teams")
    .select("id, name")
    .eq("owner_id", user.user.id);

  return { teams: (teams || []) as Team[] };
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
    <main className="content" style={{ minHeight: "100vh", maxWidth: "800px", margin: "0 auto", padding: "40px 20px" }}>
      <header className="topbar" style={{ marginBottom: "24px" }}>
        <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: "8px", color: "#aab1bc" }}>
          <ArrowLeft size={18} /> Voltar ao Dashboard
        </Link>
      </header>

      <h1 style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "24px" }}>Equipas</h1>

      {teams.length === 0 && (
        <div className="empty">
          <h2>Ainda não tens equipas criadas.</h2>
        </div>
      )}

      <div style={{ display: "grid", gap: "16px" }}>
        {teams.map((team) => (
          <div
            key={team.id}
            style={{
              background: "#111318",
              border: "1px solid #242932",
              borderRadius: "14px",
              padding: "20px"
            }}
          >
            <h2 style={{ fontSize: "18px", fontWeight: 600, margin: "0 0 12px 0" }}>{team.name}</h2>

            <form action={handleInvite} style={{ display: "flex", gap: "10px" }}>
              <input type="hidden" name="teamId" value={team.id} />
              <input
                type="email"
                name="email"
                placeholder="Email do treinador"
                style={{
                  background: "#191c22",
                  border: "1px solid #2b3039",
                  color: "#fff",
                  borderRadius: "9px",
                  padding: "10px 14px",
                  flex: 1
                }}
                required
              />
              <button type="submit" className="primary">
                Convidar
              </button>
            </form>
          </div>
        ))}
      </div>
    </main>
  );
}
