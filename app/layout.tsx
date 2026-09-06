import "./globals.css";
import { Inter } from "next/font/google";
import Link from "next/link";
import { acceptInvite } from "./teams/actions";

const inter = Inter({ subsets: ["latin"] });

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await acceptInvite();

  return (
    <html lang="pt">
      <body className={inter.className}>
        <div className="flex min-h-screen">

          {/* SIDEBAR */}
          <aside className="w-64 bg-gray-900 text-white flex flex-col p-6 gap-8">
            <h1 className="text-2xl font-bold tracking-wide">videoball</h1>

            <nav className="flex flex-col gap-4 text-lg">
              <Link href="/dashboard" className="hover:text-blue-400 transition">
                Jogos
              </Link>

              <Link href="/teams" className="hover:text-blue-400 transition">
                Equipas
              </Link>

              <Link href="/calendar" className="hover:text-blue-400 transition">
                Calendário
              </Link>
            </nav>

            <div className="mt-auto text-sm text-gray-400">
              Sessão ativa
            </div>
          </aside>

          {/* CONTEÚDO PRINCIPAL */}
          <main className="flex-1 bg-gray-100 p-10">
            {children}
          </main>

        </div>
      </body>
    </html>
  );
}
