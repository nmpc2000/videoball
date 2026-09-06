"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Video,
  Users,
  CalendarDays,
  Plus,
  LogOut,
  ChevronRight,
  Upload,
} from "lucide-react";

interface Game {
  id: string;
  name: string;
  opponent?: string | null;
  game_date: string;
}

export default function DashboardClient({
  userEmail,
  initialGames,
}: {
  userEmail: string;
  initialGames: Game[];
}) {
  const supabase = createClient();
  const router = useRouter();
  const [games, setGames] = useState<Game[]>(initialGames);
  const [show, setShow] = useState(false);
  const [name, setName] = useState("");
  const [opponent, setOpponent] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);

  async function createGame() {
    setBusy(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Precisas de ter sessão iniciada.");
      setBusy(false);
      return;
    }

    const { data, error } = await supabase
      .from("games")
      .insert({
        user_id: user.id,
        name: name || "Novo jogo",
        opponent,
        game_date: date,
      })
      .select()
      .single();

    if (error) {
      alert(error.message);
    } else {
      setGames([data, ...games]);
      setShow(false);
      setName("");
      setOpponent("");
      router.push("/games/" + data.id);
    }
    setBusy(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/auth");
  }

  return (
    <main className="app">
      <aside>
        <div className="brand">
          COACH<span>VISION</span>
        </div>
        <nav>
          <Link className="active" href="/dashboard">
            <Video /> Jogos
          </Link>
          <Link href="/teams">
            <Users /> Equipas
          </Link>
          <Link href="/calendar">
            <CalendarDays /> Calendário
          </Link>
        </nav>
        <button className="logout" onClick={logout}>
          <LogOut /> {userEmail}
        </button>
      </aside>

      <section className="content">
        <header>
          <div>
            <p className="eyebrow">WORKSPACE</p>
            <h1>Os teus jogos</h1>
          </div>
          <button className="primary" onClick={() => setShow(true)}>
            <Plus /> Novo jogo
          </button>
        </header>

        <div className="stats">
          <div>
            <span>Jogos</span>
            <b>{games.length}</b>
          </div>
          <div>
            <span>Clips</span>
            <b>0</b>
          </div>
          <div>
            <span>Eventos</span>
            <b>0</b>
          </div>
        </div>

        {games.length === 0 ? (
          <div className="empty">
            <Upload size={42} />
            <h2>Ainda não tens jogos</h2>
            <p>
              Cria o primeiro jogo e carrega o vídeo diretamente do iPhone ou
              computador.
            </p>
            <button className="primary" onClick={() => setShow(true)}>
              Adicionar jogo
            </button>
          </div>
        ) : (
          <div className="game-grid">
            {games.map((g) => (
              <Link key={g.id} href={"/games/" + g.id} className="game-card">
                <div className="thumb">
                  <Video />
                </div>
                <div>
                  <h3>{g.name}</h3>
                  <p>
                    {g.opponent || "Adversário por definir"} · {g.game_date}
                  </p>
                </div>
                <ChevronRight />
              </Link>
            ))}
          </div>
        )}

        {show && (
          <div className="modal-back">
            <div className="modal">
              <h2>Novo jogo</h2>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome do jogo"
              />
              <input
                value={opponent}
                onChange={(e) => setOpponent(e.target.value)}
                placeholder="Adversário"
              />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              <div className="actions">
                <button className="ghost" onClick={() => setShow(false)}>
                  Cancelar
                </button>
                <button
                  className="primary"
                  disabled={busy}
                  onClick={createGame}
                >
                  Criar
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
