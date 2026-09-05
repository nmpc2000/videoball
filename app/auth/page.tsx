 "use client";
import {useState} from "react";
import {createClient} from "@/lib/supabase/client";
import {useRouter} from "next/navigation";
import {Mail,Lock,UserRound,ArrowRight} from "lucide-react";

export default function Auth(){
 const supabase=createClient(); const router=useRouter();
 const [mode,setMode]=useState<"login"|"signup">("login");
 const [email,setEmail]=useState("");const [password,setPassword]=useState("");const [name,setName]=useState("");const [error,setError]=useState("");const [busy,setBusy]=useState(false);
 async function submit(e:React.FormEvent){e.preventDefault();setError("");setBusy(true);
  if(mode==="signup"){
   const {error}=await supabase.auth.signUp({email,password,options:{data:{full_name:name}}});
   if(error)setError(error.message); else {setError("Conta criada. Se o email de confirmação estiver ativo, confirma o email antes de entrar.");setMode("login")}
  }else{
   const {error}=await supabase.auth.signInWithPassword({email,password});
   if(error)setError(error.message); else router.push("/dashboard");
  } setBusy(false);
 }
 return <main className="auth"><form className="auth-card" onSubmit={submit}><div className="brand">COACH<span>VISION</span></div><h1>{mode==="login"?"Bem-vindo de volta":"Criar conta"}</h1><p className="muted">{mode==="login"?"Entra para continuares a análise.":"Cria a tua conta de treinador."}</p>
 {mode==="signup"&&<label>Nome<div className="input"><UserRound size={18}/><input required value={name} onChange={e=>setName(e.target.value)} placeholder="O teu nome"/></div></label>}
 <label>Email<div className="input"><Mail size={18}/><input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="treinador@email.com"/></div></label>
 <label>Password<div className="input"><Lock size={18}/><input required minLength={6} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"/></div></label>
 {error&&<p className="error">{error}</p>}
 <button className="primary wide" disabled={busy}>{busy?"A processar...":mode==="login"?"Entrar":"Criar conta"} <ArrowRight size={18}/></button>
 <button type="button" className="ghost wide" onClick={()=>{setMode(mode==="login"?"signup":"login");setError("")}}>{mode==="login"?"Ainda não tenho conta":"Já tenho conta"}</button>
 </form></main>}