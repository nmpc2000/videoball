import {createClient} from "@/lib/supabase/server";
import GameClient from "./ui";
export default async function GamePage({params}:{params:Promise<{id:string}>}){
 const {id}=await params; const supabase=await createClient();
 const {data:game}=await supabase.from("games").select("*").eq("id",id).single();
 if(!game)return <div className="loading">Jogo não encontrado.</div>;
 const {data:events}=await supabase.from("events").select("*").eq("game_id",id).order("time_seconds");
 return <GameClient game={game} initialEvents={events||[]}/>;
}