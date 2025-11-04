import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Interface de Talentos",
  description: "Listagem de talentos com filtros e busca",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
