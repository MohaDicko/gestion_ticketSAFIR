import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ticket Manager — Safir Consulting",
  description: "Plateforme intelligente de gestion des tickets, des addons SAP B1 / S/4HANA et de la capacité de développement pour la SME Business Unit.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="antialiased text-slate-900 bg-slate-50 selection:bg-sky-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
