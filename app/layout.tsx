import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Markus Admin",
  description: "Painel Administrativo — Markus",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
