import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google"; // Importar a fonte
import "./globals.css";
import QueryProvider from "@/components/providers/QueryProvider";
import { ClientProviders } from "@/components/providers/ClientProviders";

// Configurar a fonte
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap", // Opcional: melhora o carregamento da fonte
  variable: "--font-plus-jakarta-sans", // Opcional: se quiser usar como variável CSS
});

export const metadata: Metadata = {
  title: "AegisWallet",
  description: "Seu aplicativo de finanças pessoais.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" data-theme="horizon" className={plusJakartaSans.variable}>
      {/* Adicionando um comentário para garantir que não haja espaço literal antes do body */}
      <body className={plusJakartaSans.className}>
        <QueryProvider>
          <ClientProviders>
            {children}
          </ClientProviders>
        </QueryProvider>
      </body>
    </html>
  );
}
