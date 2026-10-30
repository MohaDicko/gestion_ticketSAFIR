import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tandem — Du besoin à la solution. | Safir Consulting",
  description: "Tandem — Du besoin à la solution. Plateforme de gouvernance des tickets, addons SAP B1 / S/4HANA et capacité de développement pour Safir Consulting.",
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
