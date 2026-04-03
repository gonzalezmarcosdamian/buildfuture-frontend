import { BottomNav } from "@/components/nav/BottomNav";
import { CurrencyProvider } from "@/lib/currency-context";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { TosGate } from "@/components/ui/TosGate";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CurrencyProvider>
          <TosGate>
            <main
              className="max-w-lg mx-auto min-h-screen bg-background text-foreground"
              style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 90px)" }}
            >
              {children}
            </main>
            <BottomNav />
          </TosGate>
        </CurrencyProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
