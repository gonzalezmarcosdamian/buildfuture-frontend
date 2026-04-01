import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/nav/BottomNav";
import { CurrencyProvider } from "@/lib/currency-context";
import { AuthProvider } from "@/lib/auth-context";

const geist = Geist({ variable: "--font-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BuildFuture",
  description: "Tu libertad financiera, en números.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geist.variable} dark h-full`}>
      <body className="min-h-full bg-slate-950 text-slate-50 antialiased">
        <AuthProvider>
          <CurrencyProvider>
            <main className="max-w-lg mx-auto min-h-screen" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 90px)" }}>
              {children}
            </main>
            <BottomNav />
          </CurrencyProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
