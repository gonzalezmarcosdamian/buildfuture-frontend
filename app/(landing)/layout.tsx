import { LandingNav } from "@/components/landing/LandingNav";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { CookieBanner } from "@/components/landing/CookieBanner";

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dark min-h-screen bg-slate-950 text-slate-100">
      <LandingNav />
      {children}
      <LandingFooter />
      <CookieBanner />
    </div>
  );
}
