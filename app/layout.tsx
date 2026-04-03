import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BuildFuture — Tu libertad financiera, en números.",
  description:
    "Conectá IOL, Cocos, PPI y Binance. Mirá en tiempo real qué tan cerca estás de vivir de tus inversiones.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geist.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full antialiased">
        {children}
      </body>
    </html>
  );
}
