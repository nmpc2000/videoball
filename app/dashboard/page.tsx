import {createClient} from "@/lib/supabase/server";
import DashboardClient from "./ui";
export default async function Dashboard(){
 const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser();
 const {data:games}=await supabase.from("games").select("*").order("game_date",{ascending:false});
 return <DashboardClient userEmail={user?.email||""} initialGames={games||[]}/>
}