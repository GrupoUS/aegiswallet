import "./globals.css";
import QueryProvider from "@/components/providers/QueryProvider";
import { ClientProviders } from "@/components/providers/ClientProviders";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="font-plus-jakarta-sans">
      <QueryProvider>
        <ClientProviders>
          {children}
        </ClientProviders>
      </QueryProvider>
    </div>
  );
}
