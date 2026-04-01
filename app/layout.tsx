import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "IdeaPaís Sistema de Datos",
  description: "ERP + CRM para operación, formación y continuidad de datos."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
