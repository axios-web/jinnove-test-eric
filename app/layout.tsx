import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Estimateur de Soumission en Ligne | Toitures Boréal - Rive-Nord",
  description:
    "Calculez instantanément le prix de réfection de votre toiture sur la Rive-Nord (Laval, Blainville, Saint-Jérôme, Terrebonne). Devis rapide et sans engagement avec Toitures Boréal.",
  keywords: [
    "couvreur rive-nord",
    "toiture bardeaux",
    "estimation toiture québec",
    "toiture tôle rive-nord",
    "membrane élastomère laval",
    "prix toiture",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr-CA"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background font-sans text-foreground">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
