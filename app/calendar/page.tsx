import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface GameItem {
  id: string;
  name?: string;
  title?: string;
  opponent?: string;
  game_date?: string;
  date?: string;
  team_id?: string;
}

async function getCalendarData() {
  const sb = await createClient();
  const { data: user } = await sb.auth.getUser();

  if (!user?.user) return { games: [] as GameItem[] };

  const { data: games } = await sb
    .from("games")
    .select("id, name, opponent, game_date, team_id")
    .order("game_date", { ascending: true });

  return { games: (games || []) as GameItem[] };
}

export default async function CalendarPage() {
  const { games } = await getCalendarData();

  return (
    <main className="content" style={{ minHeight: "100vh", maxWidth: "800px", margin: "0 auto", padding: "40px 20px" }}>
      <header className="topbar" style={{ marginBottom: "24px" }}>
        <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: "8px", color: "#aab1bc" }}>
          <ArrowLeft size={18} /> Voltar ao Dashboard
        </Link>
      </header>

      <h1 style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "24px" }}>Calendário</h1>

      {games.length === 0 ? (
        <div className="empty">
          <h2>Ainda não tens jogos no calendário.</h2>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
          {games.map((game: GameItem) => {
            const displayTitle = game.name || game.title || "Jogo";
            const displayDate = game.game_date || game.date;

            return (
              <div
                key={game.id}
                style={{
                  background: "#111318",
                  border: "1px solid #242932",
                  borderRadius: "14px",
                  padding: "18px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <div>
                  <h2 style={{ fontSize: "16px", fontWeight: 600, margin: "0 0 4px 0" }}>{displayTitle}</h2>
                  <p style={{ color: "#808895", fontSize: "13px", margin: 0 }}>
                    {game.opponent || "Sem adversário"}
                  </p>
                </div>
                {displayDate && (
                  <span style={{ color: "#aeb5c0", fontSize: "14px", fontVariantNumeric: "tabular-nums" }}>
                    {new Date(displayDate).toLocaleDateString("pt-PT")}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
