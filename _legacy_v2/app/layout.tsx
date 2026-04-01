import type { Metadata } from "next";
import { Playfair_Display, Source_Sans_3 } from "next/font/google";

import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap"
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans",
  display: "swap"
});

export const metadata: Metadata = {
  title: "IdeaPaís | Backoffice",
  description: "Backoffice analítico para IdeaPaís"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${playfair.variable} ${sourceSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
