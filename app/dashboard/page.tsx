import { createClient } from "@/lib/supabase/server";
import DashboardClient from "./ui";

interface Game {
  id: string;
  name: string;
  opponent?: string | null;
  game_date: string;
  video_path?: string | null;
  video_name?: string | null;
  video_size?: number | null;
  user_id: string;
  team_id?: string | null;
  teams?: { name: string } | null;
}

interface Team {
  id: string;
  name: string;
}

export default async function Dashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Carrega as equipas do utilizador
  const { data: teams } = await supabase
    .from("teams")
    .select("id, name")
    .order("name", { ascending: true });

  // Carrega os jogos próprios ou das equipas
  const { data: games } = await supabase
    .from("games")
    .select("*, teams(name)")
    .order("game_date", { ascending: false });

  return (
    <DashboardClient
      userEmail={user?.email || ""}
      initialGames={(games as unknown as Game[]) || []}
      teams={(teams as Team[]) || []}
    />
  );
}
