import { BottomNav } from "@/components/nav/BottomNav";
import { CurrencyProvider } from "@/lib/currency-context";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/components/ui/ThemeProvider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CurrencyProvider>
          <main
            className="max-w-lg mx-auto min-h-screen bg-background text-foreground"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 90px)" }}
          >
            {children}
          </main>
          <BottomNav />
        </CurrencyProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
