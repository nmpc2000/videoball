import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

async function getGames() {
  const sb = createClient();
  const { data: user } = await sb.auth.getUser();

  if (!user?.user) return [];

  const { data: games } = await sb
    .from("games")
    .select("*")
    .eq("user_id", user.user.id)
    .order("date", { ascending: false });

  return games || [];
}

export default async function DashboardPage() {
  const games = await getGames();

  return (
    <div className="space-y-8">

      {/* TÍTULO */}
      <div>
        <h1 className="text-3xl font-bold">Os teus jogos</h1>
      </div>

      {/* ESTATÍSTICAS */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded shadow">
          <p className="text-gray-500">Jogos</p>
          <p className="text-2xl font-bold">{games.length}</p>
        </div>

        <div className="bg-white p-6 rounded shadow">
          <p className="text-gray-500">Clips</p>
          <p className="text-2xl font-bold">0</p>
        </div>

        <div className="bg-white p-6 rounded shadow">
          <p className="text-gray-500">Eventos</p>
          <p className="text-2xl font-bold">0</p>
        </div>
      </div>

      {/* LISTA DE JOGOS */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Jogos</h2>
        <Link
          href="/games/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Novo jogo
        </Link>
      </div>

      <div className="space-y-4">
        {games.map((game) => (
          <Link
            key={game.id}
            href={`/games/${game.id}`}
            className="block bg-white p-4 rounded shadow hover:bg-gray-50"
          >
            <p className="text-lg font-semibold">{game.title}</p>
            <p className="text-gray-600">{game.opponent}</p>
            <p className="text-gray-500">
              {new Date(game.date).toLocaleDateString("pt-PT")}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
