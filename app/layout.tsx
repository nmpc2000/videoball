import "./globals.css";
import { Inter } from "next/font/google";
import { acceptInvite } from "./teams/actions";

const inter = Inter({ subsets: ["latin"] });

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await acceptInvite();

  return (
    <html lang="pt">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
