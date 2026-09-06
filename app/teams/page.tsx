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
  created_at: string;
}

interface Member {
  id: string;
  user_id: string;
  role: string;
  profile?: {
    full_name: string | null;
    email: string | null;
  } | null;
}

interface Invite {
  id: string;
  team_id: string;
  email: string;
  accepted: boolean;
  created_at: string;
  team?: {
    id: string;
    name: string;
  } | null;
}

async function getData() {
  const sb = await createClient();

  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) {
    return {
      user: null,
      teams: [] as Team[],
      members: {} as Record<string, Member[]>,
      invites: [] as Invite[],
    };
  }

  // Equipas onde sou dono
  const { data: ownedTeams } = await sb
    .from("teams")
    .select("id, name, owner_id, created_at")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  // Equipas onde sou membro
  const { data: memberships } = await sb
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id);

  const memberTeamIds =
    memberships?.map((membership) => membership.team_id) || [];

  let memberTeams: Team[] = [];

  if (memberTeamIds.length > 0) {
    const { data } = await sb
      .from("teams")
      .select("id, name, owner_id, created_at")
      .in("id", memberTeamIds)
      .order("created_at", { ascending: false });

    memberTeams = data || [];
  }

  // Juntar sem duplicados
  const allTeams = [...(ownedTeams || []), ...memberTeams];

  const teams = Array.from(
    new Map(allTeams.map((team) => [team.id, team])).values()
  );

  // Buscar membros de cada equipa
  const members: Record<string, Member[]> = {};

  for (const team of teams) {
    const { data: teamMembers } = await sb
      .from("team_members")
      .select(
        `
        id,
        user_id,
        role,
        profiles (
          full_name,
          email
        )
      `
      )
      .eq("team_id", team.id)
      .order("created_at", { ascending: true });

    members[team.id] = (teamMembers || []).map((member: any) => ({
      id: member.id,
      user_id: member.user_id,
      role: member.role,
      profile: Array.isArray(member.profiles)
        ? member.profiles[0] || null
        : member.profiles || null,
    }));
  }

  // Convites recebidos
  const { data: invites } = await sb
    .from("team_invites")
    .select(
      `
      id,
      team_id,
      email,
      accepted,
      created_at,
      teams (
        id,
        name
      )
    `
    )
    .eq("email", user.email?.toLowerCase() || "")
    .eq("accepted", false)
    .order("created_at", { ascending: false });

  const formattedInvites = (invites || []).map((invite: any) => ({
    id: invite.id,
    team_id: invite.team_id,
    email: invite.email,
    accepted: invite.accepted,
    created_at: invite.created_at,
    team: Array.isArray(invite.teams)
      ? invite.teams[0] || null
      : invite.teams || null,
  }));

  return {
    user,
    teams,
    members,
    invites: formattedInvites,
  };
}

export default async function TeamsPage() {
  const { user, teams, members, invites } = await getData();

  async function handleCreateTeam(formData: FormData) {
    "use server";

    const name = String(formData.get("name") || "");

    await createTeam(name);
  }

  async function handleInvite(formData: FormData) {
    "use server";

    const teamId = String(formData.get("teamId") || "");
    const email = String(formData.get("email") || "");

    await inviteToTeam(teamId, email);
  }

  async function handleAcceptInvite(formData: FormData) {
    "use server";

    const inviteId = String(formData.get("inviteId") || "");

    await acceptInvite(inviteId);
  }

  async function handleLeaveTeam(formData: FormData) {
    "use server";

    const teamId = String(formData.get("teamId") || "");

    await leaveTeam(teamId);
  }

  if (!user) {
    return (
      <main
        className="content"
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div className="empty">
          <h2>Tens de iniciar sessão.</h2>
          <Link href="/auth" className="primary">
            Entrar
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main
      className="content"
      style={{
        minHeight: "100vh",
        maxWidth: "1000px",
        margin: "0 auto",
        padding: "40px 20px 80px",
      }}
    >
      {/* HEADER */}
      <header
        className="topbar"
        style={{
          marginBottom: "35px",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Link
          href="/dashboard"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "#aab1bc",
            textDecoration: "none",
          }}
        >
          <ArrowLeft size={18} />
          Voltar ao Dashboard
        </Link>
      </header>

      {/* TITLE */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "34px",
              fontWeight: 700,
              margin: 0,
            }}
          >
            Equipas
          </h1>

          <p
            style={{
              color: "#8e96a3",
              marginTop: "8px",
              marginBottom: 0,
            }}
          >
            Gere as tuas equipas e trabalha em conjunto com outros analistas.
          </p>
        </div>
      </div>

      {/* CREATE TEAM */}
      <section
        style={{
          background: "#111318",
          border: "1px solid #242932",
          borderRadius: "16px",
          padding: "24px",
          marginBottom: "25px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "18px",
          }}
        >
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              background: "#1b1f27",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Plus size={20} />
          </div>

          <div>
            <h2
              style={{
                margin: 0,
                fontSize: "18px",
              }}
            >
              Criar nova equipa
            </h2>

            <p
              style={{
                margin: "4px 0 0",
                color: "#7f8794",
                fontSize: "14px",
              }}
            >
              Cria uma equipa para poderes partilhar jogos e análises.
            </p>
          </div>
        </div>

        <form
          action={handleCreateTeam}
          style={{
            display: "flex",
            gap: "10px",
          }}
        >
          <input
            type="text"
            name="name"
            placeholder="Nome da equipa, ex.: SC Braga Sub-15"
            required
            style={{
              flex: 1,
              background: "#191c22",
              border: "1px solid #2b3039",
              color: "#fff",
              borderRadius: "9px",
              padding: "12px 14px",
              outline: "none",
            }}
          />

          <button
            type="submit"
            className="primary"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
            }}
          >
            <Plus size={17} />
            Criar equipa
          </button>
        </form>
      </section>

      {/* PENDING INVITES */}
      {invites.length > 0 && (
        <section
          style={{
            background: "#111318",
            border: "1px solid #313741",
            borderRadius: "16px",
            padding: "24px",
            marginBottom: "25px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "18px",
            }}
          >
            <Mail size={20} />

            <h2
              style={{
                margin: 0,
                fontSize: "19px",
              }}
            >
              Convites pendentes
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gap: "12px",
            }}
          >
            {invites.map((invite) => (
              <div
                key={invite.id}
                style={{
                  background: "#191c22",
                  border: "1px solid #2b3039",
                  borderRadius: "12px",
                  padding: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "15px",
                }}
              >
                <div>
                  <strong>
                    {invite.team?.name || "Equipa"}
                  </strong>

                  <div
                    style={{
                      color: "#8e96a3",
                      fontSize: "13px",
                      marginTop: "4px",
                    }}
                  >
                    Foste convidado para esta equipa.
                  </div>
                </div>

                <form action={handleAcceptInvite}>
                  <input
                    type="hidden"
                    name="inviteId"
                    value={invite.id}
                  />

                  <button
                    type="submit"
                    className="primary"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "7px",
                    }}
                  >
                    <Check size={17} />
                    Aceitar
                  </button>
                </form>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TEAMS */}
      {teams.length === 0 ? (
        <div
          style={{
            border: "1px dashed #343a45",
            borderRadius: "18px",
            minHeight: "420px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "40px",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "18px",
              background: "#16191f",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "20px",
            }}
          >
            <Users size={30} />
          </div>

          <h2
            style={{
              margin: 0,
              fontSize: "22px",
            }}
          >
            Ainda não tens equipas
          </h2>

          <p
            style={{
              color: "#858d99",
              maxWidth: "450px",
              lineHeight: 1.6,
              marginTop: "10px",
            }}
          >
            Cria a tua primeira equipa e depois podes convidar treinadores,
            analistas ou outros membros.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gap: "20px",
          }}
        >
          {teams.map((team) => {
            const isOwner = team.owner_id === user.id;
            const teamMembers = members[team.id] || [];

            return (
              <section
                key={team.id}
                style={{
                  background: "#111318",
                  border: "1px solid #242932",
                  borderRadius: "16px",
                  overflow: "hidden",
                }}
              >
                {/* TEAM HEADER */}
                <div
                  style={{
                    padding: "22px 24px",
                    borderBottom: "1px solid #242932",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "15px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "13px",
                    }}
                  >
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "12px",
                        background: "#1b1f27",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Users size={22} />
                    </div>

                    <div>
                      <h2
                        style={{
                          margin: 0,
                          fontSize: "20px",
                        }}
                      >
                        {team.name}
                      </h2>

                      <span
                        style={{
                          color: "#7f8794",
                          fontSize: "13px",
                        }}
                      >
                        {teamMembers.length}{" "}
                        {teamMembers.length === 1
                          ? "membro"
                          : "membros"}
                      </span>
                    </div>
                  </div>

                  {isOwner && (
                    <span
                      style={{
                        background: "#1d222a",
                        border: "1px solid #303640",
                        borderRadius: "20px",
                        padding: "6px 11px",
                        fontSize: "12px",
                        color: "#c7ccd4",
                      }}
                    >
                      Dono
                    </span>
                  )}
                </div>

                {/* INVITE */}
                {isOwner && (
                  <div
                    style={{
                      padding: "22px 24px",
                      borderBottom: "1px solid #242932",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "12px",
                      }}
                    >
                      <Mail size={17} />

                      <strong
                        style={{
                          fontSize: "15px",
                        }}
                      >
                        Convidar membro
                      </strong>
                    </div>

                    <form
                      action={handleInvite}
                      style={{
                        display: "flex",
                        gap: "10px",
                      }}
                    >
                      <input
                        type="hidden"
                        name="teamId"
                        value={team.id}
                      />

                      <input
                        type="email"
                        name="email"
                        placeholder="Email do treinador ou analista"
                        required
                        style={{
                          flex: 1,
                          background: "#191c22",
                          border: "1px solid #2b3039",
                          color: "#fff",
                          borderRadius: "9px",
                          padding: "11px 14px",
                        }}
                      />

                      <button
                        type="submit"
                        className="primary"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "7px",
                        }}
                      >
                        <Mail size={17} />
                        Convidar
                      </button>
                    </form>

                    <p
                      style={{
                        color: "#707885",
                        fontSize: "12px",
                        margin: "9px 0 0",
                      }}
                    >
                      O convite ficará disponível para esse email assim que
                      a pessoa iniciar sessão.
                    </p>
                  </div>
                )}

                {/* MEMBERS */}
                <div
                  style={{
                    padding: "22px 24px",
                  }}
                >
                  <h3
                    style={{
                      margin: "0 0 15px",
                      fontSize: "15px",
                    }}
                  >
                    Membros
                  </h3>

                  <div
                    style={{
                      display: "grid",
                      gap: "8px",
                    }}
                  >
                    {teamMembers.map((member) => {
                      const name =
                        member.profile?.full_name ||
                        member.profile?.email ||
                        "Utilizador";

                      const isCurrentUser = member.user_id === user.id;

                      return (
                        <div
                          key={member.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            background: "#191c22",
                            border: "1px solid #272c35",
                            borderRadius: "10px",
                            padding: "12px 14px",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontSize: "14px",
                                fontWeight: 600,
                              }}
                            >
                              {name}
                              {isCurrentUser && (
                                <span
                                  style={{
                                    color: "#737c89",
                                    fontWeight: 400,
                                    marginLeft: "7px",
                                  }}
                                >
                                  (tu)
                                </span>
                              )}
                            </div>

                            {member.profile?.email && (
                              <div
                                style={{
                                  color: "#727a87",
                                  fontSize: "12px",
                                  marginTop: "3px",
                                }}
                              >
                                {member.profile.email}
                              </div>
                            )}
                          </div>

                          <span
                            style={{
                              color: "#8e96a3",
                              fontSize: "12px",
                              textTransform: "capitalize",
                            }}
                          >
                            {member.role === "owner"
                              ? "Dono"
                              : member.role}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {!isOwner && (
                    <form
                      action={handleLeaveTeam}
                      style={{
                        marginTop: "18px",
                      }}
                    >
                      <input
                        type="hidden"
                        name="teamId"
                        value={team.id}
                      />

                      <button
                        type="submit"
                        style={{
                          background: "transparent",
                          border: "1px solid #383e48",
                          color: "#aeb5bf",
                          borderRadius: "9px",
                          padding: "9px 13px",
                          display: "flex",
                          alignItems: "center",
                          gap: "7px",
                          cursor: "pointer",
                        }}
                      >
                        <LogOut size={15} />
                        Sair da equipa
                      </button>
                    </form>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
