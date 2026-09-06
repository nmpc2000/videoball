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
  created_at: string;
}

export default async function Dashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: games } = await supabase
    .from("games")
    .select("*")
    .order("game_date", { ascending: false });

  return (
    <DashboardClient
      userEmail={user?.email || ""}
      initialGames={(games as Game[]) || []}
    />
  );
}
