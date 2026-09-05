import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest){
  let response = NextResponse.next({request});
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {cookies:{
      getAll(){return request.cookies.getAll()},
      setAll(cookiesToSet){
        cookiesToSet.forEach(({name,value})=>request.cookies.set(name,value));
        response = NextResponse.next({request});
        cookiesToSet.forEach(({name,value,options})=>response.cookies.set(name,value,options));
      }
    }}
  );
  const {data:{user}} = await supabase.auth.getUser();
  const pathname=request.nextUrl.pathname;
  if(!user && pathname.startsWith("/dashboard")) return NextResponse.redirect(new URL("/auth",request.url));
  if(!user && pathname.startsWith("/games/")) return NextResponse.redirect(new URL("/auth",request.url));
  if(user && pathname==="/auth") return NextResponse.redirect(new URL("/dashboard",request.url));
  return response;
}
export const config={matcher:["/((?!_next/static|_next/image|favicon.ico).*)"]};