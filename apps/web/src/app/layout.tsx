import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DevCapacity Manager — Safir Consulting",
  description: "Plateforme intelligente de gestion des tickets, des addons SAP B1 / S/4HANA et de la capacité de développement pour la SME Business Unit.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="dark">
      <body className="antialiased selection:bg-sky-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
