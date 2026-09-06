import { createClient } from "@/lib/supabase/server";

async function getCalendarData() {
  const sb = createClient();
  const { data: user } = await sb.auth.getUser();

  if (!user?.user) return { games: [] };

  // Jogos do utilizador OU da equipa onde ele está
  const { data: games } = await sb
    .from("games")
    .select("id, title, opponent, date, team_id")
    .or(`user_id.eq.${user.user.id},team_id.in.(select team_id from team_members where user_id = '${user.user.id}')`)
    .order("date", { ascending: true });

  return { games: games || [] };
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
        {games.map((game) => (
          <div
            key={game.id}
            className="border rounded-lg p-4 bg-white shadow-sm"
          >
            <h2 className="text-xl font-semibold">{game.title}</h2>
            <p className="text-gray-600">{game.opponent}</p>
            <p className="text-gray-500 mt-2">
              {new Date(game.date).toLocaleDateString("pt-PT")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
