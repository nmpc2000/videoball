import { createClient } from "@/lib/supabase/server";
import {
  createTeam,
  inviteToTeam,
  acceptInvite,
  leaveTeam,
} from "./actions";
import Link from "next/link";
import { ArrowLeft, Users, Plus, Mail, Check, LogOut } from "lucide-react";

interface Team {
  id: string;
  name: string;
  owner_id: string;
}

interface Invite {
  id: string;
  team_id: string;
  email: string;
  teams?: { name: string } | null;
}

async function getTeamsData() {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) return { user: null, teams: [] as Team[], invites: [] as Invite[] };

  const { data: teams } = await sb
    .from("teams")
    .select("id, name, owner_id")
    .order("created_at", { ascending: false });

  const { data: invites } = await sb
    .from("team_invites")
    .select("id, team_id, email, teams(name)")
    .eq("email", user.email || "")
    .eq("accepted", false);

  return {
    user,
    teams: (teams || []) as Team[],
    invites: (invites || []) as unknown as Invite[],
  };
}

export default async function TeamsPage() {
  const { user, teams, invites } = await getTeamsData();

  async function handleInvite(formData: FormData) {
    "use server";
    const email = formData.get("email") as string;
    const teamId = formData.get("teamId") as string;
    await inviteToTeam(teamId, email);
  }

  async function handleAccept(formData: FormData) {
    "use server";
    const inviteId = formData.get("inviteId") as string;
    await acceptInvite(inviteId);
  }

  async function handleLeave(formData: FormData) {
    "use server";
    const teamId = formData.get("teamId") as string;
    await leaveTeam(teamId);
  }

  return (
    <main
      className="content"
      style={{
        minHeight: "100vh",
        maxWidth: "800px",
        margin: "0 auto",
        padding: "40px 20px",
      }}
    >
      <header className="topbar" style={{ marginBottom: "24px" }}>
        <Link
          href="/dashboard"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "#aab1bc",
          }}
        >
          <ArrowLeft size={18} /> Voltar ao Dashboard
        </Link>
      </header>

      <h1
        style={{
          fontSize: "28px",
          fontWeight: "bold",
          marginBottom: "24px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <Users size={28} /> Equipas
      </h1>

      {/* Secção de Convites Pendentes */}
      {invites && invites.length > 0 && (
        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "18px", color: "#8d96a6", marginBottom: "12px" }}>
            Convites Pendentes
          </h2>
          <div style={{ display: "grid", gap: "10px" }}>
            {invites.map((inv) => (
              <div
                key={inv.id}
                style={{
                  background: "#171c26",
                  border: "1px solid #29384d",
                  borderRadius: "12px",
                  padding: "16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <b>{inv.teams?.name || "Nova Equipa"}</b>
                  <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#8d96a6" }}>
                    Foste convidado para esta equipa
                  </p>
                </div>
                <form action={handleAccept}>
                  <input type="hidden" name="inviteId" value={inv.id} />
                  <button
                    type="submit"
                    className="primary"
                    style={{ background: "#22c55e", color: "#fff" }}
                  >
                    <Check size={16} /> Aceitar
                  </button>
                </form>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Criar Nova Equipa */}
      <section style={{ marginBottom: "32px" }}>
        <form
          action={createTeam}
          style={{
            background: "#111318",
            border: "1px solid #242932",
            borderRadius: "14px",
            padding: "20px",
            display: "flex",
            gap: "10px",
          }}
        >
          <input
            type="text"
            name="name"
            placeholder="Nome da nova equipa..."
            style={{
              background: "#191c22",
              border: "1px solid #2b3039",
              color: "#fff",
              borderRadius: "9px",
              padding: "10px 14px",
              flex: 1,
            }}
            required
          />
          <button type="submit" className="primary">
            <Plus size={18} /> Criar Equipa
          </button>
        </form>
      </section>

      {/* Lista de Equipas */}
      <div style={{ display: "grid", gap: "16px" }}>
        {teams.length === 0 ? (
          <div className="empty">
            <h2>Ainda não tens equipas.</h2>
            <p>Cria uma equipa acima para começares a colaborar.</p>
          </div>
        ) : (
          teams.map((team) => (
            <div
              key={team.id}
              style={{
                background: "#111318",
                border: "1px solid #242932",
                borderRadius: "14px",
                padding: "20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "16px",
                }}
              >
                <h2 style={{ fontSize: "18px", fontWeight: 600, margin: 0 }}>
                  {team.name}
                </h2>
                {team.owner_id !== user?.id && (
                  <form action={handleLeave}>
                    <input type="hidden" name="teamId" value={team.id} />
                    <button
                      type="submit"
                      className="ghost"
                      style={{ color: "#ef4444", borderColor: "#7f1d1d" }}
                    >
                      <LogOut size={16} /> Sair
                    </button>
                  </form>
                )}
              </div>

              {/* Form de Convidar */}
              <form action={handleInvite} style={{ display: "flex", gap: "10px" }}>
                <input type="hidden" name="teamId" value={team.id} />
                <input
                  type="email"
                  name="email"
                  placeholder="Email do treinador a convidar..."
                  style={{
                    background: "#191c22",
                    border: "1px solid #2b3039",
                    color: "#fff",
                    borderRadius: "9px",
                    padding: "10px 14px",
                    flex: 1,
                  }}
                  required
                />
                <button type="submit" className="primary">
                  <Mail size={16} /> Convidar
                </button>
              </form>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
