import { createClient } from "@/lib/supabase/server";

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
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Calendário</h1>

      {games.length === 0 && (
        <p className="text-gray-500">Ainda não tens jogos no calendário.</p>
      )}

      <div className="flex flex-col gap-4">
        {games.map((game: GameItem) => {
          const displayTitle = game.name || game.title || "Jogo";
          const displayDate = game.game_date || game.date;

          return (
            <div
              key={game.id}
              className="border rounded-lg p-4 bg-white shadow-sm"
            >
              <h2 className="text-xl font-semibold">{displayTitle}</h2>
              <p className="text-gray-600">{game.opponent || "Sem adversário"}</p>
              {displayDate && (
                <p className="text-gray-500 mt-2">
                  {new Date(displayDate).toLocaleDateString("pt-PT")}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
